import express from "express";
import { pool } from "../db.js";
import {
  calculateRound,
  calculateNineHoleCourseHandicap,
  calculateStablefordPoints,
  capHoleScores,
} from "../scoring.js";

const router = express.Router();

// GET rounds for a given week
router.get("/", async (req, res) => {
  const { week_id, player_id } = req.query;

  let query = `
    SELECT r.*, p.name AS player_name, c.name AS course_name, c.tee_name
    FROM rounds r
    JOIN players p ON p.id = r.player_id
    JOIN courses c ON c.id = r.course_id
    WHERE 1=1
  `;
  const params = [];

  if (week_id) {
    params.push(week_id);
    query += ` AND r.week_id = $${params.length}`;
  }
  if (player_id) {
    params.push(player_id);
    query += ` AND r.player_id = $${params.length}`;
  }

  query += " ORDER BY r.net_score ASC";

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rounds" });
  }
});

// POST submit a round
// body: { player_id, course_id, week_id, date_played, hole_scores: [] }
router.post("/", async (req, res) => {
  const { player_id, course_id, week_id, date_played, hole_scores } = req.body;

  if (!player_id || !course_id || !week_id || !date_played || !hole_scores) {
    return res.status(400).json({ error: "Missing required round fields" });
  }

  try {
    const playerResult = await pool.query("SELECT * FROM players WHERE id = $1", [player_id]);
    const courseResult = await pool.query("SELECT * FROM courses WHERE id = $1", [course_id]);

    if (playerResult.rows.length === 0) return res.status(404).json({ error: "Player not found" });
    if (courseResult.rows.length === 0) return res.status(404).json({ error: "Course not found" });

    const player = playerResult.rows[0];
    const course = courseResult.rows[0];

    if (hole_scores.length !== course.hole_pars.length) {
      return res.status(400).json({
        error: `hole_scores length (${hole_scores.length}) must match course hole_pars length (${course.hole_pars.length})`,
      });
    }

    const handicapIndex = parseFloat(player.handicap_index);
    const slopeRating = parseFloat(course.slope_rating);
    const courseRating = parseFloat(course.course_rating);
    const par = course.par;

    let courseHandicap;
    if (course.round_type === "9") {
      courseHandicap = calculateNineHoleCourseHandicap({
        handicapIndex,
        slopeRating,
        courseRating,
        par,
      });
    } else {
      const calc = calculateRound({
        holeScores: hole_scores,
        holePars: course.hole_pars,
        handicapIndex,
        slopeRating,
        courseRating,
        par,
      });
      courseHandicap = calc.courseHandicap;
    }

    const cappedHoleScores = capHoleScores(hole_scores, course.hole_pars);
    const grossScore = cappedHoleScores.reduce((sum, s) => sum + s, 0);
    const netScore = grossScore - courseHandicap;

    const stablefordPoints = calculateStablefordPoints({
      cappedHoleScores,
      holePars: course.hole_pars,
      courseHandicap,
    });

    const result = await pool.query(
      `INSERT INTO rounds (
        player_id, course_id, week_id, round_type, date_played,
        hole_scores, capped_hole_scores, gross_score,
        handicap_index_used, course_handicap, net_score, stableford_points
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        player_id,
        course_id,
        week_id,
        course.round_type,
        date_played,
        hole_scores,
        cappedHoleScores,
        grossScore,
        handicapIndex,
        courseHandicap,
        netScore,
        stablefordPoints,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Round already submitted for this player/week/course/date" });
    }
    res.status(500).json({ error: "Failed to submit round" });
  }
});

// DELETE a round (commish or player correcting an entry)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM rounds WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete round" });
  }
});

export default router;
