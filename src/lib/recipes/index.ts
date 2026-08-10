import type { Recipe } from "./types";

export type { Recipe } from "./types";

// A day-in-the-life short: walking shots, location pans, quick interactions.
// Little usable speech, so the cut is driven by motion and visual variety.
const dayInTheLife: Recipe = {
  id: "day-in-the-life",
  name: "Day in the life",
  blurb: "Walking shots, location pans, quick moments — stitched into a tight recap.",
  targetSeconds: 35,
  minSegment: 1.2,
  maxSegment: 4,
  lookFor:
    "Steady, well-framed moments: a clear subject, a location reveal, a pan that lands, " +
    "a genuine interaction. Note shaky, blurred, dark, or accidental-recording frames as low quality. " +
    "Flag the single strongest few seconds of each clip as the hook-worthy moment.",
  editGuidance:
    "Open on the strongest, most establishing shot to set the scene. Vary the shot types so " +
    "two similar framings never sit back to back. Keep energy up: trim dead air, walking-to-nowhere, " +
    "and fumbling at the start/end of clips. Prefer short, punchy segments and end on a moment that " +
    "feels like an arrival or a beat of payoff rather than trailing off.",
};

// A chronological recap of a day or an outing. More room to breathe than a
// day-in-the-life: the cut follows a story arc rather than pure visual variety.
const vlogRecap: Recipe = {
  id: "vlog-recap",
  name: "Vlog recap",
  blurb: "A day or trip told in order — hook, the good bits, a wrap-up.",
  targetSeconds: 45,
  minSegment: 1.5,
  maxSegment: 5,
  lookFor:
    "Story beats: an establishing shot that sets the scene, arrivals, the main activity, " +
    "genuine reactions, and a natural wrap-up moment. Keep clear speech worth hearing. " +
    "Note shaky, blurred, dark, or fumbled frames as low quality, and flag each clip's most story-worthy few seconds.",
  editGuidance:
    "Cut a chronological arc. Open on a hook or establishing shot, then move through the day in the " +
    "order it happened, letting moments breathe a beat longer than a fast montage would. Keep natural " +
    "narration beats intact. Vary shot types, trim fumbling and dead air, and close on a wrap-up or " +
    "reflection that lands. Use captions to label the place or moment when it adds context.",
};

// Get-ready / routine format: setup, the process, then a payoff reveal.
const getReady: Recipe = {
  id: "get-ready",
  name: "Get ready with me",
  blurb: "A routine or process built to a satisfying before-and-after reveal.",
  targetSeconds: 30,
  minSegment: 1,
  maxSegment: 3.5,
  lookFor:
    "Steps in a process or routine: the starting 'before' state, in-progress actions " +
    "(hands, products, mirror, tools), and the finished 'after' reveal. Flag the single clearest " +
    "reveal or payoff moment. Note out-of-focus or awkward frames as low quality.",
  editGuidance:
    "Structure as setup -> process -> reveal. Open on the before-state or the intent, chain the routine " +
    "steps quickly so the progress is legible, and land firmly on the finished-look payoff as the closer. " +
    "Keep it snappy but readable. Caption the steps briefly so the sequence is easy to follow.",
};

// Fast, beat-driven transition montage: energy and visual hits over completeness.
const hypeMontage: Recipe = {
  id: "hype-montage",
  name: "Hype montage",
  blurb: "Fast, punchy, transition-driven cuts for maximum energy.",
  targetSeconds: 20,
  minSegment: 0.6,
  maxSegment: 2.5,
  lookFor:
    "High-energy peaks: motion, transitions (whip pans, match cuts), and visually striking frames. " +
    "Flag the single most dynamic beat of each clip. Note static, slow, or dull stretches as low quality.",
  editGuidance:
    "Cut a fast, beat-driven montage. Use very short, punchy segments and cut on motion. Favor visual " +
    "variety and momentum over telling a complete story. Open on the most eye-catching frame, keep " +
    "escalating the energy, and end on a strong final hit. Keep captions minimal — let the visuals drive.",
};

const RECIPES: Record<string, Recipe> = {
  [dayInTheLife.id]: dayInTheLife,
  [vlogRecap.id]: vlogRecap,
  [getReady.id]: getReady,
  [hypeMontage.id]: hypeMontage,
};

export const DEFAULT_RECIPE_ID = dayInTheLife.id;

export function getRecipe(id?: string | null): Recipe {
  if (id && RECIPES[id]) return RECIPES[id];
  return RECIPES[DEFAULT_RECIPE_ID];
}

export function listRecipes(): Recipe[] {
  return Object.values(RECIPES);
}
