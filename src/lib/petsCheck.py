import json

CASES = [
    ("adoption", "Excluye mascotas adoptadas", {"limit": 50}),
    ("species", "Filtra por especie", {"species": "cat", "limit": 50}),
    ("city", "Combina especie y ciudad", {"species": "dog", "city": "Quito", "limit": 50}),
    ("ordering", "Ordena por urgencia de mayor a menor", {"limit": 50}),
    ("stable-order", "Resuelve empates por ID ascendente", {"limit": 50}),
    ("pagination", "Ordena antes de paginar", {"species": "dog", "city": "Guayaquil", "limit": 4, "offset": 3}),
    ("empty", "Devuelve una lista vacía cuando no hay coincidencias", {"city": "Sin coincidencias"}),
    ("zero-limit", "Respeta un límite de cero", {"limit": 0}),
]


def format_error(error):
    if isinstance(error, SyntaxError):
        return f"Línea {error.lineno}: {error.msg}"
    return f"{type(error).__name__}: {error}"[:240]


def call_pets(compiled, args):
    db, engine = open_pets_database()
    try:
        scope = {"db": db, "Pet": Pet}
        try:
            exec(compiled, scope)
        except (Exception, SystemExit) as error:
            return {"error": format_error(error)}
        function = scope.get("list_pets")
        if not callable(function):
            return {"error": "Define list_pets(species=None, city=None, limit=10, offset=0)."}
        try:
            result = function(**args)
            if not isinstance(result, list):
                return {"caseError": f"Se esperaba una lista. Se recibió {type(result).__name__}."}
            if len(result) > 50:
                return {"caseError": "La lista supera las 50 mascotas del conjunto de datos."}
            rows = []
            for pet in result:
                row = {key: getattr(pet, key) for key in PETS[0]} if isinstance(pet, Pet) else pet
                if not isinstance(row, dict) or any(
                    type(row.get(key)) is not type(value) for key, value in PETS[0].items()
                ):
                    return {"caseError": "Cada elemento debe ser una mascota con id, species, city, urgency_level e is_adopted."}
                rows.append({key: row[key] for key in PETS[0]})
            return {"result": rows}
        except (Exception, SystemExit) as error:
            return {"caseError": format_error(error)}
    finally:
        db.close()
        engine.dispose()


def expected_pets(species=None, city=None, limit=10, offset=0):
    filtered = [
        row for row in PETS if not row["is_adopted"]
        and (not species or row["species"] == species)
        and (not city or row["city"] == city)
    ]
    return sorted(filtered, key=lambda row: (-row["urgency_level"], row["id"]))[offset:offset + limit]


def evaluate_case(case, response):
    case_id, title, args = case
    expected = expected_pets(**args)
    rows = response.get("result", [])
    expected_ids = [row["id"] for row in expected]
    ids = [row["id"] for row in rows]
    evidence = response.get("error") or response.get("caseError")
    passed = False
    if not evidence:
        if case_id in {"adoption", "species", "city"}:
            passed = len(rows) == len(expected) and {row["id"]: row for row in rows} == {
                row["id"]: row for row in expected
            }
            missing = [pet_id for pet_id in expected_ids if pet_id not in ids]
            extra = [pet_id for pet_id in ids if pet_id not in expected_ids]
            evidence = f"Se esperaban {len(expected)} mascotas y se obtuvieron {len(rows)}."
            if missing:
                evidence += f" IDs faltantes: {missing}."
            if extra:
                evidence += f" IDs fuera del filtro: {extra}."
            if len(ids) != len(set(ids)):
                evidence += " Hay IDs repetidos."
            if not passed and not missing and not extra and len(ids) == len(set(ids)):
                evidence += " Hay datos que no coinciden con la muestra."
        elif case_id == "ordering":
            passed = len(rows) > 1 and all(
                first["urgency_level"] >= second["urgency_level"] for first, second in zip(rows, rows[1:])
            )
            evidence = "Urgencias obtenidas: " + str([row["urgency_level"] for row in rows])
        elif case_id == "stable-order":
            ties = [(first, second) for first, second in zip(rows, rows[1:])
                    if first["urgency_level"] == second["urgency_level"]]
            passed = bool(ties) and all(first["id"] < second["id"] for first, second in ties)
            evidence = (
                "IDs en empates: " + str([(first["id"], second["id"]) for first, second in ties])
                if ties else "Devuelve filas con la misma urgencia para comprobar el desempate."
            )
        else:
            passed = rows == expected
            evidence = f"IDs esperados: {expected_ids}. IDs obtenidos: {ids}."
            if ids == expected_ids and not passed:
                evidence += " Hay datos que no coinciden con la muestra."
    inputs = ", ".join(f"{key}={value!r}" for key, value in args.items())
    return {"id": case_id, "name": title, "passed": passed, "detail": f"list_pets({inputs}) · {evidence}"}


def check_pets(source, args):
    try:
        compiled = compile(source, "pets_controller.py", "exec")
    except (Exception, SystemExit) as error:
        return {"error": format_error(error)}
    preview = call_pets(compiled, args)
    if preview.get("error"):
        return preview
    return {
        **preview,
        "checks": [evaluate_case(case, call_pets(compiled, case[2])) for case in CASES],
    }


json.dumps(check_pets(_worksim_source, json.loads(_worksim_parameters)))
