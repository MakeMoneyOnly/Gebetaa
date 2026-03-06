import { createHash, createHmac, createSign } from 'crypto';

export type InvoiceExtractionProvider =
    | 'aws_textract'
    | 'google_document_ai'
    | 'azure_document_intelligence'
    | 'oss';

export type InvoiceExtractionResult = {
    provider: InvoiceExtractionProvider;
    raw_text: string;
    confidence: number;
    fields?: {
        supplier_name?: string | null;
        invoice_number?: string | null;
        currency?: string | null;
        subtotal?: number | null;
        tax_amount?: number | null;
        total_amount?: number | null;
        issued_at?: string | null;
        due_at?: string | null;
    };
};

type IngestInput = {
    fileName: string;
    mimeType: string;
    bytes: Uint8Array;
    providerPreference?: 'auto' | InvoiceExtractionProvider;
};

function clampConfidence(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}

function parseMoney(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Number(value.toFixed(2));
    }
    if (typeof value !== 'string') return null;
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(parsed)) return null;
    return Number(parsed.toFixed(2));
}

function parseDate(value: unknown): string | null {
    if (typeof value !== 'string' || !value.trim()) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
}

function decodeJwtSection(value: string) {
    return Buffer.from(value, 'base64url').toString('utf-8');
}

function parseJwtExpiration(token: string): number | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
        const payload = JSON.parse(decodeJwtSection(parts[1])) as { exp?: number };
        return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
        return null;
    }
}

let cachedGoogleToken: { token: string; expiresAt: number } | null = null;

async function getGoogleAccessToken() {
    const serviceAccountJson = process.env.GOOGLE_DOCUMENT_AI_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
        throw new Error('GOOGLE_DOCUMENT_AI_SERVICE_ACCOUNT_JSON is not configured');
    }

    if (cachedGoogleToken && cachedGoogleToken.expiresAt > Date.now() + 60_000) {
        return cachedGoogleToken.token;
    }

    const serviceAccount = JSON.parse(serviceAccountJson) as {
        client_email: string;
        private_key: string;
        token_uri?: string;
    };

    if (!serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('Invalid GOOGLE_DOCUMENT_AI_SERVICE_ACCOUNT_JSON format');
    }

    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
        JSON.stringify({
            iss: serviceAccount.client_email,
            sub: serviceAccount.client_email,
            aud: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
            scope: 'https://www.googleapis.com/auth/cloud-platform',
            iat: now,
            exp: now + 3600,
        })
    ).toString('base64url');
    const unsigned = `${header}.${payload}`;
    const signer = createSign('RSA-SHA256');
    signer.update(unsigned);
    signer.end();
    const signature = signer.sign(serviceAccount.private_key, 'base64url');
    const assertion = `${unsigned}.${signature}`;

    const tokenResponse = await fetch(
        serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion,
            }),
        }
    );

    if (!tokenResponse.ok) {
        const text = await tokenResponse.text();
        throw new Error(`Google OAuth token request failed (${tokenResponse.status}): ${text}`);
    }

    const tokenPayload = (await tokenResponse.json()) as {
        access_token?: string;
        expires_in?: number;
    };

    if (!tokenPayload.access_token) {
        throw new Error('Google OAuth token response missing access_token');
    }

    const jwtExp = parseJwtExpiration(tokenPayload.access_token);
    const fallbackExpiry = Date.now() + (tokenPayload.expires_in ?? 3600) * 1000;
    cachedGoogleToken = {
        token: tokenPayload.access_token,
        expiresAt: jwtExp ? jwtExp * 1000 : fallbackExpiry,
    };
    return tokenPayload.access_token;
}

function sha256Hex(message: string | Buffer | Uint8Array) {
    return createHash('sha256').update(message).digest('hex');
}

function hmacSha256(key: Buffer | string, value: string) {
    return createHmac('sha256', key).update(value).digest();
}

function toHex(value: Buffer) {
    return value.toString('hex');
}

