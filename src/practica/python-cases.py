import json
from contextlib import contextmanager


class BancoDePrueba:
    def __init__(self, saldos, fallo=None):
        self._saldos = saldos.copy()
        self._retiros = []
        self._en_transaccion = False
        self._siguiente = None
        self._fallo = fallo

    def _intercalar(self):
        if self._siguiente is not None and not self._en_transaccion:
            llamada = self._siguiente
            self._siguiente = None
            llamada()

    def _interrumpir(self, operacion):
        if self._fallo == operacion:
            self._fallo = None
            raise RuntimeError("Escritura interrumpida en la base de prueba")

    @contextmanager
    def transaccion(self):
        if self._en_transaccion:
            raise RuntimeError("Ya existe una transacción activa")
        saldos = self._saldos.copy()
        retiros = self._retiros.copy()
        self._en_transaccion = True
        try:
            yield
        except BaseException:
            self._saldos = saldos
            self._retiros = retiros
            raise
        finally:
            self._en_transaccion = False
            self._intercalar()

    def buscar_cuenta(self, cuenta_id):
        saldo = self._saldos.get(cuenta_id)
        self._intercalar()
        return None if saldo is None else {"id": cuenta_id, "saldo": saldo}

    def buscar_retiro(self, cuenta_id, solicitud_id):
        monto = next(
            (importe for cuenta, importe, clave in self._retiros if (cuenta, clave) == (cuenta_id, solicitud_id)),
            None,
        )
        self._intercalar()
        return monto

    def registrar_retiro(self, cuenta_id, monto, solicitud_id):
        self._retiros.append([cuenta_id, monto, solicitud_id])
        self._interrumpir("registro")

    def guardar_cuenta(self, cuenta):
        self._saldos[cuenta["id"]] = cuenta["saldo"]
        self._interrumpir("saldo")

    def evidencia(self, codigos):
        return {"codes": codigos, "withdrawals": self._retiros, "balances": self._saldos}


def ejecutar_pruebas(codigo):
    try:
        programa = compile(codigo, "retiros.py", "exec")
    except SyntaxError as error:
        return json.dumps({"error": f"Línea {error.lineno}: {error.msg}"})

    casos = []

    def probar(titulo, saldos, solicitudes, esperado, retiros, saldos_finales, *, intercalado=False, fallo=None):
        banco = BancoDePrueba(saldos, fallo)
        entorno = {"db": banco}
        codigos = []
        try:
            exec(programa, entorno)
            retirar = entorno["retirar"]
        except Exception as error:
            codigos.append("Falta la función retirar" if isinstance(error, KeyError) else f"{type(error).__name__}: {error}")
        else:
            def invocar(solicitud):
                try:
                    codigo = retirar(*solicitud)
                    codigos.append(codigo if type(codigo) is int else "La función debe devolver un entero")
                except Exception as error:
                    codigos.append(f"{type(error).__name__}: {error}"[:180])

            if intercalado:
                banco._siguiente = lambda: invocar(solicitudes[1])
                invocar(solicitudes[0])
                codigos.sort(key=str)
            else:
                for solicitud in solicitudes:
                    invocar(solicitud)
        esperado = {"codes": esperado, "withdrawals": retiros, "balances": saldos_finales}
        observado = banco.evidencia(codigos)
        casos.append({"label": titulo, "passed": esperado == observado, "expected": esperado, "observed": observado})

    probar("Cuenta inexistente", {}, [(1, 80, "A")], [404], [], {})
    probar("Montos inválidos, incluido un booleano", {1: 100},
           [(1, valor, "A") for valor in (0, -1, True, 2.5)], [400] * 4, [], {1: 100})
    probar("Retiro por el saldo exacto", {1: 100}, [(1, 100, "A")], [201], [[1, 100, "A"]], {1: 0})
    probar("Saldo insuficiente", {1: 100}, [(1, 120, "A")], [409], [], {1: 100})
    probar("Reintento idéntico con saldo cero", {1: 80}, [(1, 80, "A"), (1, 80, "A")],
           [201, 201], [[1, 80, "A"]], {1: 0})
    probar("Conflicto de clave y alcance por cuenta", {1: 100, 2: 100},
           [(1, 25, "A"), (1, 30, "A"), (2, 30, "A")], [201, 409, 201],
           [[1, 25, "A"], [2, 30, "A"]], {1: 75, 2: 70})
    probar("Dos retiros distintos intercalados", {1: 100}, [(1, 80, "A"), (1, 80, "B")],
           [201, 409], [[1, 80, "A"]], {1: 20}, intercalado=True)
    probar("Dos solicitudes idénticas intercaladas", {1: 100}, [(1, 80, "A"), (1, 80, "A")],
           [201, 201], [[1, 80, "A"]], {1: 20}, intercalado=True)
    probar("Reversión si falla la actualización del saldo", {1: 100}, [(1, 80, "A")],
           [503], [], {1: 100}, fallo="saldo")
    probar("Reversión si falla el registro del retiro", {1: 100}, [(1, 80, "A")],
           [503], [], {1: 100}, fallo="registro")
    return json.dumps({"checks": casos}, default=str)
