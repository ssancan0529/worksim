// Validate the whole input before stepping any statement. query_only alone can
// be disabled by a submitted PRAGMA, so configuration statements are forbidden.
export function readOnlyQuery(db, query) {
  const text = String(query).replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/, '');
  if (!/^(SELECT|WITH)\b/i.test(text)) throw new Error('Usa una consulta de lectura SELECT o WITH.');
  let count = 0;
  for (const statement of db.iterateStatements(query)) {
    count++;
    if (count > 1) throw new Error('Ejecuta una sola consulta por vez.');
    if (!statement.getColumnNames().length) throw new Error('La consulta debe devolver una tabla.');
  }
  if (count !== 1) throw new Error('Escribe una consulta de lectura.');
  db.run('PRAGMA query_only = ON');
  return db.exec(query);
}
