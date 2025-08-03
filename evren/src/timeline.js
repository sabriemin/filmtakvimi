// src/timeline.js

export function toggleTimelineFactory(ctx) {
  return function toggleTimeline() {
    ctx.timelineMode = !ctx.timelineMode;
    ctx.applyFilters();
  };
}
