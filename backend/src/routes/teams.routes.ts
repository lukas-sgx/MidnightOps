import { pool } from '../config/db';
import { Router } from 'express';

const router = Router();

router.get('/teams', async (_req, res) => {
    await pool.query('SELECT * FROM teams').then((result) => {
        return res.status(200).json({ teams: result.rows });
    }).catch((err) => {
        console.error('Error fetching teams from database', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    });
});

router.get('/teams/:id', async (req, res) => {
    const teamId = req.params.id;
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

export default router;