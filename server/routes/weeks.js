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
    if (result.rows.length === 0) return res.status(404).json({ error: "Week not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to close week" });
  }
});

// PATCH reopen a closed week (commish only)
router.patch("/:id/reopen", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE weeks SET status = 'open' WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Week not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reopen week" });
  }
});

// PATCH edit a week's number/dates (commish only)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { week_number, start_date, end_date } = req.body;
  if (week_number === undefined && start_date === undefined && end_date === undefined) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  try {
    const result = await pool.query(
      `UPDATE weeks
       SET week_number = COALESCE($1, week_number),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date)
       WHERE id = $4 RETURNING *`,
      [week_number ?? null, start_date ?? null, end_date ?? null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Week not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update week" });
  }
});

// DELETE a week (commish only)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM weeks WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Week not found" });
    res.status(204).send();
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ error: "Can't delete a week that has rounds submitted for it" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to delete week" });
  }
});

export default router;
