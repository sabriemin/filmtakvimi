import React from "react";

function FilterControls({ universes, selected, onChange, onSearch }) {
  return (
    <div className="controls">
      <select value={selected} onChange={e => onChange(e.target.value)}>
        <option value="Hepsi">Hepsi</option>
        {universes.map(u => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
      <input type="text" placeholder="Ara..." onChange={e => onSearch(e.target.value)} />
    </div>
  );
}

export default FilterControls;