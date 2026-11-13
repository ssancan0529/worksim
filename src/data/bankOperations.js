export const BANK_OPERATION_REQUIREMENTS = [
  "Filtra por tipo y estado cuando se indiquen. Combina ambos filtros si se solicitan juntos.",
  "Ordena por fecha descendente e ID ascendente en los empates antes de paginar.",
  "Devuelve una lista vacía si no hay coincidencias o el límite es cero.",
  "Rechaza límites o desplazamientos negativos, no enteros o booleanos con ValueError.",
];

export const BANK_OPERATION_PROPOSAL = `def list_operations(kind=None, status=None, limit=10, offset=0):
    query = db.query(Operation)
    if kind:
        query = query.filter_by(kind=kind)
    page = query.offset(offset).limit(limit).all()
    return sorted(page, key=lambda row: row.date, reverse=True)`;
