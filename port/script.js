// Ağı oluşturmak için
const container = document.getElementById("network");
const infoBox = document.getElementById("info-box");
const titleEl = document.getElementById("info-title");
const descEl = document.getElementById("info-description");
const refersEl = document.getElementById("info-refers");

let allNodes = [];
let allEdges = [];
let network;

fetch("data/graph_marvel_yillara_gore.json")
  .then((res) => res.json())
  .then((data) => {
    allNodes = new vis.DataSet(
      data.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        image: n.image,
        shape: "circularImage",
        title: n.title,
        description: n.description,
        refers_to: n.refers_to,
        group: n.type,
        level: n.level
      }))
    );

    allEdges = new vis.DataSet(
      data.edges.map((e) => ({
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

    const container = document.getElementById("network");
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
  input.placeholder = "Film/Dizi ara...";
  input.style.position = "absolute";
  input.style.top = "10px";
  input.style.left = "10px";
  input.style.zIndex = "100";
  input.oninput = function () {
    const value = input.value.toLowerCase();
    const match = allNodes.get().find((n) =>
      n.label.toLowerCase().includes(value)
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

  ["Hepsi", "film", "dizi"].forEach((type) => {
    const btn = document.createElement("button");
    btn.textContent = type;
    btn.style.padding = "6px 12px";
    btn.style.backgroundColor = "#222";
    btn.style.color = "#fff";
    btn.style.border = "1px solid #555";
    btn.style.borderRadius = "4px";
    btn.onclick = () => {
      if (type === "Hepsi") {
        allNodes.update(
          allNodes.get().map((n) => ({ ...n, hidden: false }))
        );
      } else {
        allNodes.update(
          allNodes.get().map((n) => ({
            ...n,
            hidden: n.group !== type,
          }))
        );
      }
    };
    container.appendChild(btn);
  });

  document.body.appendChild(container);
}
