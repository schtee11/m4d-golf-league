import { useEffect, useState } from "react";
import { api } from "../api.js";
import CourseSearchPicker from "../components/CourseSearchPicker.jsx";
import HoleScoreStepper from "../components/HoleScoreStepper.jsx";

export default function SubmitRound() {
  const [players, setPlayers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [weeks, setWeeks] = useState([]);

  const [playerId, setPlayerId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [roundType, setRoundType] = useState("");
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

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerHandicap, setNewPlayerHandicap] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);

  useEffect(() => {
    Promise.all([api.players.list(), api.courses.list(), api.weeks.list()]).then(
      ([p, c, w]) => {
        setPlayers(p);
        setCourses(c);
        setWeeks(w.filter((week) => week.status === "open"));
      }
    );
  }, []);

  const courseNames = [...new Set(courses.map((c) => c.name))].sort();
  const teesForCourse = courses.filter((c) => c.name === courseName);
  const roundTypesForCourse = [...new Set(teesForCourse.map((c) => c.round_type))].sort(
    (a, b) => Number(b) - Number(a)
  );
  const teesForRoundType = teesForCourse.filter((c) => c.round_type === roundType);
  const selectedCourse = courses.find((c) => c.id === Number(courseId));

  // Skip the extra tap when there's only one option to pick from.
  const defaultSelectionFor = (list, name) => {
    const tees = list.filter((c) => c.name === name);
    const roundTypes = [...new Set(tees.map((c) => c.round_type))];
    const rt = roundTypes.length === 1 ? roundTypes[0] : "";
    const matching = tees.filter((c) => c.round_type === rt);
    const id = rt && matching.length === 1 ? String(matching[0].id) : "";
    return { roundType: rt, courseId: id };
  };

  const handleCourseNameChange = (name) => {
    setCourseName(name);
    const { roundType: rt, courseId: id } = defaultSelectionFor(courses, name);
    setRoundType(rt);
    setCourseId(id);
  };

  const handleRoundTypeChange = (rt) => {
    setRoundType(rt);
    const matching = teesForCourse.filter((c) => c.round_type === rt);
    setCourseId(matching.length === 1 ? String(matching[0].id) : "");
  };

  // Scores start at par — a stepper you tap up/down from there is faster
  // and less error-prone on a phone than typing every hole from scratch.
  useEffect(() => {
    if (selectedCourse) {
      setHoleScores([...selectedCourse.hole_pars]);
    }
  }, [courseId]);

  // Search hands back every tee for the selected course at once. Reuse any
  // that already exist in the league (by name/tee/round type) instead of
  // creating duplicates, and add the rest.
  const applyCourseSearchResult = async (dataArray) => {
    setAddingCourse(true);
    try {
      const added = [];
      for (const data of dataArray) {
        const existing = courses.find(
          (c) =>
            c.name === data.name &&
            c.tee_name === data.tee_name &&
            c.round_type === data.round_type
        );
        added.push(existing || (await api.courses.create(data)));
      }

      const existingIds = new Set(courses.map((c) => c.id));
      const merged = [...courses, ...added.filter((c) => !existingIds.has(c.id))];
      setCourses(merged);

      const name = dataArray[0].name;
      setCourseName(name);
      const { roundType: rt, courseId: id } = defaultSelectionFor(merged, name);
      setRoundType(rt);
      setCourseId(id);
      setShowCourseSearch(false);
    } catch (err) {
      setStatus({ type: "error", message: `Couldn't add course: ${err.message}` });
    } finally {
      setAddingCourse(false);
    }
  };

  const addSelf = async () => {
    if (!newPlayerName.trim() || newPlayerHandicap === "") return;
    setAddingPlayer(true);
    setStatus(null);
    try {
      const created = await api.players.create({
        name: newPlayerName.trim(),
        handicap_index: Number(newPlayerHandicap),
      });
      setPlayers((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setPlayerId(String(created.id));
      setShowAddPlayer(false);
      setNewPlayerName("");
      setNewPlayerHandicap("");
    } catch (err) {
      setStatus({ type: "error", message: `Couldn't add you: ${err.message}` });
    } finally {
      setAddingPlayer(false);
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

          {!showAddPlayer ? (
            <button
              type="button"
              className="mt-2 text-sm text-fairway-600 hover:text-fairway-800 font-medium transition-colors"
              onClick={() => setShowAddPlayer(true)}
            >
              New here? Add yourself
            </button>
          ) : (
            <div className="mt-3 p-4 bg-fairway-50 rounded-xl border border-fairway-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Add yourself</h3>
                <button
                  type="button"
                  className="text-sm text-fairway-500 hover:text-fairway-700"
                  onClick={() => setShowAddPlayer(false)}
                >
                  Close
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  className="flex-1 min-w-[140px] min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
                  placeholder="Your name"
                  autoComplete="off"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
                <input
                  type="number"
                  step="0.1"
                  className="w-28 min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
                  placeholder="Handicap"
                  value={newPlayerHandicap}
                  onChange={(e) => setNewPlayerHandicap(e.target.value)}
                />
                <button
                  type="button"
                  disabled={addingPlayer}
                  className="min-h-[48px] bg-fairway-500 hover:bg-fairway-600 active:scale-[0.98] disabled:opacity-60 text-white px-5 rounded-lg font-medium transition-all"
                  onClick={addSelf}
                >
                  {addingPlayer ? "Adding..." : "Add"}
                </button>
              </div>
              <p className="text-xs text-fairway-400 mt-2">
                Enter your current Handicap Index from GHIN.
              </p>
            </div>
          )}
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
            value={courseName}
            onChange={(e) => handleCourseNameChange(e.target.value)}
          >
            <option value="">Select course</option>
            {courseNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {courseName && (
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Holes</label>
              <select
                required
                className="w-full min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fairway-400"
                value={roundType}
                onChange={(e) => handleRoundTypeChange(e.target.value)}
              >
                <option value="">Select holes</option>
                {roundTypesForCourse.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt} holes
                  </option>
                ))}
              </select>
            </div>
          )}

          {courseName && roundType && (
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Tee</label>
              <select
                required
                className="w-full min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fairway-400"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">Select tee</option>
                {teesForRoundType.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tee_name} (slope {c.slope_rating})
                  </option>
                ))}
              </select>
            </div>
          )}

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
