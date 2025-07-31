let timeline;
let itemPositions = {};

fetch("timeline_marvel_baglantili_tipli.json")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("timeline");
    const canvas = document.getElementById("link-canvas");
    const ctx = canvas.getContext("2d");

    const items = new vis.DataSet(data);
    timeline = new vis.Timeline(container, items, {
      stack: false,
      horizontalScroll: true,
      zoomKey: "ctrlKey",
      tooltip: { followMouse: true },
      margin: { item: 20 },
      orientation: "top"
    });

    function resizeCanvas() {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    function drawConnections() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      itemPositions = {};
      const groups = document.querySelectorAll(".vis-item");

      groups.forEach(el => {
        const id = el.getAttribute("data-id");
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - containerRect.left;
        const y = rect.top + rect.height / 2 - containerRect.top;
        itemPositions[id] = { x, y };
      });

      data.forEach(item => {
        if (item.linked_to_ids) {
          item.linked_to_ids.forEach((toId, index) => {
            const from = itemPositions[item.id];
            const to = itemPositions[toId];
            const type = item.link_types?.[index] || "devam";

            if (from && to) {
              ctx.beginPath();
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(to.x, to.y);

              // Türe göre stil
              switch (type) {
                case "devam":
                  ctx.strokeStyle = "#ffffff";
                  ctx.setLineDash([]);
                  ctx.lineWidth = 2;
                  break;
                case "yan-hikaye":
                  ctx.strokeStyle = "#44ccff";
                  ctx.setLineDash([4, 4]);
                  ctx.lineWidth = 2;
                  break;
                case "evren-geçişi":
                  ctx.strokeStyle = "#cc66ff";
                  ctx.setLineDash([2, 6]);
                  ctx.lineWidth = 2;
                  break;
                default:
                  ctx.strokeStyle = "#888";
                  ctx.setLineDash([]);
              }

              ctx.stroke();
            }
          });
        }
      });
    }

    resizeCanvas();
    setTimeout(drawConnections, 1000);
    window.addEventListener("resize", () => {
      resizeCanvas();
      setTimeout(drawConnections, 500);
    });
    timeline.on("changed", () => {
      setTimeout(drawConnections, 500);
    });
  });