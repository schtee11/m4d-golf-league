import { useEffect, useState } from "react";
import { api } from "../api.js";

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

  if (loading) return <div className="p-6 text-fairway-600">Loading leaderboard...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Season Leaderboard</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-fairway-500 text-white">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Player</th>
              <th className="p-3 text-right">Rounds</th>
              <th className="p-3 text-right">Avg Net</th>
              <th className="p-3 text-right">Total Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.player_id} className="border-t border-fairway-100">
                <td className="p-3 font-semibold">{i + 1}</td>
                <td className="p-3">{r.player_name}</td>
                <td className="p-3 text-right">{r.rounds_played}</td>
                <td className="p-3 text-right">{r.avg_net_score ?? "-"}</td>
                <td className="p-3 text-right font-bold">{r.total_stableford_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
