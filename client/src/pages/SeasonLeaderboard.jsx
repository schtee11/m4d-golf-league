import { useEffect, useState } from "react";
import { api } from "../api.js";

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_STYLES = [
  {
    ring: "ring-gold-400",
    badge: "bg-gradient-to-b from-gold-300 to-gold-500 text-fairway-950 shadow-gold",
    order: "sm:order-2",
    lift: "sm:-translate-y-3",
  },
  {
    ring: "ring-fairway-200",
    badge: "bg-gradient-to-b from-slate-200 to-slate-400 text-fairway-950",
    order: "sm:order-1",
    lift: "",
  },
  {
    ring: "ring-amber-700/30",
    badge: "bg-gradient-to-b from-amber-500 to-amber-700 text-cream-50",
    order: "sm:order-3",
    lift: "",
  },
];

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

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-7 animate-fade-up">
        <div className="eyebrow mb-1.5">Standings</div>
        <h1 className="page-title">Season Leaderboard</h1>
        <p className="text-sm text-fairway-500 mt-1.5 max-w-md">
          Ranked by total Stableford points, summed across each week's best round.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="skeleton h-28 rounded-2xl" />
            <div className="skeleton h-28 rounded-2xl" />
            <div className="skeleton h-28 rounded-2xl" />
          </div>
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
          {podium.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 items-end animate-fade-up">
              {podium.map((r, i) => {
                const style = PODIUM_STYLES[i];
                return (
                  <div
                    key={r.player_id}
                    className={`card ${style.order} ${style.lift} ring-1 ${style.ring} p-4 sm:p-5 text-center flex flex-col items-center gap-1.5`}
                  >
                    <span
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${style.badge}`}
                    >
                      {MEDALS[i]}
                    </span>
                    <div className="font-semibold text-fairway-950 text-sm sm:text-base leading-tight mt-1 line-clamp-2">
                      {r.player_name}
                    </div>
                    <div className="font-serif text-2xl sm:text-3xl font-semibold text-fairway-900 tabular-nums">
                      {r.total_stableford_points}
                    </div>
                    <div className="eyebrow !text-fairway-400">points</div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="card overflow-hidden animate-fade-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="table-head">
                  <tr>
                    <th className="w-14"></th>
                    <th>Player</th>
                    <th className="text-right">Rounds</th>
                    <th className="text-right">Avg Net</th>
                    <th className="text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.player_id} className="table-row">
                      <td className="p-3 pl-4">
                        <RankBadge rank={i + 1} />
                      </td>
                      <td className="p-3 font-medium text-fairway-900">{r.player_name}</td>
                      <td className="p-3 text-right text-fairway-500 tabular-nums">
                        {r.rounds_played}
                      </td>
                      <td className="p-3 text-right text-fairway-500 tabular-nums">
                        {r.avg_net_score ?? "–"}
                      </td>
                      <td className="p-3 pr-4 text-right font-serif font-semibold text-fairway-950 text-base tabular-nums">
                        {r.total_stableford_points}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-fairway-400 text-sm">
                        No results yet — submit a round to get on the board.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
