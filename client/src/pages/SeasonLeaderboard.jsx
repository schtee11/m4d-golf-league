import { useEffect, useState } from "react";
import { api } from "../api.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function SeasonLeaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.leaderboard
      .season()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="p-6 text-fairway-600 animate-pulse">Loading leaderboard...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Season Leaderboard</h1>
      <div className="bg-white rounded-xl shadow-card border border-fairway-100 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-fairway-600 text-white">
            <tr>
              <th className="p-3 text-sm font-semibold">#</th>
              <th className="p-3 text-sm font-semibold">Player</th>
              <th className="p-3 text-sm font-semibold text-right">Rounds</th>
              <th className="p-3 text-sm font-semibold text-right">Avg Net</th>
              <th className="p-3 text-sm font-semibold text-right">Total Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.player_id}
                className={`border-t border-fairway-100 transition-colors hover:bg-fairway-50 ${
                  i % 2 === 1 ? "bg-fairway-50/40" : ""
                }`}
              >
                <td className="p-3 font-semibold">{MEDALS[i] ?? i + 1}</td>
                <td className="p-3 font-medium">{r.player_name}</td>
                <td className="p-3 text-right text-fairway-600">{r.rounds_played}</td>
                <td className="p-3 text-right text-fairway-600">{r.avg_net_score ?? "-"}</td>
                <td className="p-3 text-right font-bold text-fairway-700">
                  {r.total_stableford_points}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-fairway-400">
                  No results yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
