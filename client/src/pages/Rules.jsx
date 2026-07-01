const sections = [
  {
    title: "Scoring",
    items: [
      {
        term: "Course Handicap",
        detail: "Handicap Index × (Slope Rating / 113) + (Course Rating − Par)",
      },
      {
        term: "Net Score",
        detail: "Gross Score − Course Handicap. Lower is better.",
      },
      {
        term: "Net Stableford Points",
        detail:
          "Points per hole based on net score vs. par — double bogey or worse: 0, bogey: 1, par: 2, birdie: 3, eagle: 4, albatross: 5. Strokes are allocated evenly across holes as an approximation (exact USGA stroke-index allocation would need a stroke_index array per hole, which the course database doesn't provide consistently).",
      },
      {
        term: "Double-par cap",
        detail:
          "Each hole score is capped at double par before totals are calculated — keeps one blow-up hole from wrecking a round's math.",
      },
      {
        term: "9-hole rounds",
        detail:
          "Course handicap uses a halved Handicap Index against the 9-hole slope/rating. It's an approximation of USGA's official 9-hole calculation, close enough for casual play.",
      },
    ],
  },
  {
    title: "Multiple rounds per week",
    items: [
      {
        term: "You can submit more than one round in a week",
        detail:
          "Play it twice, correct a bad number, whatever — submit as many rounds as you want for a given week.",
      },
      {
        term: "Only your best round counts",
        detail:
          "For standings, each player's lowest net score in a week is the one that counts — both for that week's leaderboard and for season totals. Every other round you submit that week still shows up (marked separately) but doesn't affect points.",
      },
    ],
  },
  {
    title: "Standings",
    items: [
      {
        term: "Weekly Leaderboard",
        detail: "Ranks players by net score for a single week, best round only.",
      },
      {
        term: "Season Leaderboard",
        detail:
          "Ranks players by total Stableford points, summed across each week's best round.",
      },
    ],
  },
  {
    title: "Getting set up",
    items: [
      {
        term: "Add yourself",
        detail: "Use \"Add yourself\" on the Submit Round page — no commish needed.",
      },
      {
        term: "Courses",
        detail:
          "Search the course database when submitting a round or from the Commish panel. If a course isn't found, add it manually with slope, rating, par, and hole-by-hole pars from the scorecard.",
      },
      {
        term: "Handicap Index",
        detail:
          "Manual for now — update yours from GHIN.com or the GHIN app whenever it changes. There's no public GHIN API without a partnership, so this avoids a fragile scraper.",
      },
      {
        term: "No auth",
        detail:
          "Anyone with the link can submit for anyone. Fine for a trusted friend group — be nice.",
      },
    ],
  },
];

export default function Rules() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Rules</h1>

      <div className="space-y-6">
        {sections.map((section) => (
          <section
            key={section.title}
            className="bg-white rounded-xl shadow-card border border-fairway-100 p-6"
          >
            <h2 className="text-lg font-bold text-fairway-800 mb-4">{section.title}</h2>
            <dl className="space-y-4">
              {section.items.map((item) => (
                <div key={item.term}>
                  <dt className="font-semibold text-fairway-700 text-sm">{item.term}</dt>
                  <dd className="text-sm text-fairway-600 mt-0.5 leading-relaxed">
                    {item.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
