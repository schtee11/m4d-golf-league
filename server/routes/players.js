import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET all players
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM players ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

// POST create player (commish only, enforced client-side + optionally add auth later)
router.post("/", async (req, res) => {
  const { name, ghin_id, handicap_index } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO players (name, ghin_id, handicap_index)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, ghin_id || null, handicap_index || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create player" });
  }
});

// PATCH update a player's handicap index
router.patch("/:id/handicap", async (req, res) => {
  const { id } = req.params;
  const { handicap_index } = req.body;

  if (handicap_index === undefined) {
    return res.status(400).json({ error: "handicap_index is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE players
       SET handicap_index = $1, handicap_updated_at = now()
       WHERE id = $2 RETURNING *`,
      [handicap_index, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update handicap" });
  }
});

// DELETE a player (commish only)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM players WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete player" });
  }
});

export default router;
