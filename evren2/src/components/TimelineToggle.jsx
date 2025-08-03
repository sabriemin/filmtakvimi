import React from "react";

function TimelineToggle({ active, onToggle }) {
  return (
    <button onClick={onToggle}>
      {active ? "🔁 Normal Görünüm" : "📅 Zaman Çizelgesi"}
    </button>
  );
}

export default TimelineToggle;