async function extractWithAwsTextract(input: IngestInput): Promise<InvoiceExtractionResult> {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const sessionToken = process.env.AWS_SESSION_TOKEN;

    if (!region || !accessKeyId || !secretAccessKey) {
        throw new Error('AWS Textract credentials are not configured');
    }

    const host = `textract.${region}.amazonaws.com`;
    const endpoint = `https://${host}`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const target = 'Textract.AnalyzeExpense';

    const body = JSON.stringify({
        Document: { Bytes: Buffer.from(input.bytes).toString('base64') },
    });

    const canonicalHeaders = [
        `content-type:application/x-amz-json-1.1`,
        `host:${host}`,
        `x-amz-date:${amzDate}`,
        `x-amz-target:${target}`,
        ...(sessionToken ? [`x-amz-security-token:${sessionToken}`] : []),
    ].join('\n');
    const signedHeaders = [
        'content-type',
        'host',
        'x-amz-date',
        'x-amz-target',
        ...(sessionToken ? ['x-amz-security-token'] : []),
    ].join(';');
    const canonicalRequest = [
        'POST',
        '/',
        '',
        `${canonicalHeaders}\n`,
        signedHeaders,
        sha256Hex(body),
    ].join('\n');
    const credentialScope = `${dateStamp}/${region}/textract/aws4_request`;
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        sha256Hex(canonicalRequest),
    ].join('\n');
    const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
    const kRegion = hmacSha256(kDate, region);
    const kService = hmacSha256(kRegion, 'textract');
    const kSigning = hmacSha256(kService, 'aws4_request');
    const signature = toHex(hmacSha256(kSigning, stringToSign));
    const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Date': amzDate,
            'X-Amz-Target': target,
            ...(sessionToken ? { 'X-Amz-Security-Token': sessionToken } : {}),
            Authorization: authorization,
        },
        body,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`AWS Textract AnalyzeExpense failed (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as {
        ExpenseDocuments?: Array<{
            SummaryFields?: Array<{
                Type?: { Text?: string };
                ValueDetection?: { Text?: string; Confidence?: number };
            }>;
            Blocks?: Array<{ BlockType?: string; Text?: string; Confidence?: number }>;
        }>;
    };

    const doc = payload.ExpenseDocuments?.[0];
    const summary = doc?.SummaryFields ?? [];
    const lines = (doc?.Blocks ?? [])
        .filter(block => block.BlockType === 'LINE' && typeof block.Text === 'string')
        .map(block => block.Text as string);
    const text = lines.join('\n');

    const findField = (key: string) =>
        summary.find(item => item.Type?.Text?.toUpperCase() === key)?.ValueDetection;

    const supplier = findField('VENDOR_NAME')?.Text ?? null;
    const invoiceNumber = findField('INVOICE_RECEIPT_ID')?.Text ?? null;
    const subtotal = parseMoney(findField('SUBTOTAL')?.Text ?? null);
    const taxAmount = parseMoney(findField('TAX')?.Text ?? null);
    const totalAmount = parseMoney(findField('TOTAL')?.Text ?? null);
    const issuedAt = parseDate(findField('INVOICE_RECEIPT_DATE')?.Text ?? null);
    const dueAt = parseDate(findField('DUE_DATE')?.Text ?? null);
    const avgConfidence =
        summary.length > 0
            ? clampConfidence(
                  summary.reduce((sum, item) => sum + (item.ValueDetection?.Confidence ?? 0), 0) /
                      summary.length /
                      100
              )
            : 0.6;

    return {
        provider: 'aws_textract',
        raw_text: text,
        confidence: avgConfidence,
        fields: {
            supplier_name: supplier,
            invoice_number: invoiceNumber,
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            issued_at: issuedAt,
            due_at: dueAt,
        },
    };
}

async function extractWithGoogleDocumentAi(input: IngestInput): Promise<InvoiceExtractionResult> {
    const processorName = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_NAME;
    if (!processorName) {
        throw new Error('GOOGLE_DOCUMENT_AI_PROCESSOR_NAME is not configured');
    }

    const accessToken = await getGoogleAccessToken();
    const endpoint = `https://documentai.googleapis.com/v1/${processorName}:process`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            rawDocument: {
                content: Buffer.from(input.bytes).toString('base64'),
                mimeType: input.mimeType,
            },
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google Document AI process failed (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as {
        document?: {
            text?: string;
            entities?: Array<{
                type?: string;
                mentionText?: string;
                normalizedValue?: { text?: string };
                confidence?: number;
            }>;
        };
    };
    const entities = payload.document?.entities ?? [];
    const byType = (entityType: string) =>
        entities.find(entity => entity.type === entityType)?.normalizedValue?.text ??
        entities.find(entity => entity.type === entityType)?.mentionText ??
        null;
    const avgConfidence =
        entities.length > 0
            ? clampConfidence(
                  entities.reduce((sum, entity) => sum + (entity.confidence ?? 0), 0) /
                      entities.length
              )
            : 0.6;

    return {
        provider: 'google_document_ai',
        raw_text: payload.document?.text ?? '',
        confidence: avgConfidence,
        fields: {
            supplier_name: byType('supplier_name'),
            invoice_number: byType('invoice_id'),
            currency: byType('currency'),
            subtotal: parseMoney(byType('subtotal_amount')),
            tax_amount: parseMoney(byType('total_tax_amount')),
            total_amount: parseMoney(byType('total_amount')),
            issued_at: parseDate(byType('invoice_date')),
            due_at: parseDate(byType('due_date')),
        },
    };
}

