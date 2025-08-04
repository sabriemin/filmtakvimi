
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

  // Node'ları gizle/göster
  ctx.allNodes.forEach(node => {
    const visible = (!universe || node.universe === universe) &&
      (!searchTerm || (node.label && node.label.toLowerCase().includes(searchTerm))) &&
      (!maxYear || !node.release_date || new Date(node.release_date).getFullYear() <= maxYear);

    ctx.nodes.update({ id: node.id, hidden: !visible });
  });

  const visibleNodeIds = new Set(ctx.allNodes.filter(n => !ctx.nodes.get(n.id).hidden).map(n => n.id));

  // Edge'leri gizle/göster
  ctx.allEdges.forEach(edge => {
    const visible = visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to) &&
      (!edgeType || edge.type === edgeType);

    ctx.edges.update({ id: edge.id, hidden: !visible });
  });
}
