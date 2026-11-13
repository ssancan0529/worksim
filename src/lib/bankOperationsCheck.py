import json

CASES = [
    ("types", "Filtra por tipo", {"kind": "retiro", "limit": 30}),
    ("combined", "Combina tipo y estado", {"kind": "transferencia", "status": "pendiente", "limit": 30}),
    ("status", "Filtra solo por estado", {"status": "confirmada", "limit": 30}),
    ("order", "Ordena por fecha y resuelve empates por ID", {"limit": 30}),
    ("page-one", "Devuelve la primera página ordenada", {"kind": "transferencia", "limit": 4}),
    ("page-two", "Devuelve la siguiente página sin perder registros", {"kind": "transferencia", "limit": 4, "offset": 4}),
    ("empty", "Devuelve lista vacía sin coincidencias", {"kind": "sin coincidencias"}),
    ("zero", "Respeta el límite cero", {"limit": 0}),
    ("invalid-limit", "Rechaza un límite negativo", {"limit": -1}),
    ("invalid-offset", "Rechaza un desplazamiento no entero", {"offset": "2"}),
    ("invalid-bool", "Rechaza booleanos como parámetros de paginación", {"limit": True}),
]


def call_operations(compiled, args):
    db, engine = open_operations_database()
    try:
        scope = {"db": db, "Operation": Operation}
        try:
            exec(compiled, scope)
        except (Exception, SystemExit) as error:
            return {"error": f"{type(error).__name__}: {error}"[:240]}
        function = scope.get("list_operations")
        if not callable(function):
            return {"error": "Define list_operations(kind=None, status=None, limit=10, offset=0)."}
        try:
            result = function(**args)
            if not isinstance(result, list) or len(result) > len(OPERATIONS):
                return {"caseError": "Se esperaba una lista de operaciones de la muestra."}
            rows = []
            for item in result:
                row = {key: getattr(item, key) for key in OPERATIONS[0]} if isinstance(item, Operation) else item
                if not isinstance(row, dict) or any(
                    type(row.get(key)) is not type(value) for key, value in OPERATIONS[0].items()
                ):
                    return {"caseError": "Cada operación necesita id, kind, status, date y cents."}
                rows.append({key: row[key] for key in OPERATIONS[0]})
            return {"result": rows}
        except (Exception, SystemExit) as error:
            return {"caseError": f"{type(error).__name__}: {error}"[:240], "valueError": isinstance(error, ValueError)}
    finally:
        db.close()
        engine.dispose()


def expected_operations(kind=None, status=None, limit=10, offset=0):
    rows = [row for row in OPERATIONS if (not kind or row["kind"] == kind)
            and (not status or row["status"] == status)]
    rows.sort(key=lambda row: row["id"])
    rows.sort(key=lambda row: row["date"], reverse=True)
    return rows[offset:offset + limit]


def check_operations(source, args):
    try:
        compiled = compile(source, "operaciones.py", "exec")
    except SyntaxError as error:
        return {"error": f"Línea {error.lineno}: {error.msg}"}
    preview = call_operations(compiled, args)
    if preview.get("error"):
        return preview
    checks = []
    for case_id, name, params in CASES:
        output = call_operations(compiled, params)
        error = output.get("error") or output.get("caseError")
        if case_id.startswith("invalid-"):
            passed = output.get("valueError") is True
            evidence = "Se esperaba ValueError. Resultado: " + (error or "la función devolvió una lista.")
        elif error:
            passed, evidence = False, error
        else:
            observed = output["result"]
            expected = expected_operations(**params)
            if case_id in {"types", "combined", "status"}:
                passed = sorted(observed, key=lambda row: row["id"]) == sorted(expected, key=lambda row: row["id"])
            else:
                passed = observed == expected
            observed_ids = [row["id"] for row in observed]
            expected_ids = [row["id"] for row in expected]
            evidence = f"IDs esperados: {expected_ids}. IDs devueltos: {observed_ids}."
            if not passed and observed_ids == expected_ids:
                evidence += " Revisa los valores de las operaciones devueltas."
        checks.append({"id": case_id, "name": name, "passed": passed, "detail": f"{params} · {evidence}"})
    return {**preview, "checks": checks}


json.dumps(check_operations(_worksim_source, json.loads(_worksim_parameters)))