async function extractWithAzureDocumentIntelligence(
    input: IngestInput
): Promise<InvoiceExtractionResult> {
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY;
    if (!endpoint || !apiKey) {
        throw new Error('Azure Document Intelligence credentials are not configured');
    }

    const model = process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID || 'prebuilt-invoice';
    const version = process.env.AZURE_DOCUMENT_INTELLIGENCE_API_VERSION || '2024-11-30';
    const analyzeUrl = `${endpoint.replace(/\/$/, '')}/documentintelligence/documentModels/${model}:analyze?api-version=${version}`;

    const analyzeResponse = await fetch(analyzeUrl, {
        method: 'POST',
        headers: {
            'Content-Type': input.mimeType || 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': apiKey,
        },
        body: Buffer.from(input.bytes),
    });

    if (analyzeResponse.status !== 202) {
        const text = await analyzeResponse.text();
        throw new Error(
            `Azure Document Intelligence analyze failed (${analyzeResponse.status}): ${text}`
        );
    }

    const operationLocation = analyzeResponse.headers.get('operation-location');
    if (!operationLocation) {
        throw new Error('Azure Document Intelligence response missing operation-location');
    }

    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
        const pollResponse = await fetch(operationLocation, {
            headers: { 'Ocp-Apim-Subscription-Key': apiKey },
        });
        if (!pollResponse.ok) {
            const text = await pollResponse.text();
            throw new Error(`Azure polling failed (${pollResponse.status}): ${text}`);
        }
        const payload = (await pollResponse.json()) as {
            status?: string;
            analyzeResult?: {
                content?: string;
                documents?: Array<{
                    confidence?: number;
                    fields?: Record<
                        string,
                        {
                            valueString?: string;
                            valueCurrency?: { amount?: number; currencyCode?: string };
                            valueDate?: string;
                            confidence?: number;
                        }
                    >;
                }>;
            };
        };

        if (payload.status === 'succeeded') {
            const doc = payload.analyzeResult?.documents?.[0];
            const fields = doc?.fields ?? {};
            const readCurrency = (field: string) => fields[field]?.valueCurrency;
            const supplier = fields.VendorName?.valueString ?? null;
            const invoiceNumber = fields.InvoiceId?.valueString ?? null;
            const subtotal = readCurrency('SubTotal')?.amount ?? null;
            const taxAmount = readCurrency('TotalTax')?.amount ?? null;
            const totalAmount = readCurrency('InvoiceTotal')?.amount ?? null;
            const currency = readCurrency('InvoiceTotal')?.currencyCode ?? null;
            const issuedAt = parseDate(fields.InvoiceDate?.valueDate ?? null);
            const dueAt = parseDate(fields.DueDate?.valueDate ?? null);
            const fieldConfidences = Object.values(fields)
                .map(field => field.confidence)
                .filter((value): value is number => typeof value === 'number');
            const avgConfidence =
                fieldConfidences.length > 0
                    ? clampConfidence(
                          fieldConfidences.reduce((sum, value) => sum + value, 0) /
                              fieldConfidences.length
                      )
                    : clampConfidence(doc?.confidence ?? 0.6);

            return {
                provider: 'azure_document_intelligence',
                raw_text: payload.analyzeResult?.content ?? '',
                confidence: avgConfidence,
                fields: {
                    supplier_name: supplier,
                    invoice_number: invoiceNumber,
                    currency,
                    subtotal,
                    tax_amount: taxAmount,
                    total_amount: totalAmount,
                    issued_at: issuedAt,
                    due_at: dueAt,
                },
            };
        }

        if (payload.status === 'failed') {
            throw new Error('Azure Document Intelligence processing failed');
        }

        await new Promise(resolve => setTimeout(resolve, 1200));
    }

    throw new Error('Azure Document Intelligence timed out');
}

