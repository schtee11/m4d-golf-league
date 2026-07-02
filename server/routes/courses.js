import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET /api/courses/search?q=... - search external course database (GolfCourseAPI)
// Flattens each course's tees into individual selectable results with hole-by-hole par data.
// Keeps the API key server-side; the client never talks to GolfCourseAPI directly.
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 3) {
    return res.status(400).json({ error: "q must be at least 3 characters" });
  }

  const apiKey = process.env.GOLF_COURSE_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: "Course search is not configured (missing GOLF_COURSE_API_KEY)" });
  }

  try {
    const apiRes = await fetch(
      `https://api.golfcourseapi.com/v1/search?search_query=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Key ${apiKey}` } }
    );

    if (!apiRes.ok) {
      return res.status(502).json({ error: "Course search provider returned an error" });
    }

    const data = await apiRes.json();
    const results = [];

    for (const course of data.courses || []) {
      for (const gender of ["male", "female"]) {
        for (const tee of course.tees?.[gender] || []) {
          results.push({
            source: "golfcourseapi",
            source_id: course.id,
            club_name: course.club_name,
            city: course.location?.city,
            state: course.location?.state,
            country: course.location?.country,
            tee_name: tee.tee_name,
            gender,
            slope_rating: tee.slope_rating,
            course_rating: tee.course_rating,
            par: tee.par_total,
            number_of_holes: tee.number_of_holes,
            hole_pars: (tee.holes || []).map((h) => h.par),
          });
        }
      }
    }

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search courses" });
  }
});

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

// PATCH update a course/tee (commish only)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, tee_name, round_type, slope_rating, course_rating, par, hole_pars } = req.body;

  if (round_type !== undefined || hole_pars !== undefined) {
    const current = await pool.query("SELECT round_type, hole_pars FROM courses WHERE id = $1", [id]);
    if (current.rows.length === 0) return res.status(404).json({ error: "Course not found" });

    const effectiveRoundType = round_type ?? current.rows[0].round_type;
    const effectiveHolePars = hole_pars ?? current.rows[0].hole_pars;
    const expectedLength = effectiveRoundType === "9" ? 9 : 18;
    if (!Array.isArray(effectiveHolePars) || effectiveHolePars.length !== expectedLength) {
      return res.status(400).json({
        error: `hole_pars must be an array of length ${expectedLength} for round_type ${effectiveRoundType}`,
      });
    }
  }

  try {
    const result = await pool.query(
      `UPDATE courses SET
         name = COALESCE($1, name),
         tee_name = COALESCE($2, tee_name),
         round_type = COALESCE($3, round_type),
         slope_rating = COALESCE($4, slope_rating),
         course_rating = COALESCE($5, course_rating),
         par = COALESCE($6, par),
         hole_pars = COALESCE($7, hole_pars)
       WHERE id = $8 RETURNING *`,
      [
        name ?? null,
        tee_name ?? null,
        round_type ?? null,
        slope_rating ?? null,
        course_rating ?? null,
        par ?? null,
        hole_pars ?? null,
        id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Course not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update course" });
  }
});

// DELETE a course/tee (commish only)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM courses WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Course not found" });
    res.status(204).send();
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ error: "Can't delete a course that has rounds submitted for it" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

export default router;
