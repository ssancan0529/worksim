import { SCHEMA } from "../data/scenario";

export default function SchemaTable({ rows = SCHEMA }) {
  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th>Campo</th><th>Tipo</th><th>Restricción</th></tr></thead>
        <tbody>
          {rows.map(([field, type, restriction]) => (
            <tr key={field}><td>{field}</td><td>{type}</td><td>{restriction}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
