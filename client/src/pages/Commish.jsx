import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import CourseSearchPicker from "../components/CourseSearchPicker.jsx";

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 p-3.5 rounded-lg text-sm flex items-start gap-2 bg-red-50 text-red-700 border border-red-200">
      <span>✕</span>
      <span>{message}</span>
    </div>
  );
}

export default function Commish() {
  const [players, setPlayers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [rounds, setRounds] = useState([]);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerHandicap, setNewPlayerHandicap] = useState("");
  const [playerError, setPlayerError] = useState("");

  const [newWeekNumber, setNewWeekNumber] = useState("");
  const [newWeekStart, setNewWeekStart] = useState("");
  const [newWeekEnd, setNewWeekEnd] = useState("");
  const [weekError, setWeekError] = useState("");
  const [editingWeekId, setEditingWeekId] = useState(null);
  const [weekEditForm, setWeekEditForm] = useState(null);

  const [courseError, setCourseError] = useState("");
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseEditForm, setCourseEditForm] = useState(null);

  // Course name/holes are shared; each course can have several tees
  // (Blue, White, Red...), each with its own slope/rating, added together
  // in one submission instead of repeating the whole form per tee.
  const [courseForm, setCourseForm] = useState({
    name: "",
    round_type: "18",
    par: "",
    hole_pars: "",
  });
  const emptyTeeRow = { tee_name: "", slope_rating: "", course_rating: "" };
  const [teeRows, setTeeRows] = useState([{ ...emptyTeeRow }]);

  const updateTeeRow = (i, field, value) => {
    setTeeRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };
  const addTeeRow = () => setTeeRows((rows) => [...rows, { ...emptyTeeRow }]);
  const removeTeeRow = (i) => {
    setTeeRows((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows));
  };

  // Search hands back every tee for the selected course at once — fill the
  // shared fields from the first, and one tee row per tee.
  const applyCourseSearchResult = (dataArray) => {
    const [first] = dataArray;
    setCourseForm({
      name: first.name,
      round_type: first.round_type,
      par: String(first.par),
      hole_pars: first.hole_pars.join(","),
    });
    setTeeRows(
      dataArray.map((d) => ({
        tee_name: d.tee_name,
        slope_rating: String(d.slope_rating),
        course_rating: String(d.course_rating),
      }))
    );
  };

  const refresh = () => {
    api.players.list().then(setPlayers);
    api.courses.list().then(setCourses);
    api.weeks.list().then(setWeeks);
    api.rounds.list().then(setRounds);
  };

  useEffect(refresh, []);

  // Which players have submitted a round for each week, so the open week(s)
  // can show who the commish still needs to chase.
  const submittedPlayerIdsByWeek = useMemo(() => {
    const map = new Map();
    for (const r of rounds) {
      if (!map.has(r.week_id)) map.set(r.week_id, new Set());
      map.get(r.week_id).add(r.player_id);
    }
    return map;
  }, [rounds]);

  const addPlayer = async (e) => {
    e.preventDefault();
    setPlayerError("");
    try {
      await api.players.create({
        name: newPlayerName,
        handicap_index: Number(newPlayerHandicap),
      });
      setNewPlayerName("");
      setNewPlayerHandicap("");
      refresh();
    } catch (err) {
      setPlayerError(`Couldn't add player: ${err.message}`);
    }
  };

  const updatePlayerName = async (player, value) => {
    const name = value.trim();
    if (!name || name === player.name) return;
    setPlayerError("");
    try {
      await api.players.update(player.id, { name });
      refresh();
    } catch (err) {
      setPlayerError(`Couldn't rename player: ${err.message}`);
    }
  };

  const updateHandicap = async (id, value) => {
    setPlayerError("");
    try {
      await api.players.update(id, { handicap_index: Number(value) });
      refresh();
    } catch (err) {
      setPlayerError(`Couldn't update handicap: ${err.message}`);
    }
  };

  const deletePlayer = async (player) => {
    if (!window.confirm(`Remove ${player.name}? This also deletes their submitted rounds.`)) return;
    setPlayerError("");
    try {
      await api.players.remove(player.id);
      refresh();
    } catch (err) {
      setPlayerError(`Couldn't remove ${player.name}: ${err.message}`);
    }
  };

  const addWeek = async (e) => {
    e.preventDefault();
    setWeekError("");
    try {
      await api.weeks.create({
        week_number: Number(newWeekNumber),
        start_date: newWeekStart,
        end_date: newWeekEnd,
      });
      setNewWeekNumber("");
      setNewWeekStart("");
      setNewWeekEnd("");
      refresh();
    } catch (err) {
      setWeekError(`Couldn't add week: ${err.message}`);
    }
  };

  const startEditWeek = (w) => {
    setWeekError("");
    setEditingWeekId(w.id);
    setWeekEditForm({
      week_number: String(w.week_number),
      start_date: w.start_date.slice(0, 10),
      end_date: w.end_date.slice(0, 10),
    });
  };

  const saveWeek = async (id) => {
    setWeekError("");
    try {
      await api.weeks.update(id, {
        week_number: Number(weekEditForm.week_number),
        start_date: weekEditForm.start_date,
        end_date: weekEditForm.end_date,
      });
      setEditingWeekId(null);
      refresh();
    } catch (err) {
      setWeekError(`Couldn't save week: ${err.message}`);
    }
  };

  const closeWeek = async (w) => {
    if (!window.confirm(`Close Week ${w.week_number}? Players won't be able to submit scores for it anymore.`)) return;
    setWeekError("");
    try {
      await api.weeks.close(w.id);
      refresh();
    } catch (err) {
      setWeekError(`Couldn't close week: ${err.message}`);
    }
  };

  const reopenWeek = async (w) => {
    setWeekError("");
    try {
      await api.weeks.reopen(w.id);
      refresh();
    } catch (err) {
      setWeekError(`Couldn't reopen week: ${err.message}`);
    }
  };

  const deleteWeek = async (w) => {
    if (!window.confirm(`Delete Week ${w.week_number}? This can't be undone.`)) return;
    setWeekError("");
    try {
      await api.weeks.remove(w.id);
      refresh();
    } catch (err) {
      setWeekError(`Couldn't delete Week ${w.week_number}: ${err.message}`);
    }
  };

  const [addingCourses, setAddingCourses] = useState(false);

  const addCourse = async (e) => {
    e.preventDefault();
    setCourseError("");
    const holePars = courseForm.hole_pars
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n));

    const validTees = teeRows.filter(
      (t) => t.tee_name && t.slope_rating !== "" && t.course_rating !== ""
    );
    if (validTees.length === 0) return;

    setAddingCourses(true);
    try {
      await Promise.all(
        validTees.map((t) =>
          api.courses.create({
            name: courseForm.name,
            tee_name: t.tee_name,
            round_type: courseForm.round_type,
            slope_rating: Number(t.slope_rating),
            course_rating: Number(t.course_rating),
            par: Number(courseForm.par),
            hole_pars: holePars,
          })
        )
      );
      setCourseForm({ name: "", round_type: "18", par: "", hole_pars: "" });
      setTeeRows([{ ...emptyTeeRow }]);
      refresh();
    } catch (err) {
      setCourseError(`Couldn't add course: ${err.message}`);
    } finally {
      setAddingCourses(false);
    }
  };

  const startEditCourse = (c) => {
    setCourseError("");
    setEditingCourseId(c.id);
    setCourseEditForm({
      name: c.name,
      tee_name: c.tee_name,
      round_type: c.round_type,
      slope_rating: String(c.slope_rating),
      course_rating: String(c.course_rating),
      par: String(c.par),
      hole_pars: c.hole_pars.join(","),
    });
  };

  const saveCourse = async (id) => {
    setCourseError("");
    const holePars = courseEditForm.hole_pars
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n));
    const expectedLength = courseEditForm.round_type === "9" ? 9 : 18;
    if (holePars.length !== expectedLength) {
      setCourseError(`Hole pars must have ${expectedLength} values for a ${courseEditForm.round_type}-hole course.`);
      return;
    }

    try {
      await api.courses.update(id, {
        name: courseEditForm.name,
        tee_name: courseEditForm.tee_name,
        round_type: courseEditForm.round_type,
        slope_rating: Number(courseEditForm.slope_rating),
        course_rating: Number(courseEditForm.course_rating),
        par: Number(courseEditForm.par),
        hole_pars: holePars,
      });
      setEditingCourseId(null);
      refresh();
    } catch (err) {
      setCourseError(`Couldn't save course: ${err.message}`);
    }
  };

  const deleteCourse = async (c) => {
    if (!window.confirm(`Delete ${c.name} — ${c.tee_name}?`)) return;
    setCourseError("");
    try {
      await api.courses.remove(c.id);
      refresh();
    } catch (err) {
      setCourseError(`Couldn't delete ${c.name} — ${c.tee_name}: ${err.message}`);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="mb-1 animate-fade-up">
        <div className="eyebrow mb-1.5">Admin</div>
        <h1 className="page-title">Commish Panel</h1>
        <p className="text-sm text-fairway-500 mt-1.5">
          Manage players, weeks, and the course database.
        </p>
      </div>

      {/* Players */}
      <section className="card p-6 animate-fade-up">
        <h2 className="section-heading mb-4">Players</h2>
        <ErrorBanner message={playerError} />
        <form onSubmit={addPlayer} className="flex flex-wrap gap-2 mb-5">
          <input
            className="input-field flex-1 min-w-[140px]"
            placeholder="Name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            required
          />
          <input
            type="number"
            step="0.1"
            className="input-field w-24"
            placeholder="HI"
            value={newPlayerHandicap}
            onChange={(e) => setNewPlayerHandicap(e.target.value)}
            required
          />
          <button className="btn-gold shrink-0">Add</button>
        </form>

        <ul className="divide-y divide-fairway-900/8">
          {players.map((p) => (
            <li key={p.id} className="py-2.5 flex items-center gap-2">
              <input
                className="flex-1 min-w-0 min-h-[44px] p-2 border border-fairway-900/20 rounded-lg bg-white font-medium text-fairway-900 focus:outline-none focus:ring-2 focus:ring-gold-400/60 focus:border-gold-400"
                defaultValue={p.name}
                onBlur={(e) => updatePlayerName(p, e.target.value)}
              />
              <input
                type="number"
                step="0.1"
                defaultValue={p.handicap_index}
                className="w-24 min-h-[44px] p-2 border border-fairway-900/20 rounded-lg text-right bg-white focus:outline-none focus:ring-2 focus:ring-gold-400/60 focus:border-gold-400"
                onBlur={(e) => updateHandicap(p.id, e.target.value)}
              />
              <button
                type="button"
                onClick={() => deletePlayer(p)}
                className="min-h-[44px] px-2 text-fairway-400 hover:text-red-600 transition-colors"
                aria-label={`Remove ${p.name}`}
              >
                ✕
              </button>
            </li>
          ))}
          {players.length === 0 && (
            <li className="py-6 text-center text-sm text-fairway-400">No players yet.</li>
          )}
        </ul>
      </section>

      {/* Weeks */}
      <section className="card p-6 animate-fade-up">
        <h2 className="section-heading mb-4">Weeks</h2>
        <ErrorBanner message={weekError} />
        <form onSubmit={addWeek} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
          <input
            type="number"
            className="input-field"
            placeholder="Week #"
            value={newWeekNumber}
            onChange={(e) => setNewWeekNumber(e.target.value)}
            required
          />
          <input
            type="date"
            className="input-field"
            value={newWeekStart}
            onChange={(e) => setNewWeekStart(e.target.value)}
            required
          />
          <input
            type="date"
            className="input-field"
            value={newWeekEnd}
            onChange={(e) => setNewWeekEnd(e.target.value)}
            required
          />
          <button className="btn-gold sm:col-span-3">Add Week</button>
        </form>
        <ul className="divide-y divide-fairway-900/8">
          {weeks.map((w) => {
            const isEditing = editingWeekId === w.id;
            const submittedIds = submittedPlayerIdsByWeek.get(w.id) ?? new Set();
            const missing = players.filter((p) => !submittedIds.has(p.id));

            if (isEditing) {
              return (
                <li key={w.id} className="py-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="number"
                      className="input-field"
                      value={weekEditForm.week_number}
                      onChange={(e) => setWeekEditForm({ ...weekEditForm, week_number: e.target.value })}
                    />
                    <input
                      type="date"
                      className="input-field"
                      value={weekEditForm.start_date}
                      onChange={(e) => setWeekEditForm({ ...weekEditForm, start_date: e.target.value })}
                    />
                    <input
                      type="date"
                      className="input-field"
                      value={weekEditForm.end_date}
                      onChange={(e) => setWeekEditForm({ ...weekEditForm, end_date: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button type="button" className="btn-primary btn-sm" onClick={() => saveWeek(w.id)}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setEditingWeekId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              );
            }

            return (
              <li key={w.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-fairway-900">
                    Week {w.week_number}{" "}
                    <span className="text-fairway-400 font-normal">
                      ({w.start_date.slice(0, 10)} – {w.end_date.slice(0, 10)})
                    </span>
                  </span>
                  <span
                    className={`badge ${
                      w.status === "open"
                        ? "bg-fairway-100 text-fairway-700"
                        : "bg-fairway-950/10 text-fairway-500"
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
                {w.status === "open" && players.length > 0 && (
                  <p className="text-xs text-fairway-400 mt-1">
                    {submittedIds.size}/{players.length} submitted
                    {missing.length > 0 && ` — waiting on ${missing.map((p) => p.name).join(", ")}`}
                  </p>
                )}
                <div className="flex gap-3 mt-2">
                  <button type="button" className="btn-ghost text-sm" onClick={() => startEditWeek(w)}>
                    Edit
                  </button>
                  {w.status === "open" ? (
                    <button type="button" className="btn-ghost text-sm" onClick={() => closeWeek(w)}>
                      Close
                    </button>
                  ) : (
                    <button type="button" className="btn-ghost text-sm" onClick={() => reopenWeek(w)}>
                      Reopen
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-ghost text-sm text-red-600 hover:text-red-700"
                    onClick={() => deleteWeek(w)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
          {weeks.length === 0 && (
            <li className="py-6 text-center text-sm text-fairway-400">No weeks yet.</li>
          )}
        </ul>
      </section>

      {/* Courses */}
      <section className="card p-6 animate-fade-up">
        <h2 className="section-heading mb-4">Courses</h2>
        <ErrorBanner message={courseError} />

        <div className="mb-6">
          <CourseSearchPicker onApply={applyCourseSearchResult} />
          <p className="text-xs text-fairway-400 mt-2">
            Selecting a tee fills in the form below — review it, then hit Add Course.
          </p>
        </div>

        <form onSubmit={addCourse} className="space-y-3 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className="input-field"
              placeholder="Course name"
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              required
            />
            <select
              className="input-field"
              value={courseForm.round_type}
              onChange={(e) => setCourseForm({ ...courseForm, round_type: e.target.value })}
            >
              <option value="18">18 holes</option>
              <option value="9">9 holes</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="number"
              className="input-field"
              placeholder="Par"
              value={courseForm.par}
              onChange={(e) => setCourseForm({ ...courseForm, par: e.target.value })}
              required
            />
            <input
              className="input-field"
              placeholder="Hole pars, comma separated (e.g. 4,4,3,5,4,4,3,4,5,...)"
              value={courseForm.hole_pars}
              onChange={(e) => setCourseForm({ ...courseForm, hole_pars: e.target.value })}
              required
            />
          </div>

          <div className="pt-2">
            <div className="field-label !mb-2.5">Tees</div>
            <div className="space-y-2">
              {teeRows.map((tee, i) => (
                <div key={i} className="flex flex-wrap gap-2 items-center">
                  <input
                    className="input-field flex-1 min-w-[120px]"
                    placeholder="Tee name (e.g. Blue)"
                    value={tee.tee_name}
                    onChange={(e) => updateTeeRow(i, "tee_name", e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.1"
                    className="input-field w-24"
                    placeholder="Slope"
                    value={tee.slope_rating}
                    onChange={(e) => updateTeeRow(i, "slope_rating", e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.1"
                    className="input-field w-28"
                    placeholder="Rating"
                    value={tee.course_rating}
                    onChange={(e) => updateTeeRow(i, "course_rating", e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={teeRows.length === 1}
                    onClick={() => removeTeeRow(i)}
                    className="min-h-[48px] px-3 text-fairway-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-fairway-400 transition-colors"
                    aria-label="Remove tee"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addTeeRow} className="btn-ghost text-sm mt-2.5">
              + Add another tee
            </button>
          </div>

          <button disabled={addingCourses} className="btn-primary w-full">
            {addingCourses
              ? "Adding..."
              : teeRows.filter((t) => t.tee_name).length > 1
              ? "Add Course (all tees)"
              : "Add Course"}
          </button>
        </form>

        <ul className="divide-y divide-fairway-900/8">
          {courses.map((c) => {
            const isEditing = editingCourseId === c.id;

            if (isEditing) {
              return (
                <li key={c.id} className="py-3 text-sm">
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        className="input-field"
                        placeholder="Course name"
                        value={courseEditForm.name}
                        onChange={(e) => setCourseEditForm({ ...courseEditForm, name: e.target.value })}
                      />
                      <input
                        className="input-field"
                        placeholder="Tee name"
                        value={courseEditForm.tee_name}
                        onChange={(e) => setCourseEditForm({ ...courseEditForm, tee_name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <select
                        className="input-field"
                        value={courseEditForm.round_type}
                        onChange={(e) => setCourseEditForm({ ...courseEditForm, round_type: e.target.value })}
                      >
                        <option value="18">18 holes</option>
                        <option value="9">9 holes</option>
                      </select>
                      <input
                        type="number"
                        step="0.1"
                        className="input-field"
                        placeholder="Slope"
                        value={courseEditForm.slope_rating}
                        onChange={(e) => setCourseEditForm({ ...courseEditForm, slope_rating: e.target.value })}
                      />
                      <input
                        type="number"
                        step="0.1"
                        className="input-field"
                        placeholder="Rating"
                        value={courseEditForm.course_rating}
                        onChange={(e) => setCourseEditForm({ ...courseEditForm, course_rating: e.target.value })}
                      />
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Par"
                        value={courseEditForm.par}
                        onChange={(e) => setCourseEditForm({ ...courseEditForm, par: e.target.value })}
                      />
                    </div>
                    <input
                      className="input-field"
                      placeholder="Hole pars, comma separated"
                      value={courseEditForm.hole_pars}
                      onChange={(e) => setCourseEditForm({ ...courseEditForm, hole_pars: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <button type="button" className="btn-primary btn-sm" onClick={() => saveCourse(c.id)}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setEditingCourseId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </li>
              );
            }

            return (
              <li key={c.id} className="py-2.5 text-sm flex items-center justify-between gap-2">
                <span className="text-fairway-900">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-fairway-400"> — {c.tee_name}</span>
                  <span className="block text-xs text-fairway-400 tabular-nums">
                    {c.round_type}h &middot; slope {c.slope_rating} &middot; rating {c.course_rating}
                  </span>
                </span>
                <div className="flex gap-3 shrink-0">
                  <button type="button" className="btn-ghost text-sm" onClick={() => startEditCourse(c)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm text-red-600 hover:text-red-700"
                    onClick={() => deleteCourse(c)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
          {courses.length === 0 && (
            <li className="py-6 text-center text-sm text-fairway-400">No courses yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
