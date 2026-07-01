// Tap-only score entry for a single hole — no keyboard needed, which
// matters when you're standing on a tee box with your phone. Starts at
// par and steps up/down, with a relative-to-par badge for quick reads.
const MIN_SCORE = 1;

export default function HoleScoreStepper({ index, par, value, onChange }) {
  const diff = value - par;
  const diffLabel = diff === 0 ? "E" : diff > 0 ? `+${diff}` : `${diff}`;
  const diffClass =
    diff <= -1
      ? "text-blue-600 bg-blue-50"
      : diff === 0
      ? "text-fairway-600 bg-fairway-50"
      : diff === 1
      ? "text-amber-600 bg-amber-50"
      : "text-red-600 bg-red-50";

  const dec = () => onChange(Math.max(MIN_SCORE, value - 1));
  const inc = () => onChange(value + 1);

  return (
    <div className="bg-white border border-fairway-100 rounded-xl shadow-sm p-3 flex flex-col items-center gap-1.5">
      <div className="text-[11px] font-semibold text-fairway-500 uppercase tracking-wide">
        Hole {index + 1} &middot; Par {par}
      </div>
      <div className="text-3xl font-extrabold text-fairway-900 tabular-nums leading-none my-1">
        {value}
      </div>
      <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${diffClass}`}>
        {diffLabel}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <button
          type="button"
          aria-label={`Decrease hole ${index + 1} score`}
          onClick={dec}
          className="w-11 h-11 rounded-full bg-fairway-100 hover:bg-fairway-200 active:scale-95 text-fairway-700 text-xl font-bold flex items-center justify-center transition-all"
        >
          &minus;
        </button>
        <button
          type="button"
          aria-label={`Increase hole ${index + 1} score`}
          onClick={inc}
          className="w-11 h-11 rounded-full bg-fairway-500 hover:bg-fairway-600 active:scale-95 text-white text-xl font-bold flex items-center justify-center transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
}
