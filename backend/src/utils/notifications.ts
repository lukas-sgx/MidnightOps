import nodemailer from 'nodemailer';
import path from 'path';
import { pool } from '../config/db';

export async function notifyOncallUser(
    userEmail: string, 
    incidentId: number, 
    message: string, 
    severity: string,
    userId?: number
) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "mail.soigneux.works",
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const maxRetries = 3;
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
        try {
            const info = await transporter.sendMail({
                from: '"MidnightOps Support" <noreply@soigneux.works>',
                to: userEmail,
                subject: `Incident Notification - ID: ${incidentId}`,
                html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 20px; text-align: center;">
                                <img src="cid:logo" alt="MidnightOps Logo" style="width: 60px; height: 60px;" />
                                <h1 style="color: white; margin: 10px 0;">MidnightOps Alert</h1>
                            </div>
                            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
                                <h2 style="color: #1e293b;">Incident Notification</h2>
                                <p style="color: #475569; font-size: 16px;">You have a new notification for incident:</p>
                                <div style="background: #0f172a; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 4px;">
                                    #${incidentId}
                                </div>
                                <p style="color: #475569; font-size: 16px;">Message: ${message}</p>
                                <p style="color: #475569; font-size: 16px;">Severity: ${severity}</p>
                                <p style="color: #64748b; font-size: 14px; margin-top: 20px;">Please address this incident promptly.</p>
                            </div>
                            <div style="background: #1e293b; padding: 15px; text-align: center;">
                                <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 MidnightOps. All rights reserved.</p>
                            </div>
                        </div>
                    `,
                attachments: [
                    {
                        filename: 'logo.png',
                        path: path.join(__dirname, '../public/midnightops.png'),
                        cid: 'logo'
                    }
                ]
            });

            await pool.query(
                'INSERT INTO notifications (incident_id, user_id, channel, status, sent_at) VALUES ($1, $2, $3, $4, NOW())',
                [incidentId, userId || null, 'email', 'SENT']
            );
            
            console.log(`Notification sent to ${userEmail} for incident ${incidentId}`);
            return;
        } catch (error: any) {
            attempt++;
            lastError = error;
            console.error(`Attempt ${attempt} failed to send notification to ${userEmail}:`, error.message);
            if (attempt < maxRetries) {
                await new Promise(res => setTimeout(res, 2000 * attempt));
            }
        }
    }

    try {
        await pool.query(
            'INSERT INTO notifications (incident_id, user_id, channel, status, error_message, sent_at) VALUES ($1, $2, $3, $4, $5, NOW())',
            [incidentId, userId || null, 'email', 'FAILED', lastError?.message || 'Unknown error']
        );
    } catch (dbErr) {
        console.error('Failed to log failed notification to DB:', dbErr);
    }
}

export default notifyOncallUser;