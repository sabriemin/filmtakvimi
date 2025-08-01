// Ağı oluşturmak için
const container = document.getElementById("network");
const infoBox = document.getElementById("info-box");
const titleEl = document.getElementById("info-title");
const descEl = document.getElementById("info-description");
const refersEl = document.getElementById("info-refers");

let allNodes = [];
let allEdges = [];
let network;
let currentUniverse = "Hepsi";

Promise.all([
  fetch("data/graph_marvel_yillara_gore.json").then(res => res.json()),
  fetch("data/graph_dc_yillara_gore.json").then(res => res.json())
]).then(([marvelData, dcData]) => {
  const addUniverseTag = (data, universe) => {
    return data.nodes.map(n => ({ ...n, universe }))
  };

  const combinedNodes = [
    ...addUniverseTag(marvelData, "Marvel"),
    ...addUniverseTag(dcData, "DC")
  ];

  const combinedEdges = [
    ...marvelData.edges,
    ...dcData.edges
  ];

  allNodes = new vis.DataSet(
    combinedNodes.map((n) => ({
      id: n.id,
      label: n.label,
      image: n.image,
      shape: "circularImage",
      title: n.title,
      description: n.description,
      refers_to: n.refers_to,
      group: n.type,
      level: n.level,
      universe: n.universe
    }))
  );

  allEdges = new vis.DataSet(
    combinedEdges.map((e) => ({
      from: e.from,
      to: e.to,
      color: {
        color:
          e.type === "devam"
            ? "#ffffff"
            : e.type === "evren-geçişi"
            ? "#00ffff"
            : "#ff9900",
      },
      arrows: "to",
    }))
  );

  const dataSet = {
    nodes: allNodes,
    edges: allEdges,
  };

  const options = {
    nodes: {
      shape: "circularImage",
      size: 40,
      font: { color: "#fff" },
      borderWidth: 1,
    },
    edges: {
      width: 2,
      smooth: {
        type: "cubicBezier",
        forceDirection: "horizontal",
        roundness: 0.4,
      },
    },
    layout: {
      hierarchical: {
        enabled: true,
        direction: "UD",
        sortMethod: "directed",
        levelSeparation: 150,
        nodeSpacing: 100,
      },
    },
    physics: false,
    interaction: {
      hover: true,
      tooltipDelay: 100,
      dragNodes: true,
    },
    groups: {
      film: {
        color: { background: "#ff4444" },
      },
      dizi: {
        color: { background: "#4488ff" },
      },
    },
  };

  network = new vis.Network(container, dataSet, options);

  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const node = allNodes.get(params.nodes[0]);
      titleEl.textContent = node.title;
      descEl.textContent = node.description;
      refersEl.textContent = node.refers_to;
      infoBox.classList.remove("hidden");
    }
  });

  createSearchBox();
  createUniverseTabs();
});

function closeInfoBox() {
  document.getElementById("info-box").classList.add("hidden");
}

function createSearchBox() {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "🔎 Film veya dizi ara...";
  input.style.position = "absolute";
  input.style.top = "10px";
  input.style.left = "10px";
  input.style.zIndex = "100";
  input.style.padding = "8px 16px";
  input.style.borderRadius = "25px";
  input.style.border = "1px solid #ccc";
  input.style.outline = "none";
  input.style.background = "#111";
  input.style.color = "white";
  input.style.fontSize = "14px";
  input.style.boxShadow = "0 0 6px rgba(255, 255, 255, 0.2)";

  input.oninput = function () {
    const value = input.value.toLowerCase();
    const match = allNodes.get().find(
      (n) => n.label.toLowerCase().includes(value) &&
             (currentUniverse === "Hepsi" || n.universe === currentUniverse)
    );
    if (match) {
      network.focus(match.id, { scale: 1.5, animation: true });
    }
  };
  document.body.appendChild(input);
}

function createUniverseTabs() {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.right = "10px";
  container.style.zIndex = "100";
  container.style.display = "flex";
  container.style.gap = "6px";

  ["Hepsi", "Marvel", "DC"].forEach((universe) => {
    const btn = document.createElement("button");
    btn.textContent = universe;
    btn.style.padding = "6px 12px";
    btn.style.backgroundColor = "#222";
    btn.style.color = "#fff";
    btn.style.border = "1px solid #555";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";
    btn.onclick = () => {
      currentUniverse = universe;
      allNodes.update(
        allNodes.get().map((n) => ({
          ...n,
          hidden: universe === "Hepsi" ? false : n.universe !== universe,
        }))
      );
    };
    container.appendChild(btn);
  });

  document.body.appendChild(container);
}
