import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET all courses
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courses ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// POST create a course/tee combo
// hole_pars must be an array of length 9 or 18 matching round_type
router.post("/", async (req, res) => {
  const {
    name,
    tee_name,
    round_type,
    slope_rating,
    course_rating,
    par,
    hole_pars,
  } = req.body;

  if (!name || !tee_name || !round_type || !slope_rating || !course_rating || !par || !hole_pars) {
    return res.status(400).json({ error: "Missing required course fields" });
  }

  const expectedLength = round_type === "9" ? 9 : 18;
  if (!Array.isArray(hole_pars) || hole_pars.length !== expectedLength) {
    return res.status(400).json({
      error: `hole_pars must be an array of length ${expectedLength} for round_type ${round_type}`,
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO courses (name, tee_name, round_type, slope_rating, course_rating, par, hole_pars)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, tee_name, round_type, slope_rating, course_rating, par, hole_pars]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create course" });
  }
});

export default router;
