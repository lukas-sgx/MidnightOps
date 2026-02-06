import { pool } from '../config/db';
import { Router } from 'express';
import { authenticateToken } from '../middlewares/jwt';
import redisClient from '../config/redis';

const router = Router();

router.get('/teams', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1] || "";
    const userData = authenticateToken(token);
    if (userData == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    await redisClient.get(`auth_token_${userData.email}`).then((storedToken) => {
        if (storedToken === token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    });

    await pool.query('SELECT * FROM teams').then((result) => {
        return res.status(200).json({ teams: result.rows });
    }).catch((err) => {
        console.error('Error fetching teams from database', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    });
});

router.get('/teams/:id', async (req, res) => {
    const teamId = req.params.id;
    const token = req.headers.authorization?.split(" ")[1] || "";
    const userData = authenticateToken(token);
    if (userData == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    await redisClient.get(`auth_token_${userData.email}`).then((storedToken) => {
        if (storedToken === token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    });

    try {
        const teamResult = await pool.query('SELECT * FROM teams WHERE id = $1', [teamId]);
        const teamMembersResult = await pool.query('SELECT * FROM team_members WHERE team_id = $1', [teamId]);
        var userId;
        var memberResult;
        var member;
        var members = [];

        if (teamMembersResult.rows.length === 0) {
            return res.status(404).json({ message: 'Team not found' });
        }
        for (member of teamMembersResult.rows) {
            userId = member.user_id;
            memberResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
            if (memberResult.rows.length === 0) {
                return res.status(404).json({ message: 'Member not found' });
            }
            members.push(memberResult.rows[0]);
        }
        return res.status(200).json({ team: teamResult.rows[0], members: members });
    } catch (err) {
        console.error('Error fetching team from database', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/services', async (req, res) => {
    if (authenticateToken(req.headers.authorization?.split(" ")[1] || "") == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const result = await pool.query('SELECT * FROM services');
        res.status(200).json({ services: result.rows });
    } catch (err) {
        console.error('Error fetching services', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;