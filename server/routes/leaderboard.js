import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET /api/leaderboard/week/:weekId - net score leaderboard for a single week
router.get("/week/:weekId", async (req, res) => {
  const { weekId } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.id, p.name AS player_name, c.name AS course_name, c.tee_name,
              r.gross_score, r.course_handicap, r.net_score, r.stableford_points
       FROM rounds r
       JOIN players p ON p.id = r.player_id
       JOIN courses c ON c.id = r.course_id
       WHERE r.week_id = $1
       ORDER BY r.net_score ASC`,
      [weekId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weekly leaderboard" });
  }
});

// GET /api/leaderboard/season - cumulative Stableford points across all weeks
router.get("/season", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id AS player_id, p.name AS player_name,
              COUNT(r.id) AS rounds_played,
              COALESCE(SUM(r.stableford_points), 0) AS total_stableford_points,
              ROUND(AVG(r.net_score), 1) AS avg_net_score
       FROM players p
       LEFT JOIN rounds r ON r.player_id = p.id
       GROUP BY p.id, p.name
       ORDER BY total_stableford_points DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch season leaderboard" });
  }
});

export default router;
