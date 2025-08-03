// src/filters.js

export function applyFiltersFactory(ctx) {
  return function applyFilters() {
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

    updateNetwork(ctx);

    if (ctx.network) {
      if (ctx.fitTimeout) clearTimeout(ctx.fitTimeout);
      ctx.fitTimeout = setTimeout(() => {
        ctx.network.fit({ animation: true });
      }, 300);
    }
  };
}

function updateNetwork(ctx) {
  ctx.nodes.clear();
  ctx.edges.clear();

  ctx.nodes.add(ctx.filteredNodes.map(n => ({
    ...n,
    shape: 'circularImage',
    borderWidth: 2,
    borderWidthSelected: 6,
    color: { border: '#ef4444' }
  })));

  ctx.edges.add(ctx.filteredEdges.map(e => {
    const color = ctx.edgeColors[e.type] || '#888';
    const width = (e.type === 'devam' || e.type === 'karakter geçişi') ? 3 : 1.5;
    return {
      ...e,
      arrows: 'to',
      color: { color },
      width
    };
  }));
}
