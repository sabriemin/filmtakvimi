export function initFilters(ctx) {
  let debounceTimeout = null;

  ctx.$watch('search', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      applyFilters(ctx);
    }, 300);
  });

  ctx.$watch('selectedUniverse', () => applyFilters(ctx));
  ctx.$watch('selectedEdgeType', () => applyFilters(ctx));
  ctx.$watch('maxYear', () => applyFilters(ctx));
}

export function applyFilters(ctx) {
  const searchTerm = ctx.search.toLowerCase();
  const universe = ctx.selectedUniverse;
  const edgeType = ctx.selectedEdgeType;
  const maxYear = ctx.maxYear;

  ctx.filteredNodes = ctx.allNodes.filter(n =>
    (!universe || n.universe === universe) &&
    (!searchTerm || (n.label && n.label.toLowerCase().includes(searchTerm))) &&
    (!maxYear || !n.release_date || new Date(n.release_date).getFullYear() <= maxYear)
  );

  const nodeIds = new Set(ctx.filteredNodes.map(n => n.id));

  ctx.filteredEdges = ctx.allEdges.filter(e =>
    nodeIds.has(e.from) && nodeIds.has(e.to) &&
    (!edgeType || e.type === edgeType)
  );

  ctx.updateNetwork?.();

if(ctx.network) {
  if(ctx.fitTimeout) clearTimeout(ctx.fitTimeout);
  ctx.fitTimeout = setTimeout(() => {
  ctx.network.redraw();
ctx.network.fit({ animation: true });

  }, 300);
}
}