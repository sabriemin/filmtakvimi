export function setupNetwork(ctx) {
  const container = document.getElementById('network');

  ctx.nodes = new vis.DataSet();
  ctx.edges = new vis.DataSet();

  const data = {
    nodes: ctx.nodes,
    edges: ctx.edges
  };

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

  const network = new vis.Network(container, data, options);
  network.once('stabilizationIterationsDone', function () {
    network.setOptions({ physics: false });
  });


  network.on('click', params => {
    if(params.nodes.length > 0){
      const node = ctx.nodes.get(params.nodes[0]);
      ctx.modalNode = node;
      ctx.modalOpen = true;
    }
  });

  ctx.updateNetwork = function() {
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
      let color = ctx.edgeColors[e.type] || '#888';
      let width = (e.type === 'devam' || e.type === 'karakter geçişi') ? 3 : 1.5;
      return {
        ...e,
        arrows: 'to',
        color: { color },
        width
      };
    }));
  };

  return network;
}