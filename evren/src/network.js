// src/network.js

export function setupNetwork(ctx) {
  ctx.nodes = new vis.DataSet();
  ctx.edges = new vis.DataSet();

  const container = document.getElementById('network');
  const data = { nodes: ctx.nodes, edges: ctx.edges };
  const options = {
    nodes: {
      size: 25,
      font: { color: '#fff', size: 14 },
      borderWidthSelected: 6,
      color: { border: '#ef4444' }
    },
    edges: {
      arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      smooth: {
        enabled: true,
        type: 'dynamic'
      }
    },
    interaction: { hover: true, tooltipDelay: 200 },
    physics: {
      stabilization: true,
      barnesHut: { gravitationalConstant: -4000 }
    },
    layout: { improvedLayout: true }
  };

  ctx.network = new vis.Network(container, data, options);

  ctx.network.on('click', params => {
    if (params.nodes.length > 0) {
      const node = ctx.nodes.get(params.nodes[0]);
      ctx.modalNode = node;
      ctx.modalOpen = true;
    }
  });
}
