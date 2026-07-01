import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import playersRouter from "./routes/players.js";
import coursesRouter from "./routes/courses.js";
import weeksRouter from "./routes/weeks.js";
import roundsRouter from "./routes/rounds.js";
import leaderboardRouter from "./routes/leaderboard.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/players", playersRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/weeks", weeksRouter);
app.use("/api/rounds", roundsRouter);
app.use("/api/leaderboard", leaderboardRouter);

app.listen(PORT, () => {
  console.log(`M4D Golf League API running on port ${PORT}`);
});
