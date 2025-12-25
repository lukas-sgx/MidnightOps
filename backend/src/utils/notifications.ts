import nodemailer from 'nodemailer';
import path from 'path';

export async function notifyOncallUser(userEmail: string, alertId: number, message: string, severity: string) {
    const transporter = nodemailer.createTransport({
        host: "mail.soigneux.works",
        port: 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const info = await transporter.sendMail({
        from: '"MidnightOps Support" <noreply@soigneux.works>',
        to: userEmail,
        subject: `Alert Notification - Alert ID: ${alertId}`,
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 20px; text-align: center;">
                        <img src="cid:logo" alt="MidnightOps Logo" style="width: 60px; height: 60px;" />
                        <h1 style="color: white; margin: 10px 0;">MidnightOps Alert</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #1e293b;">Alert Notification</h2>
                        <p style="color: #475569; font-size: 16px;">You have a new alert with the following ID:</p>
                        <div style="background: #0f172a; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 4px;">
                            ${alertId}
                        </div>
                        <p style="color: #475569; font-size: 16px;">Message: ${message}</p>
                        <p style="color: #475569; font-size: 16px;">Severity: ${severity}</p>
                        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">Please address this alert promptly.</p>
                    </div>
                    <div style="background: #1e293b; padding: 15px; text-align: center;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2025 MidnightOps. All rights reserved.</p>
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
}

export default notifyOncallUser;