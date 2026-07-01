import { NavLink, Routes, Route } from "react-router-dom";
import SeasonLeaderboard from "./pages/SeasonLeaderboard.jsx";
import WeeklyLeaderboard from "./pages/WeeklyLeaderboard.jsx";
import SubmitRound from "./pages/SubmitRound.jsx";
import Commish from "./pages/Commish.jsx";
import Rules from "./pages/Rules.jsx";

const navItems = [
  { to: "/", label: "Season", end: true },
  { to: "/weekly", label: "Weekly" },
  { to: "/submit", label: "Submit Round" },
  { to: "/commish", label: "Commish" },
  { to: "/rules", label: "Rules" },
];

const navLinkClass = ({ isActive }) =>
  `relative px-1 py-2 text-sm font-medium tracking-tight transition-colors duration-150 whitespace-nowrap ${
    isActive ? "text-fairway-950" : "text-fairway-500 hover:text-fairway-800"
  } after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:rounded-full after:bg-gold-500 after:transition-transform after:duration-200 after:origin-left ${
    isActive ? "after:scale-x-100" : "after:scale-x-0"
  }`;

function FlagMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-fairway-950" />
      <line
        x1="12"
        y1="7"
        x2="12"
        y2="25"
        stroke="#faf5e9"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M12 8 L22 11.5 L12 15 Z" className="fill-gold-400" />
    </svg>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-cream-100/85 backdrop-blur-md border-b border-fairway-900/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
              <FlagMark className="w-8 h-8 shadow-sm rounded-[8px]" />
              <div className="leading-none">
                <div className="font-serif text-lg font-semibold text-fairway-950 tracking-tight">
                  M4D Golf League
                </div>
                <div className="eyebrow mt-0.5">Est. Weekly Standings</div>
              </div>
            </NavLink>

            <nav className="hidden sm:flex items-center gap-6">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <nav className="sm:hidden flex items-center gap-5 overflow-x-auto pb-2.5 -mx-1 px-1 scrollbar-none">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="h-[3px] bg-gradient-to-r from-fairway-900 via-gold-500 to-fairway-900" />
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<SeasonLeaderboard />} />
          <Route path="/weekly" element={<WeeklyLeaderboard />} />
          <Route path="/submit" element={<SubmitRound />} />
          <Route path="/commish" element={<Commish />} />
          <Route path="/rules" element={<Rules />} />
        </Routes>
      </main>

      <footer className="mt-10 border-t border-fairway-900/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-fairway-500">
          <span>M4D Golf League &middot; handicap-adjusted, friend-group official</span>
          <span className="text-fairway-400">Scores don't lie. Mostly.</span>
        </div>
      </footer>
    </div>
  );
}
