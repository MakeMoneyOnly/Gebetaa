import { NextRequest, NextResponse } from 'next/server';

function isAuthorized(request: NextRequest): boolean {
    const configuredKey = process.env.QSTASH_TOKEN;
    if (!configuredKey) {
        return process.env.NODE_ENV !== 'production';
    }

    return request.headers.get('x-gebeta-job-key') === configuredKey;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            {
                error: {
                    code: 'UNAUTHORIZED_JOB',
                    message: 'Job request is not authorized',
                },
            },
            { status: 401 }
        );
    }

    return NextResponse.json({
        data: {
            queued: true,
            job: 'eod-report',
            note: 'Cron endpoint is ready for QStash scheduling.',
        },
    });
}
