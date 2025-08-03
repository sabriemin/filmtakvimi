import React, { useEffect, useRef } from "react";
import { DataSet, Network } from "vis-network/standalone/esm/vis-network";

function NetworkGraph({ universe, search, timeline, onNodeClick }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const allNodesRef = useRef([]);
  const allEdgesRef = useRef([]);
  const universeMap = useRef({});

  useEffect(() => {
    const container = containerRef.current;
    const nodes = new DataSet([]);
    const edges = new DataSet([]);

    Promise.all([
      "Marvel", "DC", "Pixar", "Star Wars",
      "Avatar: The Last Airbender", "Avatar (Pandora)",
      "Harry Potter", "Middle-earth", "The Matrix"
    ].map(u =>
      fetch(`/data/${u.toLowerCase().replace(/[^a-z]/g, "")}.json`)
        .then(res => res.json())
        .then(data => {
          const n = data.nodes.map(node => ({
            ...node,
            shape: "circularImage",
            image: node.image,
            borderWidth: 2,
            borderWidthSelected: 4,
            color: { border: "#111" },
            universe: u,
            group: u,
            title: node.label
          }));
          const e = data.edges.map(edge => ({
            ...edge,
            arrows: "to",
            color: { color: "#888" }
          }));
          nodes.add(n);
          edges.add(e);
          universeMap.current[u] = n.map(nn => nn.id);
        })
    )).then(() => {
      allNodesRef.current = nodes.get();
      allEdgesRef.current = edges.get();

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

      networkRef.current = new Network(container, data, options);

      networkRef.current.on("click", function (params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodes.get(nodeId);
          onNodeClick(node);
        }
      });
    });

    return () => {
      networkRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    const net = networkRef.current;
    if (!net) return;

    const filtered = allNodesRef.current.filter(n =>
      (universe === "Hepsi" || n.universe === universe) &&
      (!search || n.label?.toLowerCase().includes(search))
    );

    const timelineAdjusted = timeline
      ? filtered.map(n => ({
          ...n,
          x: new Date(n.release_date).getTime() / 10000000 || 0,
          y: 0,
          physics: false,
          fixed: true
        }))
      : filtered;

    net.setData({
      nodes: new DataSet(timelineAdjusted),
      edges: new DataSet(allEdgesRef.current)
    });

    net.fit({ nodes: filtered.map(n => n.id), animation: true });
  }, [universe, search, timeline]);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
}

export default NetworkGraph;