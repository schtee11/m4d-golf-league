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

// PATCH update a player's name and/or handicap index (commish only)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, handicap_index } = req.body;

  if (name === undefined && handicap_index === undefined) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  try {
    const result = await pool.query(
      `UPDATE players
       SET name = COALESCE($1, name),
           handicap_index = COALESCE($2, handicap_index),
           handicap_updated_at = CASE WHEN $2 IS NOT NULL THEN now() ELSE handicap_updated_at END
       WHERE id = $3 RETURNING *`,
      [name ?? null, handicap_index ?? null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update player" });
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