async function extractWithOpenSourceEndpoint(input: IngestInput): Promise<InvoiceExtractionResult> {
    const endpoint = process.env.INVOICE_OCR_OPEN_SOURCE_ENDPOINT;
    if (!endpoint) {
        throw new Error('INVOICE_OCR_OPEN_SOURCE_ENDPOINT is not configured');
    }

    const apiKey = process.env.INVOICE_OCR_OPEN_SOURCE_API_KEY;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
            file_name: input.fileName,
            mime_type: input.mimeType,
            content_base64: Buffer.from(input.bytes).toString('base64'),
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Open-source OCR endpoint failed (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as {
        text?: string;
        confidence?: number;
        fields?: {
            supplier_name?: string;
            invoice_number?: string;
            currency?: string;
            subtotal?: number;
            tax_amount?: number;
            total_amount?: number;
            issued_at?: string;
            due_at?: string;
        };
    };

    return {
        provider: 'oss',
        raw_text: payload.text ?? '',
        confidence: clampConfidence(payload.confidence ?? 0.5),
        fields: {
            supplier_name: payload.fields?.supplier_name ?? null,
            invoice_number: payload.fields?.invoice_number ?? null,
            currency: payload.fields?.currency ?? null,
            subtotal: parseMoney(payload.fields?.subtotal ?? null),
            tax_amount: parseMoney(payload.fields?.tax_amount ?? null),
            total_amount: parseMoney(payload.fields?.total_amount ?? null),
            issued_at: parseDate(payload.fields?.issued_at ?? null),
            due_at: parseDate(payload.fields?.due_at ?? null),
        },
    };
}

const ADDIS_DEFAULT_PROVIDER_ORDER: InvoiceExtractionProvider[] = [
    'oss',
    'azure_document_intelligence',
    'google_document_ai',
    'aws_textract',
];

function parseProviderOrderFromEnv() {
    const configured = process.env.INVOICE_OCR_PROVIDER_ORDER;
    if (!configured?.trim()) return ADDIS_DEFAULT_PROVIDER_ORDER;

    const parsed = configured
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean)
        .map(entry => {
            if (entry === 'oss') return 'oss';
            if (entry === 'azure') return 'azure_document_intelligence';
            if (entry === 'google') return 'google_document_ai';
            if (entry === 'aws') return 'aws_textract';
            return null;
        })
        .filter((entry): entry is InvoiceExtractionProvider => Boolean(entry));

    return parsed.length > 0 ? parsed : ADDIS_DEFAULT_PROVIDER_ORDER;
}

export function getAddisInvoiceReviewPolicy(result: {
    providerConfidence: number;
    mappedRatio: number;
    averageMatchConfidence: number;
}) {
    const autoReceiveEligible =
        result.providerConfidence >= 0.9 &&
        result.averageMatchConfidence >= 0.88 &&
        result.mappedRatio >= 0.85;
    return {
        city_profile: 'addis_ababa',
        auto_receive_eligible: autoReceiveEligible,
        recommended_mode: autoReceiveEligible ? 'auto_receive' : 'human_review',
        thresholds: {
            provider_confidence_min: 0.9,
            mapped_ratio_min: 0.85,
            match_confidence_min: 0.88,
        },
    };
}

export async function ingestInvoiceDocument(input: IngestInput): Promise<InvoiceExtractionResult> {
    const providerOrder =
        input.providerPreference && input.providerPreference !== 'auto'
            ? [input.providerPreference]
            : parseProviderOrderFromEnv();

    const errors: string[] = [];

    for (const provider of providerOrder) {
        try {
            if (provider === 'oss') {
                const result = await extractWithOpenSourceEndpoint(input);
                if (result.raw_text.trim()) return result;
                errors.push(`${provider}: empty text result`);
                continue;
            }

            if (provider === 'azure_document_intelligence') {
                const result = await extractWithAzureDocumentIntelligence(input);
                if (result.raw_text.trim()) return result;
                errors.push(`${provider}: empty text result`);
                continue;
            }

            if (provider === 'google_document_ai') {
                const result = await extractWithGoogleDocumentAi(input);
                if (result.raw_text.trim()) return result;
                errors.push(`${provider}: empty text result`);
                continue;
            }

            if (provider === 'aws_textract') {
                const result = await extractWithAwsTextract(input);
                if (result.raw_text.trim()) return result;
                errors.push(`${provider}: empty text result`);
                continue;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push(`${provider}: ${message}`);
        }
    }

    throw new Error(`Invoice extraction failed across providers. ${errors.join(' | ')}`);
}
