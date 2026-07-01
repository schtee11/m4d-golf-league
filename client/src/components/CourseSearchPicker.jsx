import { useState } from "react";
import { api } from "../api.js";

// Two-step course search: find the course first, then pick a tee.
// Picking a tee determines slope/rating/hole pars (and therefore handicap),
// so it's kept as a distinct, deliberate step rather than one long flat list.
// Calls onApply({ name, tee_name, round_type, slope_rating, course_rating, par, hole_pars })
// where hole_pars is an array. onCancel closes the picker without selecting anything.
export default function CourseSearchPicker({ onApply, onCancel }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "error"
  const [courseGroups, setCourseGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const search = async (e) => {
    e?.preventDefault();
    if (query.trim().length < 3) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    setSelectedGroup(null);
    try {
      const { results } = await api.courses.search(query);
      const groups = new Map();
      for (const r of results) {
        const key = r.source_id ?? `${r.club_name}|${r.city}|${r.state}`;
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            club_name: r.club_name,
            city: r.city,
            state: r.state,
            country: r.country,
            tees: [],
          });
        }
        groups.get(key).tees.push(r);
      }
      setCourseGroups([...groups.values()]);
      setStatus(groups.size === 0 ? "empty" : null);
    } catch (err) {
      setStatus("error");
    }
  };

  const applyTee = (tee, subset) => {
    let holePars = tee.hole_pars;
    let roundType = String(tee.number_of_holes);

    if (subset === "front") {
      holePars = holePars.slice(0, 9);
      roundType = "9";
    } else if (subset === "back") {
      holePars = holePars.slice(holePars.length - 9);
      roundType = "9";
    }

    onApply({
      name: tee.club_name,
      tee_name: `${tee.tee_name} (${tee.gender === "female" ? "W" : "M"})`,
      round_type: roundType,
      slope_rating: tee.slope_rating,
      course_rating: tee.course_rating,
      par: holePars.reduce((sum, p) => sum + p, 0),
      hole_pars: holePars,
    });
  };

  return (
    <div className="p-4 bg-fairway-50 rounded-xl border border-fairway-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Search course database</h3>
        {onCancel && (
          <button
            type="button"
            className="text-sm text-fairway-500 hover:text-fairway-700"
            onClick={onCancel}
          >
            Close
          </button>
        )}
      </div>

      {!selectedGroup && (
        <>
          {/* Not a <form>: this component can be nested inside SubmitRound's
              outer <form>, and nested forms are invalid HTML (the browser
              silently mangles the DOM and breaks React state). */}
          <div className="flex gap-2">
            <input
              className="flex-1 min-h-[48px] p-3 text-base border border-fairway-300 rounded-lg"
              placeholder="Course name (e.g. Pebble Beach)"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") search(e);
              }}
            />
            <button
              type="button"
              className="min-h-[48px] bg-fairway-500 hover:bg-fairway-600 active:scale-[0.98] text-white px-5 rounded-lg font-medium transition-all"
              onClick={search}
            >
              Search
            </button>
          </div>

          {status === "loading" && <p className="text-sm text-fairway-500 mt-2">Searching...</p>}
          {status === "error" && (
            <p className="text-sm text-red-600 mt-2">
              Search failed. Try a longer or different course name.
            </p>
          )}
          {status === "empty" && (
            <p className="text-sm text-fairway-500 mt-2">
              No courses found. Try a different spelling, or add it manually below.
            </p>
          )}

          {courseGroups.length > 0 && (
            <ul className="mt-3 space-y-2 max-h-96 overflow-y-auto">
              {courseGroups.map((g) => (
                <li key={g.key}>
                  <button
                    type="button"
                    className="w-full text-left min-h-[56px] bg-white p-3 rounded-lg border border-fairway-200 hover:border-fairway-400"
                    onClick={() => setSelectedGroup(g)}
                  >
                    <div className="text-sm font-semibold">{g.club_name}</div>
                    {g.city && (
                      <div className="text-xs text-fairway-500">
                        {g.city}, {g.state || g.country} &middot; {g.tees.length} tee
                        {g.tees.length === 1 ? "" : "s"}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {selectedGroup && (
        <div>
          <button
            type="button"
            className="text-sm text-fairway-600 hover:text-fairway-800 mb-2"
            onClick={() => setSelectedGroup(null)}
          >
            &larr; Back to courses
          </button>
          <div className="text-sm font-semibold mb-2">
            {selectedGroup.club_name}
            {selectedGroup.city && (
              <span className="text-fairway-500 font-normal">
                {" "}
                &middot; {selectedGroup.city}, {selectedGroup.state || selectedGroup.country}
              </span>
            )}
          </div>
          <p className="text-xs text-fairway-500 mb-2">
            Pick the tee you played — this sets the slope, rating, and hole pars used for
            your handicap.
          </p>
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {selectedGroup.tees.map((tee, i) => (
              <li key={i} className="bg-white p-3 rounded-lg border border-fairway-200">
                <div className="text-sm font-semibold">
                  {tee.tee_name} tee ({tee.gender === "female" ? "women's" : "men's"})
                </div>
                <div className="text-xs text-fairway-600 mb-2">
                  {tee.number_of_holes} holes &middot; Slope {tee.slope_rating}, Rating{" "}
                  {tee.course_rating}, Par {tee.par}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="min-h-[40px] px-3 text-sm bg-fairway-500 hover:bg-fairway-600 text-white rounded-lg"
                    onClick={() => applyTee(tee, "all")}
                  >
                    Use all {tee.number_of_holes}
                  </button>
                  {tee.number_of_holes === 18 && (
                    <>
                      <button
                        type="button"
                        className="min-h-[40px] px-3 text-sm bg-fairway-100 hover:bg-fairway-200 text-fairway-700 rounded-lg"
                        onClick={() => applyTee(tee, "front")}
                      >
                        Front 9 only
                      </button>
                      <button
                        type="button"
                        className="min-h-[40px] px-3 text-sm bg-fairway-100 hover:bg-fairway-200 text-fairway-700 rounded-lg"
                        onClick={() => applyTee(tee, "back")}
                      >
                        Back 9 only
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
