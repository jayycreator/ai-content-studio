export interface Recipe {
  id: string;
  name: string;
  // One line shown to the creator when picking a format.
  blurb: string;
  // Default finished length if the creator doesn't ask for one.
  targetSeconds: number;
  // Segment pacing bounds, in seconds. The planner keeps cuts inside this.
  minSegment: number;
  maxSegment: number;
  // Injected into the vision step — what to look for in this format.
  lookFor: string;
  // Injected into the edit planner — how to cut this format well.
  editGuidance: string;
}
