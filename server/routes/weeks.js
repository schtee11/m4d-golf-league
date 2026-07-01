import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET all weeks
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM weeks ORDER BY week_number DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weeks" });
  }
});

// POST create a new week (commish only)
router.post("/", async (req, res) => {
  const { week_number, start_date, end_date } = req.body;
  if (!week_number || !start_date || !end_date) {
    return res.status(400).json({ error: "week_number, start_date, end_date required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO weeks (week_number, start_date, end_date)
       VALUES ($1, $2, $3) RETURNING *`,
      [week_number, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create week" });
  }
});

// PATCH close a week (commish only)
router.patch("/:id/close", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE weeks SET status = 'closed' WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to close week" });
  }
});

export default router;
