import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET /api/leaderboard/week/:weekId - net score leaderboard for a single week
// Players may submit multiple rounds in a week (e.g. a mulligan round, or
// playing twice); only their lowest net score counts toward standings.
router.get("/week/:weekId", async (req, res) => {
  const { weekId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM (
         SELECT DISTINCT ON (r.player_id)
                r.id, p.name AS player_name, c.name AS course_name, c.tee_name,
                r.gross_score, r.course_handicap, r.net_score, r.stableford_points
         FROM rounds r
         JOIN players p ON p.id = r.player_id
         JOIN courses c ON c.id = r.course_id
         WHERE r.week_id = $1
         ORDER BY r.player_id, r.net_score ASC
       ) best
       ORDER BY best.net_score ASC`,
      [weekId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weekly leaderboard" });
  }
});

// GET /api/leaderboard/week/:weekId/all - every round submitted this week,
// including ones that didn't count, so players can see all their entries.
router.get("/week/:weekId/all", async (req, res) => {
  const { weekId } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.id, r.player_id, p.name AS player_name, c.name AS course_name, c.tee_name,
              r.gross_score, r.course_handicap, r.net_score, r.stableford_points, r.date_played
       FROM rounds r
       JOIN players p ON p.id = r.player_id
       JOIN courses c ON c.id = r.course_id
       WHERE r.week_id = $1
       ORDER BY r.player_id, r.net_score ASC`,
      [weekId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch week's rounds" });
  }
});

// GET /api/leaderboard/season - cumulative Stableford points across all weeks,
// using each player's best (lowest net score) round per week.
router.get("/season", async (req, res) => {
  try {
    const result = await pool.query(
      `WITH best_rounds AS (
         SELECT DISTINCT ON (r.player_id, r.week_id)
                r.player_id, r.week_id, r.net_score, r.stableford_points
         FROM rounds r
         ORDER BY r.player_id, r.week_id, r.net_score ASC
       )
       SELECT p.id AS player_id, p.name AS player_name,
              COUNT(br.week_id) AS rounds_played,
              COALESCE(SUM(br.stableford_points), 0) AS total_stableford_points,
              ROUND(AVG(br.net_score), 1) AS avg_net_score
       FROM players p
       LEFT JOIN best_rounds br ON br.player_id = p.id
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
