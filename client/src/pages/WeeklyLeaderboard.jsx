import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function WeeklyLeaderboard() {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [rows, setRows] = useState([]);
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
    api.leaderboard.week(selectedWeek).then(setRows).catch((e) => setError(e.message));
  }, [selectedWeek]);

  if (loading) return <div className="p-6 text-fairway-600">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Weekly Leaderboard</h1>

      <select
        className="mb-4 w-full sm:w-auto min-h-[48px] p-3 text-base rounded-lg border border-fairway-400"
        value={selectedWeek || ""}
        onChange={(e) => setSelectedWeek(Number(e.target.value))}
      >
        {weeks.map((w) => (
          <option key={w.id} value={w.id}>
            Week {w.week_number} ({w.status})
          </option>
        ))}
      </select>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-fairway-500 text-white">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Player</th>
              <th className="p-3">Course</th>
              <th className="p-3 text-right">Gross</th>
              <th className="p-3 text-right">CH</th>
              <th className="p-3 text-right">Net</th>
              <th className="p-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-fairway-100">
                <td className="p-3 font-semibold">{i + 1}</td>
                <td className="p-3">{r.player_name}</td>
                <td className="p-3 text-sm text-fairway-600">
                  {r.course_name} ({r.tee_name})
                </td>
                <td className="p-3 text-right">{r.gross_score}</td>
                <td className="p-3 text-right">{r.course_handicap}</td>
                <td className="p-3 text-right font-bold">{r.net_score}</td>
                <td className="p-3 text-right">{r.stableford_points}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-fairway-400">
                  No rounds submitted for this week yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
