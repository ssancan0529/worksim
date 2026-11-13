import copy
import json

source = str(_inventory_source)
results = []
for case in json.loads(_inventory_cases):
    try:
        namespace = {}
        exec(source, namespace)
        value = namespace["registrar_movimiento"](
            copy.deepcopy(case["ledger"]), case["id"], case["cents"], case["kind"]
        )
        if not isinstance(value, dict) or type(value.get("accepted")) is not bool or type(value.get("ledger")) is not list:
            raise ValueError("Devuelve accepted booleano y ledger como lista.")
        for row in value["ledger"]:
            if (type(row) is not dict or set(row) != {"id", "cents", "kind"}
                    or type(row["id"]) is not str or type(row["cents"]) is not int or type(row["kind"]) is not str):
                raise ValueError("Cada registro requiere id y kind de texto, y cents entero.")
        results.append({"result": value})
    except (Exception, SystemExit) as error:
        results.append({"error": str(error)[:240]})
json.dumps(results)
