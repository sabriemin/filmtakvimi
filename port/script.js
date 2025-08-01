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

const backgroundEl = document.createElement("div");
backgroundEl.style.position = "fixed";
backgroundEl.style.top = 0;
backgroundEl.style.left = 0;
backgroundEl.style.width = "100vw";
backgroundEl.style.height = "100vh";
backgroundEl.style.zIndex = "-1";
backgroundEl.style.backgroundSize = "cover";
backgroundEl.style.backgroundPosition = "center";
backgroundEl.style.opacity = "0.1";
backgroundEl.style.filter = "blur(12px)";
document.body.appendChild(backgroundEl);

function updateBackground(universe) {
  if (universe === "Marvel") {
    backgroundEl.style.backgroundImage = "url('images/marvel.jpg')";
  } else if (universe === "DC") {
    backgroundEl.style.backgroundImage = "url('images/dc.jpg')";
  } else {
    backgroundEl.style.backgroundImage = "none";
  }
}

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
      label: `${n.label}\n(${n.release_date?.split('-')[0] || ''})`,
      image: n.image ? n.image.replace(/.*[\\/]/, 'images/') : undefined,
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
  allNodes.forEach(node => {
    network.body.nodes[node.id].options = {
      ...network.body.nodes[node.id].options,
      title: node.description.slice(0, 200) + '...'
    };
  });

  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const node = allNodes.get(params.nodes[0]);
      titleEl.textContent = node.title;
      descEl.innerHTML = `<strong>Film Özeti:</strong><br>${node.description}`;
      refersEl.innerHTML = `<strong>Göndermeler:</strong><br>${node.refers_to}`;
      infoBox.classList.remove("hidden");
    }
  });

  createSearchBox();
  createLegendBox();
  createUniverseTabs();
  showUniverseSelectorModal();
});
