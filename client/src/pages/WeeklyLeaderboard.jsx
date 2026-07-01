import { useEffect, useState } from "react";
import { api } from "../api.js";

const MEDALS = ["🥇", "🥈", "🥉"];

function RankBadge({ rank }) {
  if (rank <= 3) {
    return (
      <span className="w-9 h-9 rounded-full flex items-center justify-center text-base bg-gradient-to-b from-gold-200 to-gold-400 text-fairway-950 shadow-sm shrink-0">
        {MEDALS[rank - 1]}
      </span>
    );
  }
  return (
    <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-fairway-500 bg-fairway-50 border border-fairway-900/10 shrink-0">
      {rank}
    </span>
  );
}

export default function WeeklyLeaderboard() {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [rows, setRows] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.weeks
      .list()
      .then((data) => {
        setWeeks(data);
        if (data.length > 0) setSelectedWeek(data[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedWeek) return;
    Promise.all([
      api.leaderboard.week(selectedWeek),
      api.leaderboard.weekAll(selectedWeek),
    ])
      .then(([best, all]) => {
        setRows(best);
        setAllRounds(all);
      })
      .catch((e) => setError(e.message));
  }, [selectedWeek]);

  const countingIds = new Set(rows.map((r) => r.id));
  const extraRounds = allRounds.filter((r) => !countingIds.has(r.id));
  const currentWeek = weeks.find((w) => w.id === selectedWeek);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <div className="eyebrow mb-1.5">Standings</div>
          <h1 className="page-title">Weekly Leaderboard</h1>
          <p className="text-sm text-fairway-500 mt-1.5">
            Best round per player counts toward the week.
          </p>
        </div>

        {weeks.length > 0 && (
          <select
            className="input-field w-auto min-w-[180px]"
            value={selectedWeek || ""}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                Week {w.week_number} ({w.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="skeleton h-10 w-48 rounded-lg" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      )}

      {error && !loading && (
        <div className="card p-5 text-sm text-red-700 border-red-200 bg-red-50/60">
          Couldn't load the leaderboard: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {currentWeek && (
            <div className="flex items-center gap-2 mb-3 text-xs text-fairway-500">
              <span className="font-semibold text-fairway-700">
                Week {currentWeek.week_number}
              </span>
              <span
                className={`badge ${
                  currentWeek.status === "open"
                    ? "bg-fairway-100 text-fairway-700"
                    : "bg-fairway-950/10 text-fairway-500"
                }`}
              >
                {currentWeek.status}
              </span>
            </div>
          )}

          <div className="card overflow-hidden animate-fade-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="table-head">
                  <tr>
                    <th className="w-14"></th>
                    <th>Player</th>
                    <th>Course</th>
                    <th className="text-right">Gross</th>
                    <th className="text-right">CH</th>
                    <th className="text-right">Net</th>
                    <th className="text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} className="table-row">
                      <td className="p-3 pl-4">
                        <RankBadge rank={i + 1} />
                      </td>
                      <td className="p-3 font-medium text-fairway-900">{r.player_name}</td>
                      <td className="p-3 text-sm text-fairway-500">
                        {r.course_name}
                        <span className="text-fairway-400"> · {r.tee_name}</span>
                      </td>
                      <td className="p-3 text-right text-fairway-500 tabular-nums">
                        {r.gross_score}
                      </td>
                      <td className="p-3 text-right text-fairway-500 tabular-nums">
                        {r.course_handicap}
                      </td>
                      <td className="p-3 text-right font-serif font-semibold text-fairway-950 text-base tabular-nums">
                        {r.net_score}
                      </td>
                      <td className="p-3 pr-4 text-right font-semibold text-gold-600 tabular-nums">
                        {r.stableford_points}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-fairway-400 text-sm">
                        No rounds submitted for this week yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {extraRounds.length > 0 && (
            <div className="mt-6 animate-fade-up">
              <h2 className="text-xs font-semibold tracking-wide uppercase text-fairway-400 mb-2.5">
                Other rounds this week
              </h2>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <tbody>
                      {extraRounds.map((r) => (
                        <tr key={r.id} className="table-row text-sm text-fairway-500">
                          <td className="p-3 pl-4 font-medium text-fairway-700">
                            {r.player_name}
                          </td>
                          <td className="p-3">
                            {r.course_name} <span className="text-fairway-400">({r.tee_name})</span>
                          </td>
                          <td className="p-3 text-right tabular-nums">Gross {r.gross_score}</td>
                          <td className="p-3 text-right tabular-nums">Net {r.net_score}</td>
                          <td className="p-3 pr-4 text-right tabular-nums">
                            {r.stableford_points} pts
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
