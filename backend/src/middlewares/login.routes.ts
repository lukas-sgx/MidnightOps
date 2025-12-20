import { pool } from '../config/db';
import { Router } from 'express';
import { generateToken } from './jwt';
import nodemailer from 'nodemailer';
import redisClient from '../config/redis';

const router = Router();

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function send_code(dest: string, code: number) {
  const transporter = nodemailer.createTransport({
    host: "mail.soigneux.works",
    port: 587,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const info = await transporter.sendMail({
    from: '"Support" <noreply@soigneux.works>',
    to: dest,
    subject: "Your verification code",
    html: "<p>Your verification code is: <b>" + code + "</b></p>",
  });

  console.log("Message ID:", info.messageId);
}

router.post('/login', async (req, res) => {
    const { email } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 1) {
            const code = getRandomInt(100000, 999999);
            await send_code(email, code);
            await redisClient.setEx(`login_code_${email}`, 600, code.toString());
        }
        return res.status(200).json({ message: 'If the email exists, a verification code has been sent.' });
        const token = generateToken({ userId: result.rows[0].id, email: result.rows[0].email });
        return res.status(200).json({ message: 'Login successful', user: result.rows[0], token: token});
    } catch (err) {
        console.error('Error during login', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;