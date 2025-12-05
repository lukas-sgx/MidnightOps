import { Router } from "express";
import { isDatabaseConnected, pool } from "../config/db";

const router = Router();

router.get("/incidents", async (_req, res) => {
    await isDatabaseConnected();
    return res.status(200).json({ message: "List of incidents" });
});

export default router;