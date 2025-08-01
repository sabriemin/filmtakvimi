// Ağı oluşturmak için
const container = document.getElementById("network");
const infoBox = document.getElementById("info-box");
const titleEl = document.getElementById("info-title");
const descEl = document.getElementById("info-description");
const refersEl = document.getElementById("info-refers");

fetch("data/graph_marvel_yillara_gore.json")
  .then((res) => res.json())
  .then((data) => {
    const nodes = new vis.DataSet(
      data.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        image: n.image,
        shape: "image",
        title: n.title,
        description: n.description,
        refers_to: n.refers_to,
      }))
    );

    const edges = new vis.DataSet(
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

    const network = new vis.Network(container, { nodes, edges }, {
      nodes: {
        shape: "image",
        size: 30,
        font: { color: "#fff" },
        borderWidth: 0,
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
      },
    });

    network.on("click", function (params) {
      if (params.nodes.length > 0) {
        const node = nodes.get(params.nodes[0]);
        titleEl.textContent = node.title;
        descEl.textContent = node.description;
        refersEl.textContent = node.refers_to;
        infoBox.classList.remove("hidden");
      }
    });
  });

function closeInfoBox() {
  document.getElementById("info-box").classList.add("hidden");
}
