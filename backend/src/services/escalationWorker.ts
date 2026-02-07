import { pool } from "../config/db";
import { notifyOncallUser } from "../utils/notifications";

async function getOnCallForTeam(teamId: number) {
    const query = `
        SELECT u.id, u.email, u.name
        FROM oncall_shifts s
        JOIN users u ON s.user_id = u.id
        JOIN oncall_schedules os ON s.schedule_id = os.id
        WHERE os.team_id = $1 AND NOW() BETWEEN s.starts_at AND s.ends_at
    `;
    const result = await pool.query(query, [teamId]);
    return result.rows;
}

export async function processEscalations() {
    console.log("Processing escalations...");
    try {
        const incidents = await pool.query(`
            SELECT i.*, s.team_id as service_team_id
            FROM incidents i
            LEFT JOIN services s ON i.service_id = s.id
            WHERE i.status = 'OPEN'
        `);

        for (const incident of incidents.rows) {
            const { id, severity, service_id, current_escalation_level, last_notified_at } = incident;

            const isCriticalOrMajor = severity >= 2;

            if (!isCriticalOrMajor) {
                if (!last_notified_at) {
                    await notifyInitial(incident);
                }
                continue;
            }

            const policyResult = await pool.query(
                "SELECT * FROM escalation_policies WHERE service_id = $1",
                [service_id]
            );

            if (policyResult.rows.length === 0) {
                if (!last_notified_at) await notifyInitial(incident);
                continue;
            }

            const policyId = policyResult.rows[0].id;
            const levelsResult = await pool.query(
                "SELECT * FROM escalation_policy_levels WHERE escalation_policy_id = $1 ORDER BY level_index ASC",
                [policyId]
            );

            const levels = levelsResult.rows;
            if (levels.length === 0) {
                if (!last_notified_at) await notifyInitial(incident);
                continue;
            }

            if (!last_notified_at) {
                await notifyLevel(incident, levels[0]);
                continue;
            }

            const currentLevel = levels.find(l => l.level_index === current_escalation_level);
            if (!currentLevel) {
                continue;
            }

            const nextLevel = levels.find(l => l.level_index === current_escalation_level + 1);
            if (!nextLevel) {
                continue;
            }

            const lastNotified = new Date(last_notified_at);
            const now = new Date();
            const diffMinutes = (now.getTime() - lastNotified.getTime()) / (1000 * 60);

            if (diffMinutes >= currentLevel.delay_minutes) {
                await notifyLevel(incident, nextLevel);
            }
        }
    } catch (err) {
        console.error("Error in escalation worker:", err);
    }
}

async function notifyInitial(incident: any) {
    const teamId = incident.service_team_id;
    if (teamId) {
        const oncall = await getOnCallForTeam(teamId);
        for (const user of oncall) {
            await notifyOncallUser(user.email, incident.id, `New Incident: ${incident.title}`, `SEV${4 - incident.severity}`, user.id);
        }
    }
    await pool.query("UPDATE incidents SET last_notified_at = NOW() WHERE id = $1", [incident.id]);
}

async function notifyLevel(incident: any, level: any) {
    let notifiedAny = false;
    if (level.user_id) {
        const userRes = await pool.query("SELECT email FROM users WHERE id = $1", [level.user_id]);
        if (userRes.rows.length > 0) {
            await notifyOncallUser(userRes.rows[0].email, incident.id, `[Escalation L${level.level_index}] ${incident.title}`, `SEV${4 - incident.severity}`, level.user_id);
            notifiedAny = true;
        }
    } else if (level.team_id) {
        const oncall = await getOnCallForTeam(level.team_id);
        for (const user of oncall) {
            await notifyOncallUser(user.email, incident.id, `[Escalation L${level.level_index}] ${incident.title}`, `SEV${4 - incident.severity}`, user.id);
            notifiedAny = true;
        }
    }

    if (notifiedAny) {
        await pool.query(
            "UPDATE incidents SET current_escalation_level = $1, last_notified_at = NOW() WHERE id = $2",
            [level.level_index, incident.id]
        );
    }
}

export function startEscalationWorker(intervalMs: number = 60000) {
    setInterval(processEscalations, intervalMs);
}
