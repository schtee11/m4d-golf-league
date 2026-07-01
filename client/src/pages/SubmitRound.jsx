import { useEffect, useState } from "react";
import { api } from "../api.js";
import CourseSearchPicker from "../components/CourseSearchPicker.jsx";

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

  useEffect(() => {
    if (selectedCourse) {
      setHoleScores(new Array(selectedCourse.hole_pars.length).fill(""));
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

  const handleScoreChange = (index, rawValue) => {
    const value = rawValue.replace(/\D/g, "");
    const updated = [...holeScores];
    updated[index] = value === "" ? "" : Number(value);
    setHoleScores(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (holeScores.some((s) => s === "" || s === null)) {
      setStatus({ type: "error", message: "Fill in all hole scores." });
      return;
    }

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
      setHoleScores(new Array(selectedCourse.hole_pars.length).fill(""));
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Submit a Round</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Player</label>
          <select
            required
            className="w-full min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
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
            className="w-full min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
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
            className="w-full min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
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
              className="mt-2 text-sm text-fairway-600 hover:text-fairway-800 font-medium"
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
            className="w-full min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
            value={datePlayed}
            onChange={(e) => setDatePlayed(e.target.value)}
          />
        </div>

        {selectedCourse && (
          <div>
            <label className="block text-sm font-medium mb-2">Hole Scores</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {selectedCourse.hole_pars.map((par, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs text-fairway-500 mb-1">
                    Hole {i + 1} (Par {par})
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="1"
                    required
                    className="w-full min-h-[56px] p-2 border border-fairway-300 rounded-lg text-center text-xl font-semibold"
                    value={holeScores[i] ?? ""}
                    onChange={(e) => handleScoreChange(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full min-h-[52px] bg-fairway-500 hover:bg-fairway-600 active:bg-fairway-600 text-white text-lg font-semibold py-3 rounded-lg"
        >
          Submit Round
        </button>

        {status && (
          <div
            className={`p-3 rounded-lg text-sm ${
              status.type === "success"
                ? "bg-fairway-100 text-fairway-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}
