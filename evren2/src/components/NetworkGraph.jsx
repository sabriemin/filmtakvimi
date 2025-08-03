import React, { useEffect, useRef } from "react";
import { DataSet, Network } from "vis-network/standalone/esm/vis-network";

function NetworkGraph() {
  const containerRef = useRef(null);

  useEffect(() => {
    const nodes = new DataSet([]);
    const edges = new DataSet([]);
    const data = { nodes, edges };
    const options = {
      nodes: {
        shape: "dot",
        size: 25,
        font: { color: "#fff", size: 14 },
      },
      edges: {
        arrows: "to",
        color: "#888",
      },
      layout: { improvedLayout: true },
      physics: { stabilization: true },
    };
    const network = new Network(containerRef.current, data, options);

    // Load data dynamically in later steps

    return () => {
      network.destroy();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
}

export default NetworkGraph;