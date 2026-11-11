(function(){"use strict";var I=""+new URL("sql-wasm-CZHpDDNI.js",self.location.href).href,w=""+new URL("sql-wasm-C1U8OeUW.wasm",self.location.href).href;const b="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";function N(){return importScripts(`${b}pyodide.js`),self.loadPyodide({indexURL:b})}var q=`import json
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
`;const _=`WITH elegidas AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY cuenta_id ORDER BY monto DESC, id DESC
  ) AS fila
  FROM transacciones
  WHERE tipo = 'transferencia' AND ciudad = 'Guayaquil' AND monto >= 100
)
SELECT id, cuenta_id, fecha, monto, sospechosa
FROM elegidas
WHERE fila = 1
ORDER BY sospechosa DESC, monto DESC, id ASC
LIMIT 10 OFFSET 10;`,h=`WITH candidatas AS (
  SELECT id, asunto, equipo, prioridad * 10 + horas_espera AS puntaje
  FROM solicitudes
  WHERE estado = 'abierta' AND prioridad >= 3
), clasificadas AS (
  SELECT *, RANK() OVER (
    PARTITION BY equipo ORDER BY puntaje DESC
  ) AS puesto
  FROM candidatas
)
SELECT id, asunto, equipo, puntaje
FROM clasificadas
WHERE puesto <= 2
ORDER BY puntaje DESC, id ASC;`,O=`def retirar(cuenta_id, monto, solicitud_id):
    cuenta = db.buscar_cuenta(cuenta_id)
    if cuenta is None:
        return 404
    if monto <= 0:
        return 400
    if cuenta["saldo"] < monto:
        return 409
    # Registra el retiro y actualiza el saldo.
    db.registrar_retiro(cuenta_id, monto, solicitud_id)
    cuenta["saldo"] -= monto
    db.guardar_cuenta(cuenta)
    return 201`,y=`SELECT producto, fecha,
       ROW_NUMBER() OVER (
         PARTITION BY producto ORDER BY fecha DESC
       ) AS posicion
FROM entregas;`,v=[{id:"transfers",engine:"sql",company:"Banco Horizonte",short:"Transferencias",title:"Prioriza las transferencias por cuenta",intro:"El equipo de riesgo revisa una transferencia reciente por cuenta. Prepara la segunda página del reporte de Guayaquil.",requirements:["Filtra las <strong>transferencias</strong> de <strong>Guayaquil</strong> por montos de <strong>$100 o más</strong>.","De las filas que cumplen el filtro, conserva la más reciente por <code>cuenta_id</code>. En empate de <code>fecha</code>, conserva la de <strong>ID mayor</strong>.","Ordena por <code>sospechosa</code> de mayor a menor, luego por <code>monto</code> de mayor a menor y al final por <code>id</code> ascendente. Devuelve la <strong>página 2 de 10 filas</strong>.","Entrega <code>id</code>, <code>cuenta_id</code>, <code>fecha</code>, <code>monto</code> y <code>sospechosa</code>, en ese orden."],guide:[["WHERE","Reduce el conjunto a las filas que pueden competir dentro de cada cuenta."],["ROW_NUMBER()","Numera las filas dentro de cada grupo usando un orden explícito."],["WITH · LIMIT · OFFSET","Divide la consulta en pasos. Pagina cuando el orden final ya esté definido."]],example:y,hint:"Define qué significa «primera» en dos niveles. Dentro de una cuenta manda la fecha. En el reporte global mandan las alertas y el monto.",ai:_,reference:_.replace("ORDER BY monto DESC, id DESC","ORDER BY fecha DESC, id DESC"),dataName:"transacciones",columns:["id","cuenta_id","tipo","ciudad","monto","sospechosa","fecha"],output:["id","cuenta_id","fecha","monto","sospechosa"]},{id:"support",engine:"sql",company:"Mesa de soporte",short:"Cola de soporte",title:"Ordena la cola de soporte",intro:"La supervisora necesita una lista que priorice solicitudes urgentes sin saturar a un solo equipo.",requirements:["Incluye solo solicitudes <strong>abiertas</strong> con prioridad <strong>3 o superior</strong>.","Calcula <code>puntaje = prioridad * 10 + horas_espera</code>.","Conserva hasta <strong>dos solicitudes por equipo</strong> con mayor puntaje. En caso de empate, elige el <strong>ID menor</strong>.","Ordena el resultado completo por <code>puntaje</code> descendente e <code>id</code> ascendente. Muestra <code>id</code>, <code>asunto</code>, <code>equipo</code> y <code>puntaje</code>, en ese orden."],guide:[["SELECT · FROM · WHERE","Elige los datos, calcula columnas y filtra las solicitudes elegibles."],["PARTITION BY","Una función de ventana puede reiniciar el conteo al cambiar de equipo."],["ORDER BY","Una columna adicional desempata cuando dos filas tienen el mismo puntaje."]],example:y,hint:"Una numeración por equipo permite limitar la cantidad de filas. Comprueba qué ocurre si tres solicitudes empatan en el segundo puesto.",ai:h,reference:h.replace("RANK()","ROW_NUMBER()").replace("PARTITION BY equipo ORDER BY puntaje DESC","PARTITION BY equipo ORDER BY puntaje DESC, id ASC"),dataName:"solicitudes",columns:["id","asunto","equipo","estado","prioridad","horas_espera"],output:["id","asunto","equipo","puntaje"]},{id:"withdrawal",engine:"python",company:"Banco Horizonte",short:"Retiros",title:"Protege el registro de retiros",intro:"Dos solicitudes pueden usar el mismo saldo. Implementa una función que también resista reintentos y fallos de escritura.",requirements:["Implementa <code>retirar(cuenta_id, monto, solicitud_id)</code>. Devuelve <strong>400</strong> si el monto no es un entero positivo. <code>True</code> y <code>False</code> no cuentan como montos.","Devuelve <strong>404</strong> si la cuenta no existe y <strong>409</strong> si no hay saldo suficiente.","Si la clave de solicitud ya existe en esa cuenta, devuelve <strong>201</strong> cuando el monto coincide, incluso con saldo cero. Devuelve <strong>409</strong> si el monto cambió. En ambos casos, evita un nuevo débito.","Por un retiro nuevo, registra la solicitud, actualiza el saldo y devuelve <strong>201</strong>. Si una escritura falla con <code>RuntimeError</code>, revierte la operación y devuelve <strong>503</strong>."],guide:[["Validación","Comprueba tipos y límites antes de cambiar el estado."],["Idempotencia","Un reintento de la misma solicitud debe devolver el mismo resultado sin repetir el efecto."],["Transacción","Agrupa la lectura y las escrituras. Deja salir el error del bloque para que se revierta la operación."]],example:`try:
    with inventario.transaccion():
        inventario.actualizar_existencias()
except RuntimeError:
    registrar_incidencia()`,hint:"Piensa qué debería pasar cuando la primera solicitud dejó saldo cero y el cliente repite la misma clave.",ai:O,methods:[["db.transaccion()","Úsalo con with. Serializa las operaciones y revierte sus cambios si sale una excepción."],["db.buscar_cuenta(cuenta_id)","Devuelve un dict con id y saldo, o None."],["db.buscar_retiro(cuenta_id, solicitud_id)","Devuelve el monto registrado para esa clave, o None."],["db.registrar_retiro(cuenta_id, monto, solicitud_id)","Registra el movimiento y la clave."],["db.guardar_cuenta(cuenta)","Persiste el saldo actualizado del diccionario."]]}];function x(e){return Array.from({length:28},(o,n)=>{const r=1e3+e*1e3+(n*17+e*3)%28*10,l=200+e*100+n,c=`2026-10-${String(8+(n*5+e*3)%20).padStart(2,"0")}`,s=100+(n*17+e*7)%8*25,p=[[r+1,l,"transferencia","Guayaquil",s+(n%3?75:0),1,"2026-10-02"],[r+2,l,"transferencia","Guayaquil",s,+((n+e)%3!==1),c]];n%4===e&&p.push([r+4,l,"transferencia","Guayaquil",s,1,c]);const d=[["retiro","Guayaquil",700],["transferencia","Quito",700],["transferencia","Guayaquil",99]][(n+e)%3],t=[r+9,l,...d,1,"2026-10-31"];return e?[...p,t]:[t,...p.reverse()]}).reverse().flat()}const R=[[108,"Acceso al portal","Accesos","abierta",5,6],[106,"Restablecer contraseña","Accesos","cerrada",5,18],[102,"Error al descargar reporte","Reportes","abierta",3,9],[104,"Permisos de facturación","Pagos","abierta",2,30],[101,"Inicio de sesión bloqueado","Accesos","abierta",5,6],[107,"Actualizar correo","Reportes","cerrada",3,22],[103,"Pago duplicado","Pagos","abierta",4,15],[105,"Cambiar foto de perfil","Accesos","abierta",1,25],[110,"Error de autenticación","Accesos","abierta",5,12],[112,"Exportar reporte","Reportes","abierta",4,8],[111,"Conciliar depósito","Pagos","abierta",3,25],[114,"Confirmar devolución","Pagos","abierta",5,5],[109,"Informe incompleto","Reportes","abierta",3,18]];function j(e){return e?[...R.map(([o,n,r,l,i,c])=>[320-o,n,r,l,i,c+(r==="Pagos"?8:2)]),[220,"Solicitud de garantía","Garantías","abierta",4,7]]:R}const T=e=>e[2]==="transferencia"&&e[3]==="Guayaquil"&&e[4]>=100,S=(e,o)=>o[5]-e[5]||o[4]-e[4]||e[0]-o[0],B=(e,o)=>o[6].localeCompare(e[6])||o[0]-e[0],A=e=>e[3]==="abierta"&&e[4]>=3,g=e=>e[4]*10+e[5],E=(e,o)=>g(o)-g(e)||e[0]-o[0],P={transfers:{rows:x,schema:"id INTEGER UNIQUE, cuenta_id INTEGER, tipo TEXT, ciudad TEXT, monto INTEGER, sospechosa INTEGER, fecha TEXT"},support:{rows:j,schema:"id INTEGER UNIQUE, asunto TEXT, equipo TEXT, estado TEXT, prioridad INTEGER, horas_espera INTEGER"}};function M(e,o,n,r,l){const i=new e.Database;try{i.run(`CREATE TABLE ${o.dataName} (${l})`);const c=o.columns.map(()=>"?").join(", "),s=i.prepare(`INSERT INTO ${o.dataName} VALUES (${c})`);try{for(const f of r)s.run(f)}finally{s.free()}const p=n.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/,"");if(!/^(SELECT|WITH)\b/i.test(p))throw new Error("Escribe una consulta de lectura con SELECT o WITH.");i.run("PRAGMA query_only = ON");const d=i.iterateStatements(n),t=d.next().value,a=(t==null?void 0:t.getColumnNames())??[];if(!a.length)throw new Error("La consulta debe devolver una tabla.");if(a.length>24)throw new Error("La consulta devolvió más de 24 columnas.");const u=[];for(;t.step();){if(u.length>=250)throw new Error("La consulta devolvió más de 250 filas.");u.push(t.get().map(f=>f instanceof Uint8Array?"[binario]":typeof f=="string"&&f.length>240?f.slice(0,240)+"…":f))}if(!d.next().done)throw new Error("Ejecuta una sola consulta por vez.");return{columns:a,rows:u,error:null}}catch(c){const s=String(c.message||c).slice(0,300);return{columns:[],rows:[],error:s}}finally{i.close()}}function L(e,o,n){const r=n.columns.map(d=>d.toLowerCase()),l=new Map(o.map(d=>[d[0],d])),i=r.map(d=>e.columns.indexOf(d)),c=n.rows.map(d=>d[r.indexOf("id")]??null),s=n.rows.map((d,t)=>{const a=l.get(c[t]);return a&&i.every((u,f)=>u<0||a[u]===d[f])?a:null}),p=e.output.length===r.length&&e.output.every((d,t)=>r[t]===d);return{names:r,ids:c,rows:s,columnsMatch:p,allKnown:s.length>0&&s.every(Boolean)}}function D(e,o){const n=new Set(e);return e.length===o.length&&n.size===o.length&&o.every(r=>n.has(r[0]))}function C(e,o){return e.length>1&&e.every((n,r)=>r===0||o(e[r-1],n)<=0)}function m(e){return e.slice(0,15).map(o=>o??"sin ID").join(", ")||"—"}function U(e,o){const n=new Map;for(const a of e.filter(T).sort(B))n.has(a[1])||n.set(a[1],a);const r=[...n.values()].sort(S).slice(10,20),{columnsMatch:l,rows:i,allKnown:c,ids:s}=o,p=c&&i.every(T),d=i.filter(a=>a&&n.get(a[1])===a).length,t=new Set(i.filter(Boolean).map(a=>a[1]));return[["Columnas del reporte",l,"Comprueba los nombres y el orden de las cinco columnas."],["Transferencias válidas",p,"Cada fila debe ser una transferencia de Guayaquil por al menos $100."],["Última transferencia válida por cuenta",c&&d===i.length&&t.size===i.length,`${d} de ${i.length} filas corresponden a la más reciente de su cuenta.${t.size<i.length?" Revisa las cuentas repetidas.":""}`],["Página 2 completa",c&&D(s,r),`IDs esperados: ${m(r.map(a=>a[0]))}. Obtenidos: ${m(s)}.`],["Orden del reporte y desempates",c&&C(i,S),"Comprueba el orden por sospecha, monto e ID en las filas devueltas."]]}function F(e,o,n){const r=new Map;for(const a of e.filter(A).sort(E)){const u=r.get(a[2])??[];u.length<2&&u.push(a),r.set(a[2],u)}const l=[...r.values()].flat().sort(E),{names:i,columnsMatch:c,rows:s,allKnown:p,ids:d}=o,t=i.indexOf("puntaje");return[["Columnas solicitadas",c,"Comprueba el orden y el nombre de las cuatro columnas."],["Solo solicitudes elegibles",p&&s.every(A),"Cada fila debe estar abierta y tener prioridad de 3 o más."],["Puntaje calculado",p&&t>=0&&s.every((a,u)=>n.rows[u][t]===g(a)),"El puntaje debe combinar prioridad y horas de espera según la fórmula."],["Hasta dos por equipo con desempate",p&&D(d,l),`IDs esperados: ${m(l.map(a=>a[0]))}. Obtenidos: ${m(d)}.`],["Orden global por puntaje e ID",p&&C(s,E),"En puntajes iguales, el ID menor debe aparecer primero."]]}function G(e,o,n){var d;const r=v.find(t=>t.id===o),{rows:l,schema:i}=P[o],c=[0,1].map(t=>{const a=l(t),u=M(e,r,n,a,i),f=L(r,a,u),$=o==="transfers"?U(a,f):F(a,f,u);return{...u,checks:$}}),s=c[0].checks.map(([t],a)=>({label:t,passed:c.every(u=>!u.error&&u.checks[a][1]),evidence:c.map((u,f)=>`Datos ${f+1}: ${u.error||u.checks[a][2]}`)})),p=c[0];return{checks:s,passed:s.filter(t=>t.passed).length,total:s.length,columns:p.columns,rows:p.rows.slice(0,25),rowCount:p.rows.length,error:((d=c.find(t=>t.error))==null?void 0:d.error)??null}}self.onmessage=async({data:e})=>{try{const o=v.find(l=>l.id===e.id);let n;if(o.engine==="sql"){importScripts(I);const l=await self.initSqlJs({locateFile:()=>w});n=i=>G(l,o.id,i)}else{const l=await N();l.setStdout({batched:()=>{}}),l.setStderr({batched:()=>{}}),l.runPython(q);const i=l.globals.get("ejecutar_pruebas");n=c=>{const s=JSON.parse(i(c));return s.error?s:{...s,passed:s.checks.filter(p=>p.passed).length,total:s.checks.length}}}self.postMessage({phase:"ready"});const r=n(e.code);self.postMessage({user:r,ai:e.compare?n(o.ai):null})}catch(o){self.postMessage({error:String(o.message||o).slice(0,300)})}}})();
