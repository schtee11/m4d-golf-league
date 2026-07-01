import { NavLink, Routes, Route } from "react-router-dom";
import SeasonLeaderboard from "./pages/SeasonLeaderboard.jsx";
import WeeklyLeaderboard from "./pages/WeeklyLeaderboard.jsx";
import SubmitRound from "./pages/SubmitRound.jsx";
import Commish from "./pages/Commish.jsx";
import Rules from "./pages/Rules.jsx";

const navLinkClass = ({ isActive }) =>
  `px-3.5 py-2 min-h-[44px] flex items-center rounded-full text-sm font-medium transition-colors duration-150 ${
    isActive
      ? "bg-fairway-600 text-white shadow-sm"
      : "text-fairway-700 hover:bg-fairway-100"
  }`;

export default function App() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-fairway-100 shadow-sm px-4 py-3 flex items-center gap-2 flex-wrap">
        <span className="font-extrabold tracking-tight text-fairway-700 mr-2 flex items-center gap-1.5">
          <span className="text-xl">⛳</span> M4D Golf League
        </span>
        <NavLink to="/" end className={navLinkClass}>
          Season
        </NavLink>
        <NavLink to="/weekly" className={navLinkClass}>
          Weekly
        </NavLink>
        <NavLink to="/submit" className={navLinkClass}>
          Submit Round
        </NavLink>
        <NavLink to="/commish" className={navLinkClass}>
          Commish
        </NavLink>
        <NavLink to="/rules" className={navLinkClass}>
          Rules
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<SeasonLeaderboard />} />
        <Route path="/weekly" element={<WeeklyLeaderboard />} />
        <Route path="/submit" element={<SubmitRound />} />
        <Route path="/commish" element={<Commish />} />
        <Route path="/rules" element={<Rules />} />
      </Routes>
    </div>
  );
}
