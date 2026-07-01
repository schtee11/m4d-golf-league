import { NavLink, Routes, Route } from "react-router-dom";
import SeasonLeaderboard from "./pages/SeasonLeaderboard.jsx";
import WeeklyLeaderboard from "./pages/WeeklyLeaderboard.jsx";
import SubmitRound from "./pages/SubmitRound.jsx";
import Commish from "./pages/Commish.jsx";

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 min-h-[44px] flex items-center rounded ${
    isActive ? "bg-fairway-600 text-white" : "text-fairway-700 hover:bg-fairway-100"
  }`;

export default function App() {
  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow px-4 py-3 flex items-center gap-2 flex-wrap">
        <span className="font-bold text-fairway-700 mr-4">⛳ M4D Golf League</span>
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
      </nav>

      <Routes>
        <Route path="/" element={<SeasonLeaderboard />} />
        <Route path="/weekly" element={<WeeklyLeaderboard />} />
        <Route path="/submit" element={<SubmitRound />} />
        <Route path="/commish" element={<Commish />} />
      </Routes>
    </div>
  );
}
