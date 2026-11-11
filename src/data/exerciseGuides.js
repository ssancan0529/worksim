export const reviewGuide = {
  items: [
    ["Compara", "Busca en las notas el fragmento que habla de la misma persona, fecha o decisión."],
    ["Clasifica", "Decide si la fuente confirma la afirmación, la contradice o deja la información sin confirmar."],
    ["Justifica", "Anota el fragmento concreto que respalda tu decisión."],
  ],
  example: "Si las notas dicen «la fecha sigue pendiente», un resumen que anuncie una fecha confirmada contradice la fuente.",
};

export const endpointGuide = {
  items: [
    ["Filtros", "Piensa qué mascotas deberían aparecer cuando el usuario elige ciudad y especie juntas."],
    ["Orden", "Compara una mascota urgente con otra que tenga menor prioridad."],
    ["Paginación", "Revisa qué ocurre si una mascota que debería aparecer primero está más adelante en los datos."],
  ],
  example: "Para revisar un catálogo de libros, prepara un caso que combine un filtro por autor y otro por género.",
};

export const queryGuide = {
  items: [
    ["SELECT · FROM", "Lee qué columnas devuelve la consulta y cuál es su tabla de origen."],
    ["WHERE", "Revisa cada condición con los datos de una fila."],
    ["ORDER BY", "Después de filtrar, aplica el orden indicado."],
  ],
  example: `SELECT titulo
FROM libros
WHERE categoria = 'ciencia'
ORDER BY titulo;`,
  exampleIsCode: true,
};
