// Core scoring logic for M4D Golf League
// Handles the slope/rating normalization + double-par capping + net/Stableford scoring

/**
 * Course Handicap formula (USGA):
 * Course Handicap = Handicap Index x (Slope Rating / 113) + (Course Rating - Par)
 */
export function calculateCourseHandicap({ handicapIndex, slopeRating, courseRating, par }) {
  const raw = handicapIndex * (slopeRating / 113) + (courseRating - par);
  return Math.round(raw);
}

/**
 * Caps each hole score at double par (per-hole cap agreed on for this league).
 * holeScores and holePars must be same length (9 or 18).
 */
export function capHoleScores(holeScores, holePars) {
  if (holeScores.length !== holePars.length) {
    throw new Error("holeScores and holePars length mismatch");
  }
  return holeScores.map((score, i) => Math.min(score, holePars[i] * 2));
}

/**
 * Full round calculation: takes raw inputs, returns everything needed to store.
 */
export function calculateRound({
  holeScores,
  holePars,
  handicapIndex,
  slopeRating,
  courseRating,
  par,
}) {
  const cappedHoleScores = capHoleScores(holeScores, holePars);
  const grossScore = cappedHoleScores.reduce((sum, s) => sum + s, 0);
  const courseHandicap = calculateCourseHandicap({
    handicapIndex,
    slopeRating,
    courseRating,
    par,
  });
  const netScore = grossScore - courseHandicap;

  return {
    cappedHoleScores,
    grossScore,
    courseHandicap,
    netScore,
  };
}

/**
 * Net Stableford points per hole:
 * Double bogey or worse (net) = 0
 * Bogey (net) = 1
 * Par (net) = 2
 * Birdie (net) = 3
 * Eagle (net) = 4
 * Albatross (net) = 5
 *
 * Strokes are allocated one per hole up to courseHandicap, cycling through
 * holes by stroke index if courseHandicap > number of holes.
 * Since we don't store per-hole stroke index (handicap allocation) for every
 * course, this uses an even allocation across holes as an approximation.
 * If you want exact USGA stroke allocation, add a `stroke_index` array to
 * the courses table and swap the allocation logic below.
 */
export function calculateStablefordPoints({ cappedHoleScores, holePars, courseHandicap }) {
  const numHoles = holePars.length;
  const baseStrokesPerHole = Math.floor(courseHandicap / numHoles);
  const extraStrokeHoles = courseHandicap % numHoles; // first N holes get +1 (approximation)

  let totalPoints = 0;

  for (let i = 0; i < numHoles; i++) {
    const strokesReceived = baseStrokesPerHole + (i < extraStrokeHoles ? 1 : 0);
    const netScore = cappedHoleScores[i] - strokesReceived;
    const diff = netScore - holePars[i]; // negative = under par

    let points;
    if (diff <= -3) points = 5;
    else if (diff === -2) points = 4;
    else if (diff === -1) points = 3;
    else if (diff === 0) points = 2;
    else if (diff === 1) points = 1;
    else points = 0;

    totalPoints += points;
  }

  return totalPoints;
}

/**
 * 9-hole handicap index adjustment per USGA guidance:
 * roughly half the 18-hole index, but course handicap calc still uses
 * the 9-hole slope/rating for that tee. Most leagues just use the same
 * handicap_index and the 9-hole slope/rating - USGA's official 9-hole
 * calc is more nuanced but this is a reasonable approximation for a
 * friends league.
 */
export function calculateNineHoleCourseHandicap({ handicapIndex, slopeRating, courseRating, par }) {
  const halvedIndex = handicapIndex / 2;
  return calculateCourseHandicap({
    handicapIndex: halvedIndex,
    slopeRating,
    courseRating,
    par,
  });
}
