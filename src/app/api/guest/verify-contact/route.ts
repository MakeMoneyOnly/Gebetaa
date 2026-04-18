import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const SendVerificationSchema = z.object({
    guestId: z.string().uuid(),
    channel: z.enum(['sms', 'email']),
});

const VerifyContactSchema = z.object({
    guestId: z.string().uuid(),
    code: z.string().length(6, 'Verification code must be 6 digits'),
});

/**
 * POST /api/guest/verify-contact
 * Send verification code to guest's contact
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = SendVerificationSchema.safeParse(body);

        if (!parsed.success) {
            return apiError('Invalid request', 400, 'INVALID_REQUEST', parsed.error.issues);
        }

        const { guestId, channel } = parsed.data;
        const supabase = createServiceRoleClient();

        // Get guest
        // HIGH-013: Explicit column selection
        const { data: guest, error: guestError } = await supabase
            .from('guests')
            .select(
                'id, restaurant_id, name, phone, email, phone_hash, email_hash, metadata, is_vip, language, tags, visit_count, lifetime_value, notes, created_at, updated_at'
            )
            .eq('id', guestId)
            .single();

        if (guestError || !guest) {
            return apiError('Guest not found', 404, 'GUEST_NOT_FOUND');
        }

        // Generate verification code (6 digits)
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const metadata = guest.metadata || {};

        // Store code in guest metadata
        await supabase
            .from('guests')
            .update({
                metadata: {
                    ...metadata,
                    verification_code: code,
                    verification_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                },
            })
            .eq('id', guestId);

        // Send verification code
        if (channel === 'sms') {
            if (!guest.phone) {
                return apiError('No phone number on file', 400, 'NO_PHONE');
            }

            const { sendSms } = await import('@/lib/notifications/sms');
            const result = await sendSms(
                guest.phone,
                `Your lole verification code is: ${code}. This code expires in 10 minutes.`
            );

            if (!result.success) {
                return apiError('Failed to send SMS', 500, 'SMS_FAILED', result.error);
            }
        } else if (channel === 'email') {
            if (!guest.email) {
                return apiError('No email on file', 400, 'NO_EMAIL');
            }

            const { resend, EMAIL_FROM } = await import('@/lib/email/client');

            if (!resend) {
                return apiError('Email service not configured', 500, 'EMAIL_NOT_CONFIGURED');
            }

            try {
                await resend.emails.send({
                    from: EMAIL_FROM,
                    to: guest.email,
                    subject: 'Verify your contact info - lole',
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #0D3B40;">Verify your contact</h1>
              <p>Your verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                ${code}
              </div>
              <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
            </div>
          `,
                });
            } catch (emailError) {
                return apiError('Failed to send email', 500, 'EMAIL_FAILED', String(emailError));
            }
        }

        return apiSuccess({ message: 'Verification code sent' });
    } catch (error) {
        console.error('Error in verify-contact:', error);
        return apiError('Internal server error', 500, 'INTERNAL_ERROR');
    }
}

/**
 * PATCH /api/guest/verify-contact
 * Verify the code entered by guest
 */
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const parsed = VerifyContactSchema.safeParse(body);

        if (!parsed.success) {
            return apiError('Invalid request', 400, 'INVALID_REQUEST', parsed.error.issues);
        }

        const { guestId, code } = parsed.data;
        const supabase = createServiceRoleClient();

        // Get guest
        // HIGH-013: Explicit column selection
        const { data: guest, error: guestError } = await supabase
            .from('guests')
            .select(
                'id, restaurant_id, name, phone, email, phone_hash, email_hash, metadata, is_vip, language, tags, visit_count, lifetime_value, notes, created_at, updated_at'
            )
            .eq('id', guestId)
            .single();

        if (guestError || !guest) {
            return apiError('Guest not found', 404, 'GUEST_NOT_FOUND');
        }

        const metadata = guest.metadata || {};
        const storedCode = metadata.verification_code;
        const expires = metadata.verification_expires;

        // Check code
        if (!storedCode || storedCode !== code) {
            return apiError('Invalid verification code', 400, 'INVALID_CODE');
        }

        // Check expiry
        if (expires && new Date(expires) < new Date()) {
            return apiError('Verification code expired', 400, 'CODE_EXPIRED');
        }

        // Mark as verified
        await supabase
            .from('guests')
            .update({
                is_verified: true,
                metadata: {
                    ...metadata,
                    verification_code: null,
                    verification_expires: null,
                    verified_at: new Date().toISOString(),
                },
            })
            .eq('id', guestId);

        return apiSuccess({ message: 'Contact verified successfully' });
    } catch (error) {
        console.error('Error in verify-contact PATCH:', error);
        return apiError('Internal server error', 500, 'INTERNAL_ERROR');
    }
}
