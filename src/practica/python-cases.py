import json


CASES = [
    ("Retiro con saldo suficiente", (100, 40), (201, 60)),
    ("Retiro por el saldo exacto", (80, 80), (201, 0)),
    ("Saldo insuficiente", (60, 80), (409, 60)),
    ("Monto cero", (100, 0), (400, 100)),
    ("Monto negativo", (100, -5), (400, 100)),
]


def ejecutar_pruebas(codigo):
    espacio = {}
    try:
        exec(compile(codigo, "retiros.py", "exec"), espacio)
    except SyntaxError as error:
        return json.dumps({"error": f"Revisa la línea {error.lineno}. {error.msg}"})
    except Exception as error:
        return json.dumps({"error": f"{type(error).__name__}: {error}"[:220]})

    retirar = espacio.get("retirar")
    if not callable(retirar):
        return json.dumps({"error": "Define la función retirar(saldo, monto)."})

    comprobaciones = []
    for titulo, argumentos, esperado in CASES:
        try:
            resultado = retirar(*argumentos)
            tiene_formato = type(resultado) is tuple and len(resultado) == 2 and all(
                type(valor) is int for valor in resultado
            )
            observado = str(resultado)[:180]
            cumple = tiene_formato and resultado == esperado
        except Exception as error:
            observado = f"{type(error).__name__}: {error}"[:180]
            cumple = False
        comprobaciones.append({
            "label": titulo,
            "passed": cumple,
            "evidence": f"retirar{argumentos} · Esperado {esperado} · Obtenido {observado}",
        })
    return json.dumps({"checks": comprobaciones})
