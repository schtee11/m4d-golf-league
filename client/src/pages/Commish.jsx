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

  const [courseForm, setCourseForm] = useState({
    name: "",
    tee_name: "",
    round_type: "18",
    slope_rating: "",
    course_rating: "",
    par: "",
    hole_pars: "",
  });

  const applyCourseSearchResult = (data) => {
    setCourseForm({
      ...data,
      hole_pars: data.hole_pars.join(","),
    });
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

  const addCourse = async (e) => {
    e.preventDefault();
    const holePars = courseForm.hole_pars
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n));

    await api.courses.create({
      ...courseForm,
      slope_rating: Number(courseForm.slope_rating),
      course_rating: Number(courseForm.course_rating),
      par: Number(courseForm.par),
      hole_pars: holePars,
    });

    setCourseForm({
      name: "",
      tee_name: "",
      round_type: "18",
      slope_rating: "",
      course_rating: "",
      par: "",
      hole_pars: "",
    });
    refresh();
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Commish Panel</h1>

      {/* Players */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-3">Players</h2>
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
          <button className="min-h-[48px] bg-fairway-500 hover:bg-fairway-600 text-white px-5 rounded-lg font-medium">
            Add
          </button>
        </form>

        <ul className="divide-y divide-fairway-100">
          {players.map((p) => (
            <li key={p.id} className="py-2 flex items-center justify-between">
              <span>{p.name}</span>
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
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-3">Weeks</h2>
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
          <button className="sm:col-span-3 min-h-[48px] bg-fairway-500 hover:bg-fairway-600 text-white py-3 rounded-lg font-medium">
            Add Week
          </button>
        </form>
        <ul className="divide-y divide-fairway-100">
          {weeks.map((w) => (
            <li key={w.id} className="py-2 flex items-center justify-between">
              <span>
                Week {w.week_number} ({w.start_date} – {w.end_date})
              </span>
              <span className="text-sm text-fairway-500">{w.status}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Courses */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-3">Courses</h2>

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
            <input
              className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
              placeholder="Tee name (e.g. Blue)"
              value={courseForm.tee_name}
              onChange={(e) => setCourseForm({ ...courseForm, tee_name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
              value={courseForm.round_type}
              onChange={(e) => setCourseForm({ ...courseForm, round_type: e.target.value })}
            >
              <option value="18">18 holes</option>
              <option value="9">9 holes</option>
            </select>
            <input
              type="number"
              step="0.1"
              className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
              placeholder="Slope"
              value={courseForm.slope_rating}
              onChange={(e) => setCourseForm({ ...courseForm, slope_rating: e.target.value })}
              required
            />
            <input
              type="number"
              step="0.1"
              className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
              placeholder="Course Rating"
              value={courseForm.course_rating}
              onChange={(e) => setCourseForm({ ...courseForm, course_rating: e.target.value })}
              required
            />
            <input
              type="number"
              className="min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
              placeholder="Par"
              value={courseForm.par}
              onChange={(e) => setCourseForm({ ...courseForm, par: e.target.value })}
              required
            />
          </div>
          <input
            className="w-full min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
            placeholder="Hole pars, comma separated (e.g. 4,4,3,5,4,4,3,4,5,...)"
            value={courseForm.hole_pars}
            onChange={(e) => setCourseForm({ ...courseForm, hole_pars: e.target.value })}
            required
          />
          <button className="w-full min-h-[48px] bg-fairway-500 hover:bg-fairway-600 text-white py-3 rounded-lg font-medium">
            Add Course
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
