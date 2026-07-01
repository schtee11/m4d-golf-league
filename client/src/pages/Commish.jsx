import { useEffect, useState } from "react";
import { api } from "../api.js";
import CourseSearchPicker from "../components/CourseSearchPicker.jsx";

export default function Commish() {
  const [players, setPlayers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [weeks, setWeeks] = useState([]);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerHandicap, setNewPlayerHandicap] = useState("");

  const [newWeekNumber, setNewWeekNumber] = useState("");
  const [newWeekStart, setNewWeekStart] = useState("");
  const [newWeekEnd, setNewWeekEnd] = useState("");

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
  };

  useEffect(refresh, []);

  const addPlayer = async (e) => {
    e.preventDefault();
    await api.players.create({
      name: newPlayerName,
      handicap_index: Number(newPlayerHandicap),
    });
    setNewPlayerName("");
    setNewPlayerHandicap("");
    refresh();
  };

  const updateHandicap = async (id, value) => {
    await api.players.updateHandicap(id, Number(value));
    refresh();
  };

  const addWeek = async (e) => {
    e.preventDefault();
    await api.weeks.create({
      week_number: Number(newWeekNumber),
      start_date: newWeekStart,
      end_date: newWeekEnd,
    });
    setNewWeekNumber("");
    setNewWeekStart("");
    setNewWeekEnd("");
    refresh();
  };

  const [addingCourses, setAddingCourses] = useState(false);

  const addCourse = async (e) => {
    e.preventDefault();
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
    } finally {
      setAddingCourses(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Commish Panel</h1>

      {/* Players */}
      <section className="bg-white rounded-xl shadow-card border border-fairway-100 p-6">
        <h2 className="text-lg font-bold mb-3 text-fairway-800">Players</h2>
        <form onSubmit={addPlayer} className="flex flex-wrap gap-2 mb-4">
          <input
            className="flex-1 min-w-[140px] min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
            placeholder="Name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            required
          />
          <input
            type="number"
            step="0.1"
            className="w-24 min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
            placeholder="HI"
            value={newPlayerHandicap}
            onChange={(e) => setNewPlayerHandicap(e.target.value)}
            required
          />
          <button className="min-h-[48px] bg-fairway-500 hover:bg-fairway-600 active:scale-[0.98] text-white px-5 rounded-lg font-medium transition-all">
            Add
          </button>
        </form>

        <ul className="divide-y divide-fairway-100">
          {players.map((p) => (
            <li key={p.id} className="py-2.5 flex items-center justify-between">
              <span className="font-medium">{p.name}</span>
              <input
                type="number"
                step="0.1"
                defaultValue={p.handicap_index}
                className="w-24 min-h-[44px] p-2 border border-fairway-300 rounded-lg text-right"
                onBlur={(e) => updateHandicap(p.id, e.target.value)}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Weeks */}
      <section className="bg-white rounded-xl shadow-card border border-fairway-100 p-6">
        <h2 className="text-lg font-bold mb-3 text-fairway-800">Weeks</h2>
        <form onSubmit={addWeek} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <input
            type="number"
            className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
            placeholder="Week #"
            value={newWeekNumber}
            onChange={(e) => setNewWeekNumber(e.target.value)}
            required
          />
          <input
            type="date"
            className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
            value={newWeekStart}
            onChange={(e) => setNewWeekStart(e.target.value)}
            required
          />
          <input
            type="date"
            className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
            value={newWeekEnd}
            onChange={(e) => setNewWeekEnd(e.target.value)}
            required
          />
          <button className="sm:col-span-3 min-h-[48px] bg-fairway-500 hover:bg-fairway-600 active:scale-[0.99] text-white py-3 rounded-lg font-medium transition-all">
            Add Week
          </button>
        </form>
        <ul className="divide-y divide-fairway-100">
          {weeks.map((w) => (
            <li key={w.id} className="py-2.5 flex items-center justify-between">
              <span className="font-medium">
                Week {w.week_number} ({w.start_date} – {w.end_date})
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  w.status === "open"
                    ? "bg-fairway-100 text-fairway-700"
                    : "bg-fairway-900/10 text-fairway-500"
                }`}
              >
                {w.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Courses */}
      <section className="bg-white rounded-xl shadow-card border border-fairway-100 p-6">
        <h2 className="text-lg font-bold mb-3 text-fairway-800">Courses</h2>

        <div className="mb-6">
          <CourseSearchPicker onApply={applyCourseSearchResult} />
          <p className="text-xs text-fairway-400 mt-2">
            Selecting a tee fills in the form below — review it, then hit Add Course.
          </p>
        </div>

        <form onSubmit={addCourse} className="space-y-2 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
              placeholder="Course name"
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              required
            />
            <select
              className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
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
              className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
              placeholder="Par"
              value={courseForm.par}
              onChange={(e) => setCourseForm({ ...courseForm, par: e.target.value })}
              required
            />
            <input
              className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
              placeholder="Hole pars, comma separated (e.g. 4,4,3,5,4,4,3,4,5,...)"
              value={courseForm.hole_pars}
              onChange={(e) => setCourseForm({ ...courseForm, hole_pars: e.target.value })}
              required
            />
          </div>

          <div className="pt-2">
            <div className="text-sm font-semibold text-fairway-700 mb-2">Tees</div>
            <div className="space-y-2">
              {teeRows.map((tee, i) => (
                <div key={i} className="flex flex-wrap gap-2 items-center">
                  <input
                    className="flex-1 min-w-[120px] min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
                    placeholder="Tee name (e.g. Blue)"
                    value={tee.tee_name}
                    onChange={(e) => updateTeeRow(i, "tee_name", e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.1"
                    className="w-24 min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
                    placeholder="Slope"
                    value={tee.slope_rating}
                    onChange={(e) => updateTeeRow(i, "slope_rating", e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.1"
                    className="w-28 min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
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
            <button
              type="button"
              onClick={addTeeRow}
              className="mt-2 text-sm text-fairway-600 hover:text-fairway-800 font-medium transition-colors"
            >
              + Add another tee
            </button>
          </div>

          <button
            disabled={addingCourses}
            className="w-full min-h-[48px] bg-fairway-500 hover:bg-fairway-600 active:scale-[0.99] disabled:opacity-60 text-white py-3 rounded-lg font-medium transition-all"
          >
            {addingCourses
              ? "Adding..."
              : teeRows.filter((t) => t.tee_name).length > 1
              ? "Add Course (all tees)"
              : "Add Course"}
          </button>
        </form>

        <ul className="divide-y divide-fairway-100">
          {courses.map((c) => (
            <li key={c.id} className="py-2 text-sm">
              {c.name} - {c.tee_name} ({c.round_type} holes, slope {c.slope_rating}, rating{" "}
              {c.course_rating})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
