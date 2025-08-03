
export function getNetworkOptions() {
  return {
    nodes: {
      shape: "dot",
      size: 25,
      font: { color: "#fff", size: 14 }
    },
    edges: {
      arrows: "to",
      color: "#888"
    },
    layout: { improvedLayout: true },
    physics: { stabilization: true }
  };
}

export function setupNodeClickEvents(network, allNodes, showInfo, showComparison, selectedNodes) {
  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const node = allNodes.get(nodeId);
      if (!node) return;

      if (selectedNodes.length === 0) {
        selectedNodes.push(node);
        showInfo(node);
      } else if (selectedNodes.length === 1 && selectedNodes[0].id !== node.id) {
        selectedNodes.push(node);
        showComparison(selectedNodes[0], selectedNodes[1]);
        selectedNodes = [];
      } else {
        selectedNodes = [node];
        showInfo(node);
      }
    }
  });
}
