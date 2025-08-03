import React from "react";

function InfoModal({ node, onClose }) {
  if (!node) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{node.label}</h2>
        <div style={{ fontSize: "14px", color: "gray" }}>
          {node.type === "dizi" ? "📺 Dizi" : "🎬 Film"} &nbsp;
          {node.release_date ? "🗓️ " + node.release_date : ""}
        </div>
        <p><b>🎞️ Özeti:</b><br />{node.description || "Açıklama yok."}</p>
        <p><b>📌 Gönderme:</b><br />{node.refers_to || "Yok."}</p>
        <button onClick={onClose}>Kapat</button>
      </div>
    </div>
  );
}

export default InfoModal;