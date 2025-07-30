async function loadEvents() {
  const today = new Date();
  const monthDay = ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);

  try {
    const response = await fetch("evren_veri.json");
    const data = await response.json();

    const matches = data.filter(e => e.date === monthDay);
    const container = document.getElementById("today-events");
    container.innerHTML = "";

    if (matches.length === 0) {
      container.innerHTML = "<p>Bugün film evrenlerinde önemli bir olay yok gibi görünüyor.</p>";
    } else {
      matches.forEach(event => {
        const p = document.createElement("p");
        p.textContent = event.title;
        container.appendChild(p);
      });
    }
  } catch (err) {
    console.error("Veri yüklenemedi:", err);
    document.getElementById("today-events").innerHTML = "<p>Veri alınamadı.</p>";
  }
}

loadEvents();
