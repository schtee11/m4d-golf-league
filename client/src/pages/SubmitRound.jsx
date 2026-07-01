import { useEffect, useState } from "react";
import { api } from "../api.js";
import CourseSearchPicker from "../components/CourseSearchPicker.jsx";
import HoleScoreStepper from "../components/HoleScoreStepper.jsx";

export default function SubmitRound() {
  const [players, setPlayers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [weeks, setWeeks] = useState([]);

  const [playerId, setPlayerId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [weekId, setWeekId] = useState("");
  const [datePlayed, setDatePlayed] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [holeScores, setHoleScores] = useState([]);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [addingCourse, setAddingCourse] = useState(false);

  useEffect(() => {
    Promise.all([api.players.list(), api.courses.list(), api.weeks.list()]).then(
      ([p, c, w]) => {
        setPlayers(p);
        setCourses(c);
        setWeeks(w.filter((week) => week.status === "open"));
      }
    );
  }, []);

  const selectedCourse = courses.find((c) => c.id === Number(courseId));

  // Scores start at par — a stepper you tap up/down from there is faster
  // and less error-prone on a phone than typing every hole from scratch.
  useEffect(() => {
    if (selectedCourse) {
      setHoleScores([...selectedCourse.hole_pars]);
    }
  }, [courseId]);

  // If a matching course/tee is already in the league, reuse it instead of
  // creating a duplicate row every time someone searches the same tee.
  const applyCourseSearchResult = async (data) => {
    const existing = courses.find(
      (c) =>
        c.name === data.name &&
        c.tee_name === data.tee_name &&
        c.round_type === data.round_type
    );

    if (existing) {
      setCourseId(String(existing.id));
      setShowCourseSearch(false);
      return;
    }

    setAddingCourse(true);
    try {
      const created = await api.courses.create(data);
      setCourses((prev) => [...prev, created]);
      setCourseId(String(created.id));
      setShowCourseSearch(false);
    } catch (err) {
      setStatus({ type: "error", message: `Couldn't add course: ${err.message}` });
    } finally {
      setAddingCourse(false);
    }
  };

  const handleScoreChange = (index, newValue) => {
    const updated = [...holeScores];
    updated[index] = newValue;
    setHoleScores(updated);
  };

  const totalGross = holeScores.reduce((sum, s) => sum + s, 0);
  const totalPar = selectedCourse
    ? selectedCourse.hole_pars.reduce((sum, p) => sum + p, 0)
    : 0;
  const totalDiff = totalGross - totalPar;
  const totalDiffLabel = totalDiff === 0 ? "E" : totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (holeScores.some((s) => s === "" || s === null)) {
      setStatus({ type: "error", message: "Fill in all hole scores." });
      return;
    }

    setSubmitting(true);
    try {
      const round = await api.rounds.submit({
        player_id: Number(playerId),
        course_id: Number(courseId),
        week_id: Number(weekId),
        date_played: datePlayed,
        hole_scores: holeScores,
      });
      setStatus({
        type: "success",
        message: `Submitted! Gross ${round.gross_score}, Net ${round.net_score}, Points ${round.stableford_points}`,
      });
      setHoleScores([...selectedCourse.hole_pars]);
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Submit a Round</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-card border border-fairway-100 p-4 sm:p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Player</label>
          <select
            required
            className="w-full min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fairway-400"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
          >
            <option value="">Select player</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (HI: {p.handicap_index})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Week</label>
          <select
            required
            className="w-full min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fairway-400"
            value={weekId}
            onChange={(e) => setWeekId(e.target.value)}
          >
            <option value="">Select week</option>
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                Week {w.week_number}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Course</label>
          <select
            required
            className="w-full min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fairway-400"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.tee_name} ({c.round_type} holes)
              </option>
            ))}
          </select>

          {!showCourseSearch ? (
            <button
              type="button"
              className="mt-2 text-sm text-fairway-600 hover:text-fairway-800 font-medium transition-colors"
              onClick={() => setShowCourseSearch(true)}
            >
              Can't find your course? Search and add it
            </button>
          ) : (
            <div className="mt-3">
              <CourseSearchPicker
                onApply={applyCourseSearchResult}
                onCancel={() => setShowCourseSearch(false)}
              />
              {addingCourse && (
                <p className="text-sm text-fairway-500 mt-2">Adding course...</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date Played</label>
          <input
            type="date"
            required
            className="w-full min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fairway-400"
            value={datePlayed}
            onChange={(e) => setDatePlayed(e.target.value)}
          />
        </div>

        {selectedCourse && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Hole Scores</label>
              <div className="text-sm font-semibold text-fairway-700 bg-fairway-50 px-2.5 py-1 rounded-full">
                Gross {totalGross} ({totalDiffLabel})
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {selectedCourse.hole_pars.map((par, i) => (
                <HoleScoreStepper
                  key={i}
                  index={i}
                  par={par}
                  value={holeScores[i] ?? par}
                  onChange={(v) => handleScoreChange(i, v)}
                />
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[52px] bg-fairway-500 hover:bg-fairway-600 active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100 text-white text-lg font-semibold py-3 rounded-lg transition-all"
        >
          {submitting ? "Submitting..." : "Submit Round"}
        </button>

        {status && (
          <div
            className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
              status.type === "success"
                ? "bg-fairway-100 text-fairway-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span>{status.type === "success" ? "✓" : "✕"}</span>
            <span>{status.message}</span>
          </div>
        )}
      </form>
    </div>
  );
}
