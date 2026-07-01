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
      <div className="mb-7 animate-fade-up">
        <div className="eyebrow mb-1.5">New Entry</div>
        <h1 className="page-title">Submit a Round</h1>
        <p className="text-sm text-fairway-500 mt-1.5">
          Log your score — handicap and points are calculated automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-4 sm:p-6 animate-fade-up">
        {/* ── Who & when ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="eyebrow">Who &amp; When</h2>

          <div>
            <label className="field-label">Player</label>
            <select
              required
              className="input-field"
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
                className="btn-ghost text-sm mt-2"
                onClick={() => setShowAddPlayer(true)}
              >
                New here? Add yourself
              </button>
            ) : (
              <div className="mt-3 p-4 bg-fairway-50/70 rounded-xl border border-fairway-900/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-fairway-900">Add yourself</h3>
                  <button
                    type="button"
                    className="text-sm text-fairway-500 hover:text-fairway-800"
                    onClick={() => setShowAddPlayer(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="input-field flex-1 min-w-[140px]"
                    placeholder="Your name"
                    autoComplete="off"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.1"
                    className="input-field w-28"
                    placeholder="Handicap"
                    value={newPlayerHandicap}
                    onChange={(e) => setNewPlayerHandicap(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={addingPlayer}
                    className="btn-primary shrink-0"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Week</label>
              <select
                required
                className="input-field"
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
              <label className="field-label">Date Played</label>
              <input
                type="date"
                required
                className="input-field"
                value={datePlayed}
                onChange={(e) => setDatePlayed(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="divider my-6" />

        {/* ── Where ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="eyebrow">Where</h2>

          <div>
            <label className="field-label">Course</label>
            <select
              required
              className="input-field"
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
          </div>

          {courseName && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Holes</label>
                <select
                  required
                  className="input-field"
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

              {roundType && (
                <div>
                  <label className="field-label">Tee</label>
                  <select
                    required
                    className="input-field"
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
            </div>
          )}

          {!showCourseSearch ? (
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => setShowCourseSearch(true)}
            >
              Can't find your course? Search and add it
            </button>
          ) : (
            <div>
              <CourseSearchPicker
                onApply={applyCourseSearchResult}
                onCancel={() => setShowCourseSearch(false)}
              />
              {addingCourse && (
                <p className="text-sm text-fairway-500 mt-2 flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-fairway-300 border-t-fairway-700 animate-spin" />
                  Adding course...
                </p>
              )}
            </div>
          )}
        </div>

        {selectedCourse && (
          <>
            <div className="divider my-6" />

            {/* ── Scorecard ────────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="eyebrow">Scorecard</h2>
                <div className="text-sm font-semibold text-fairway-900 bg-gold-100 text-fairway-950 px-3 py-1 rounded-full tabular-nums">
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
          </>
        )}

        <div className="divider my-6" />

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full text-base min-h-[52px]"
        >
          {submitting ? "Submitting..." : "Submit Round"}
        </button>

        {status && (
          <div
            className={`mt-4 p-3.5 rounded-lg text-sm flex items-start gap-2 ${
              status.type === "success"
                ? "bg-fairway-50 text-fairway-800 border border-fairway-200"
                : "bg-red-50 text-red-700 border border-red-200"
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
