import { useState } from "react";
import Icon from "./Icon";

export default function ExerciseTable({ columns, rows, caption, collapsible = false }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="exercise-table" role="region" aria-label={caption}>
      {collapsible && (
        <div className="exercise-table-toolbar">
          <span>{caption}</span>
          <button type="button" className="exercise-table-caption-toggle"
            aria-label={`${collapsed ? "Mostrar" : "Ocultar"} filas de ${caption}`}
            aria-expanded={!collapsed} onClick={() => setCollapsed(current => !current)}>
            <Icon name={collapsed ? "chevron-down" : "chevron-up"} size={16} />
          </button>
        </div>
      )}
      <div className="table-scroll exercise-table-scroll" tabIndex={0}>
        <table>
          {!collapsible && <caption>{caption}</caption>}
          <thead><tr>{columns.map((column, index) => <th scope="col" key={index}>{column}</th>)}</tr></thead>
          <tbody hidden={collapsible && collapsed}>{rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell === null ? "NULL" : String(cell)}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
