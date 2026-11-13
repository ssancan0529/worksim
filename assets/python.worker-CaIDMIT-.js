(function(){"use strict";var y=`from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


class Operation(Base):
    __tablename__ = "operaciones"
    id = Column(Integer, primary_key=True)
    kind = Column(String)
    status = Column(String)
    date = Column(String)
    cents = Column(Integer)


OPERATIONS = [
    dict(id=i, kind="retiro" if i % 3 == 0 else "transferencia",
         status="pendiente" if i % 4 == 0 else "confirmada",
         date=f"2026-10-{(i * 7) % 13 + 1:02d}", cents=2500 + i * 100)
    for i in range(1, 31)
]


def open_operations_database():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    db.add_all([Operation(**row) for row in OPERATIONS])
    db.commit()
    return db, engine
`,_=`import json

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
`,k=`import copy
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
`;const x=[{id:"diagnostico-de-ventas",area:"data",difficulty:"Intermedio",duration:"4–6 h",tags:["SQL","Análisis de datos","Informes"],title:"Diagnóstico de ventas",description:"Analiza las ventas de una tienda y recomienda qué productos conviene revisar.",brief:"La tienda necesita explicar cómo cambiaron sus ventas en el trimestre. Prepara un análisis que el equipo comercial pueda verificar y usar para decidir.",deliverables:[{name:"Consultas SQL",path:"sql/ventas.sql"},{name:"Tablero de indicadores",path:"resultados/tablero.html"},{name:"Informe de hallazgos",path:"informe.md"}],stages:[{title:"Define el objetivo",description:"Acota la pregunta que responderás con los datos de ventas.",tasks:["Elige los meses que vas a comparar.","Define un indicador y explica para quién será útil."],hint:"Compara el valor vendido y el número de pedidos. Esas dos medidas ayudan a distinguir una caída en cantidad de un cambio en el valor de cada compra."},{title:"Prepara los datos",description:"Revisa la calidad de los registros antes de calcular indicadores.",tasks:["Identifica fechas, categorías y montos.","Documenta cómo tratarás duplicados y devoluciones."],hint:"Comprueba si dos registros con el mismo número de pedido tienen productos distintos. Un pedido puede tener varias líneas válidas."},{title:"Construye el análisis",description:"Encuentra los meses y las categorías que explican el cambio.",tasks:["Agrupa las ventas por mes y categoría.","Contrasta los totales del tablero con una consulta de control."],hint:"Ordena las categorías por su cambio en dinero. Así podrás separar una caída grande en porcentaje de una caída que realmente mueve el total."},{title:"Prepara la entrega",description:"Presenta una recomendación respaldada por los resultados.",tasks:["Redacta el hallazgo principal y una acción concreta.","Incluye los pasos para repetir el análisis."],hint:"Acompaña cada recomendación con el dato que la sustenta y el periodo al que corresponde."}],criteria:[{id:"question-and-period",title:"Pregunta e indicador delimitados",stageIndex:0,requirements:[{label:"Define un periodo de análisis.",terms:["enero","febrero","marzo","trimestre","meses"]},{label:"Nombra las ventas o los ingresos.",terms:["ventas","vendido","ingresos"]},{label:"Considera pedidos o transacciones.",terms:["pedidos","órdenes","ordenes","compras"]}]},{id:"data-quality",title:"Revisión de calidad de datos",stageIndex:1,requirements:[{label:"Explica cómo tratar duplicados.",terms:["duplicado","duplicados","repetido","repetidos"]},{label:"Explica cómo tratar devoluciones.",terms:["devolución","devoluciones","reembolso"]}]},{id:"analysis-validation",title:"Análisis contrastable",stageIndex:2,requirements:[{label:"Agrupa los datos por periodo o categoría.",terms:["agrupar","agrupación","por mes","por categoría"]},{label:"Contrasta los totales con una comprobación.",terms:["contrastar","comparar","consulta de control","verificar"]}]},{id:"recommendation-evidence",title:"Recomendación respaldada y reproducible",stageIndex:3,requirements:[{label:"Incluye un hallazgo o dato concreto.",terms:["hallazgo","resultado","dato","cifra"]},{label:"Propone una acción.",terms:["recomendación","recomiendo","acción","revisar"]},{label:"Indica cómo repetir o verificar el análisis.",terms:["repetir","reproducir","consulta","pasos"]}]}]},{id:"api-de-inventario",area:"software",difficulty:"Intermedio",duration:"6–8 h",tags:["Python","APIs","Pruebas automatizadas"],title:"API de inventario",description:"Construye un servicio que registre productos y controle las existencias de una tienda.",brief:"El equipo de operaciones necesita un registro de productos con entradas y salidas de stock. Entrega un servicio que otro desarrollador pueda instalar y probar.",deliverables:[{name:"Servicio de inventario",path:"app/main.py"},{name:"Pruebas automatizadas",path:"tests/test_inventario.py"},{name:"Ejemplos de uso",path:"docs/ejemplos.md"}],stages:[{title:"Define el contrato",description:"Describe las operaciones que el servicio debe aceptar.",tasks:["Define los datos mínimos de un producto.","Describe las respuestas para cada operación."],hint:"Piensa en las respuestas cuando el producto existe, cuando falta y cuando ya hay otro con el mismo código."},{title:"Construye el servicio",description:"Implementa las rutas para consultar productos y actualizar su stock.",tasks:["Crea la ruta de listado y la de registro.","Valida el stock antes de guardar una salida."],hint:"Separa la regla de existencias de la ruta HTTP para poder probarla con datos pequeños."},{title:"Prueba los casos",description:"Comprueba las operaciones con datos de ejemplo.",tasks:["Prueba una actualización válida y una con stock insuficiente.","Verifica que el inventario conserve su valor al rechazar una operación."],hint:"Además del código de respuesta, revisa el valor que queda guardado. Ese dato demuestra el efecto real de la operación."},{title:"Documenta la entrega",description:"Deja instrucciones para instalar y usar el servicio.",tasks:["Escribe los pasos para iniciar el servicio y ejecutar las pruebas.","Incluye un ejemplo de solicitud y su respuesta."],hint:"Prueba tus instrucciones en una carpeta nueva para detectar pasos que tu entorno ya tenía configurados."}],criteria:[{id:"api-contract",title:"Contrato de la API definido",stageIndex:0,requirements:[{label:"Identifica el producto y su código.",terms:["producto","productos"]},{label:"Define el dato de stock o existencias.",terms:["stock","existencias"]},{label:"Describe las operaciones de la API.",terms:["get","post","patch","ruta","operación","operacion"]},{label:"Describe las respuestas de la API.",terms:["respuesta","respuestas","status","código","codigo"]}]},{id:"stock-validation",title:"Servicio y regla de stock descritos",stageIndex:1,requirements:[{label:"Incluye una operación para consultar/listar productos.",terms:["get","listado","consultar"]},{label:"Incluye una operación para registrar productos.",terms:["post","registro","crear"]},{label:"Valida una salida que excede las existencias.",terms:["stock","existencias"]},{label:"Rechaza el stock insuficiente.",terms:["insuficiente","no alcanza","negativo","rechaza"]}]},{id:"automated-tests",title:"Pruebas cubren éxito y rechazo sin alterar stock",stageIndex:2,requirements:[{label:"Prueba una actualización válida.",terms:["válida","valida","correcta","éxito","exito"]},{label:"Prueba el caso de stock insuficiente.",terms:["insuficiente","no alcanza","rechazo"]},{label:"Comprueba que el stock no cambie si se rechaza.",terms:["sin cambiar","conservar","mantener","no cambia"]}]},{id:"installable-documentation",title:"Entrega documentada y reproducible",stageIndex:3,requirements:[{label:"Explica cómo instalar o iniciar el servicio.",terms:["instalar","instalación","iniciar","ejecutar"]},{label:"Indica cómo ejecutar las pruebas.",terms:["pruebas","test","pytest"]},{label:"Incluye un ejemplo de solicitud y respuesta.",terms:["solicitud","request","respuesta","response"]}]}]},{id:"campana-de-lanzamiento",area:"communication",difficulty:"Intermedio",duration:"3–4 h",tags:["Redacción","Presentaciones","Métricas"],title:"Campaña de lanzamiento",description:"Diseña una campaña para un nuevo servicio y define cómo medir su alcance.",brief:"Un equipo va a lanzar un servicio de entregas en su ciudad. Necesita una propuesta de mensajes, canales y métricas que pueda presentar al equipo comercial.",deliverables:[{name:"Brief de campaña",path:"brief.md"},{name:"Calendario de contenidos",path:"calendario.csv"},{name:"Plan de medición",path:"medicion.md"}],stages:[{title:"Define el público",description:"Describe a quién le hablará la campaña y qué acción buscas.",tasks:["Elige un público concreto.","Plantea un objetivo que puedas medir durante el lanzamiento."],hint:"Una campaña para tiendas pequeñas podría buscar solicitudes de información de sus dueños durante la primera semana."},{title:"Redacta el mensaje",description:"Escribe la propuesta de valor con un llamado a la acción.",tasks:["Redacta un mensaje principal y una variación.","Comprueba que las promesas estén respaldadas por el brief."],hint:"Usa un beneficio comprobable y una acción clara, como pedir una cotización o consultar la cobertura."},{title:"Organiza el calendario",description:"Planifica los contenidos y el propósito de cada publicación.",tasks:["Elige el canal para cada pieza.","Ordena las publicaciones de anuncio, demostración y recordatorio."],hint:"Relaciona cada publicación con una pregunta que tendría el público en ese momento."},{title:"Define la medición",description:"Prepara una forma de saber si el lanzamiento alcanzó su objetivo.",tasks:["Selecciona un indicador de alcance y uno de respuesta.","Indica de dónde obtendrás los datos y cuándo los revisarás."],hint:"Si el objetivo son solicitudes de información, compara los clics con los formularios recibidos para identificar en qué parte cambia la respuesta."}],criteria:[{id:"audience-and-goal",title:"Público y objetivo definidos",stageIndex:0,requirements:[{label:"Identifica un público concreto.",terms:["público","publico","audiencia","clientes","tiendas"]},{label:"Plantea una acción u objetivo medible.",terms:["objetivo","meta","solicitudes","cotizaciones","registros","clics"]}]},{id:"supported-message",title:"Mensaje claro y respaldado",stageIndex:1,requirements:[{label:"Incluye una propuesta de valor o beneficio.",terms:["beneficio","propuesta de valor","servicio","entregas"]},{label:"Incluye un llamado a la acción.",terms:["cotización","cotizacion","solicita","consulta","regístrate","registrate"]},{label:"Evita promesas sin respaldo.",terms:["brief","respaldo","verificar","comprobable","confirmado"]}]},{id:"planned-content",title:"Calendario organizado por canal",stageIndex:2,requirements:[{label:"Asigna un canal a las publicaciones.",terms:["canal","instagram","facebook","correo","redes"]},{label:"Ordena los contenidos en el tiempo.",terms:["lunes","martes","miércoles","miercoles","viernes","semana","calendario","anuncio","demostración","demostracion"]}]},{id:"measurement-plan",title:"Medición con fuente y momento de revisión",stageIndex:3,requirements:[{label:"Define indicadores de alcance y respuesta.",terms:["alcance","impresiones","visitas"]},{label:"Mide una respuesta del público.",terms:["solicitudes","clics","registros","conversiones","respuestas"]},{label:"Indica fuente y cuándo revisar los datos.",terms:["fuente","registro","revisar","día","semana","lanzamiento"]}]}]}],i=(e,o,a,r,n=.01)=>({id:e,label:o,expected:a,help:r,tolerance:n,type:"number"}),t=(e,o,a,r,n)=>({id:e,label:o,options:a,expected:r,help:n,type:"select"}),w=[{name:"Registra un movimiento válido",ledger:[],id:"M2",cents:250,kind:"abono",expected:{accepted:!0,ledger:[{id:"M2",cents:250,kind:"abono"}]}},{name:"Conserva movimientos anteriores y su orden",ledger:[{id:"M1",cents:100,kind:"abono"}],id:"M2",cents:200,kind:"cargo",expected:{accepted:!0,ledger:[{id:"M1",cents:100,kind:"abono"},{id:"M2",cents:200,kind:"cargo"}]}},{name:"Rechaza un ID repetido sin alterar el registro",ledger:[{id:"M1",cents:100,kind:"abono"}],id:"M1",cents:200,kind:"cargo",expected:{accepted:!1,ledger:[{id:"M1",cents:100,kind:"abono"}]}},...[["Monto cero","M2",0,"cargo"],["Monto negativo","M2",-1,"abono"],["Monto decimal","M2",1.5,"cargo"],["Monto booleano","M2",!0,"cargo"],["Monto de texto","M2","25","cargo"],["ID vacío","  ",25,"abono"],["Tipo desconocido","M2",25,"otro"]].map(([e,o,a,r])=>({name:e,ledger:[],id:o,cents:a,kind:r,expected:{accepted:!1,ledger:[]}}))],s=(e,o,a,r)=>({title:e,description:o,tasks:a,hint:r}),c=(e,o)=>({name:e,path:o}),C=[{title:"Diagnóstico de transacciones",description:"Identifica qué canal explica el cambio en el volumen liquidado y recomienda una acción.",brief:"Operaciones de Banco Horizonte necesita explicar el cambio en transferencias liquidadas entre enero y marzo. Presenta un diagnóstico que se pueda conciliar y reproducir.",deliverables:[c("Consulta reproducible","sql/operaciones.sql"),c("Indicadores por canal","resultados/indicadores.csv"),c("Informe de hallazgos","informe.md")],stages:[s("Define la pregunta","Delimita qué necesita decidir Operaciones.",["Plantea un indicador y explica qué operaciones representa."],"¿Qué diferencia hay entre una transferencia iniciada y una liquidada?"),s("Prepara el extracto","Separa duplicados, pendientes y reversiones.",["Documenta qué incluyes y por qué."],"Un ID repetido y una reversión tienen efectos diferentes."),s("Concilia los resultados","Compara enero y marzo y comprueba el total trimestral.",["Deja una consulta o pasos reproducibles en tu explicación."],"Contrasta los totales por mes con una suma independiente."),s("Defiende la recomendación","Explica qué canal aporta más al cambio.",["Propón una acción y una comprobación antes de atribuir causas."],"¿Qué dato adicional distinguiría un problema del canal de una caída en la demanda?")],rubric:{context:"Extracto ficticio en USD. ID identifica la operación. Las confirmadas y las reversiones cuentan en el volumen neto liquidado. Los pendientes aún no se liquidan. Una reversión tiene importe negativo.",review:"Revisar la consulta o los pasos, la relación entre hallazgo y recomendación, y los límites del diagnóstico. Se comprueban los resultados declarados.",stages:[[t("period","Periodo",["Enero y marzo","Enero y febrero"],"Enero y marzo","Usa los extremos del trimestre."),t("metric","Indicador",["Volumen neto liquidado","Cantidad de filas"],"Volumen neto liquidado","Mide el importe de movimientos liquidados.")],[i("duplicates","Repeticiones excluidas",1,"Contrasta el ID de operación."),i("pending","Pendientes excluidas",1,"Comprueba el estado de cada fila."),i("reversal","Importe de la reversión",-200,"Conserva el signo del extracto.")],[i("january","Neto de enero",8200,"Depura antes de sumar."),i("march","Neto de marzo",6100,"Separa lo pendiente y aplica la reversión."),i("change","Variación porcentual",-2100/8200*100,"Usa enero como base.",.05),i("control","Total trimestral conciliado",21700,"Comprueba la suma de los tres meses.")],[t("channel","Canal con mayor caída absoluta",["Digital","Ventanilla"],"Digital","Compara la diferencia en USD por canal."),i("channelChange","Variación en USD del canal elegido",-2e3,"Resta el valor de enero al de marzo para ese canal.")]]}},{title:"API de movimientos bancarios",description:"Diseña un contrato de registro y consulta, y prueba la lógica de movimientos con trazabilidad.",brief:"El equipo de Banco Horizonte necesita registrar movimientos de prueba con un identificador único y conservar el historial ante entradas inválidas.",deliverables:[c("Contrato de rutas","docs/contrato.md"),c("Lógica Python","app/movimientos.py"),c("Pruebas y ejemplos","tests/casos.md")],stages:[s("Define el contrato","Diseña POST /movimientos y GET /movimientos/{id}.",["Explica cómo tratarás identificadores repetidos y datos inválidos."],"¿Qué debería recibir el cliente si reenvía un identificador ya registrado?"),s("Implementa el registro","Escribe registrar_movimiento en Python y ejecuta las pruebas.",["Conserva el historial anterior ante un rechazo."],"Compara el estado antes y después de una entrada inválida."),s("Prueba las reglas","Contrasta un éxito, un rechazo y un reintento.",["Documenta un caso adicional y el estado que esperas."],"¿Qué debería permanecer igual al repetir una solicitud?"),s("Defiende la entrega","Documenta una solicitud y su respuesta.",["Justifica cómo puede otro desarrollador reproducir el resultado."],"Separa la prueba de la función de una prueba de una ruta HTTP.")],rubric:{context:"Contrato ficticio: POST /movimientos devuelve 201 al crear, 409 ante ID repetido y 400 por datos inválidos. GET /movimientos/{id} devuelve 200 si existe o 404 si falta. En Python, registrar_movimiento(ledger, movement_id, cents, kind) devuelve {accepted: booleano, ledger: lista}. Cada movimiento contiene id, cents y kind. ID es texto no vacío, el monto es un entero positivo en centavos y el tipo es abono o cargo. Un rechazo conserva los registros y un éxito añade el movimiento al final.",review:"Revisar el diseño de rutas, trazabilidad, ejemplos y reproducibilidad. La ejecución automática cubre la función Python y el estado resultante.",stages:[[i("created","Estado HTTP al crear",201,"Consulta el contrato de creación."),i("duplicate","Estado HTTP para un ID repetido",409,"El identificador ya existe."),i("invalid","Estado HTTP con datos inválidos",400,"Consulta el contrato de entrada.")],[],[t("retry","Efecto de repetir un ID",["Conserva el registro","Añade otra fila"],"Conserva el registro","Verifica el estado tras un rechazo."),i("missing","Estado HTTP si el movimiento no existe",404,"Consulta el contrato de búsqueda.")],[t("method","Método para registrar",["POST","GET"],"POST","Elige la operación de creación."),i("lookup","Estado HTTP para una consulta exitosa",200,"Consulta el contrato de búsqueda.")]]}},{title:"Campaña de un servicio bancario digital",description:"Presenta el piloto de alertas de transferencias y defiende mensajes respaldados por el brief.",brief:"Banco Horizonte necesita comunicar un piloto de alertas de transferencias a clientes de banca móvil y medir cuántas personas solicitan acceso.",deliverables:[c("Brief y mensajes","brief.md"),c("Calendario","calendario.csv"),c("Medición y respuesta a objeciones","medicion.md")],stages:[s("Define el público","Aclara a quién se dirige la campaña y qué acción esperas.",["Propón un objetivo medible."],"Comprueba quién puede solicitar acceso al piloto."),s("Redacta y defiende el mensaje","Explica el beneficio y las condiciones.",["Responde a Atención al Cliente si pregunta si todas las alertas llegarán de inmediato."],"Distingue las condiciones del piloto de una garantía de entrega."),s("Organiza el calendario","Coordina anuncio, demostración y recordatorio.",["Explica por qué seleccionaste el canal."],"Revisa qué canales autoriza el brief."),s("Mide y justifica","Interpreta las solicitudes y plantea una mejora.",["Distingue una solicitud de una activación efectiva."],"Comprueba qué mide el denominador de la conversión.")],rubric:{context:"Piloto ficticio de alertas de transferencias para clientes con banca móvil activa. Solicitar acceso no garantiza activación ni alertas instantáneas. Campaña de siete días, presupuesto máximo de $100 y meta de 12 solicitudes. Canales: correo y aviso en la app. Seguimiento: 80 clics, 12 solicitudes registradas.",review:"Revisar adecuación del mensaje, respaldo de promesas y respuesta a la objeción. La rúbrica verifica las condiciones seleccionadas y los cálculos.",stages:[[t("audience","Público",["Clientes con banca móvil activa","Público general"],"Clientes con banca móvil activa","Consulta quién tiene acceso al piloto."),i("goal","Meta de solicitudes",12,"Distingue solicitudes de clics."),i("budget","Presupuesto",100,"Respeta el máximo del brief.")],[t("promise","Condición del servicio",["Acceso sujeto al piloto","Alertas instantáneas garantizadas"],"Acceso sujeto al piloto","Comprueba si el brief permite esa promesa."),t("cta","Acción del cliente",["Solicitar acceso","Confirmar activación inmediata"],"Solicitar acceso","La campaña mide solicitudes.")],[i("announcement","Día del anuncio",null,"El anuncio abre la secuencia."),i("demonstration","Día de demostración",null,"Ubica la demostración después del anuncio."),i("reminder","Día del recordatorio",null,"Cierra la secuencia antes de terminar el día siete."),t("channel","Canal",["Correo","Aviso en la app","Televisión"],["Correo","Aviso en la app"],"Usa un canal autorizado.")],[i("conversion","Conversión de clics a solicitudes (%)",15,"Divide las solicitudes por los clics y convierte a porcentaje."),t("source","Fuente para verificar la meta",["Registro de solicitudes","Impresiones"],"Registro de solicitudes","Usa el registro que mide la acción buscada.")]]}}];x.map((e,o)=>{const a=C[o];return{...e,...a,bank:!0,criteria:a.stages.map(({title:r},n)=>({id:e.criteria[n].id,title:r,stageIndex:n}))}});var h=`import json
_cases = json.loads(_inventory_cases)
_source = str(_inventory_source)
_results = []
for _case in _cases:
    try:
        _namespace = {}
        exec(_source, _namespace)
        _value = _namespace['mover_stock'](_case['stock'], _case['cantidad'], _case['operacion'])
        if not isinstance(_value, dict) or type(_value.get('aceptado')) is not bool or type(_value.get('stock')) is not int:
            raise ValueError('Devuelve un diccionario con aceptado booleano y stock entero.')
        _results.append({'result': {'aceptado': _value['aceptado'], 'stock': _value['stock']}})
    except Exception as _error:
        _results.append({'error': str(_error)})
json.dumps(_results)
`;const d=(e,o,a,r,n=.01)=>({id:e,label:o,type:"number",expected:a,help:r,tolerance:n}),u=(e,o,a,r,n)=>({id:e,label:o,type:"select",options:a,expected:r,help:n}),E=[["v1","enero","A",6e3],["v2","enero","B",2200],["v1","enero","A",6e3],["v3","febrero","A",5e3],["v4","febrero","B",2400],["v5","marzo","A",4e3],["v6","marzo","B",2300],["d1","marzo","B",-200]],m=[...new Map(E.map(e=>[e[0],e])).values()],v=e=>e.reduce((o,a)=>o+a[3],0),p=v(m.filter(e=>e[1]==="enero")),f=v(m.filter(e=>e[1]==="marzo")),q=[{name:"Salida válida",stock:10,cantidad:3,operacion:"salida",expected:{aceptado:!0,stock:7}},{name:"Salida superior al stock",stock:10,cantidad:12,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Salida de todas las unidades",stock:10,cantidad:10,operacion:"salida",expected:{aceptado:!0,stock:0}},{name:"Entrada",stock:10,cantidad:3,operacion:"entrada",expected:{aceptado:!0,stock:13}},{name:"Cantidad cero",stock:10,cantidad:0,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad negativa",stock:10,cantidad:-3,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad fraccionaria",stock:10,cantidad:1.5,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad de texto",stock:10,cantidad:"3",operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad booleana",stock:10,cantidad:!0,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Operación desconocida",stock:10,cantidad:3,operacion:"otra",expected:{aceptado:!1,stock:10}}];u("period","Periodo de comparación",["enero–marzo","enero–febrero","febrero–marzo"],"enero–marzo","El encargo compara enero con marzo."),u("metric","Indicador principal",["Ingresos netos","Número de filas","Ingresos sin devoluciones"],"Ingresos netos","Las devoluciones forman parte del valor neto vendido."),d("duplicates","Movimientos duplicados que debes excluir",1,"Cuenta las repeticiones del mismo ID de movimiento."),u("key","Clave para eliminar duplicados",["ID de movimiento","Mes","Categoría"],"ID de movimiento","Varias ventas del mismo mes o categoría son válidas."),d("refund","Importe neto de la devolución (USD)",-200,"La devolución reduce los ingresos de marzo."),d("january","Ingresos netos de enero (USD)",p,"Suma enero después de excluir la importación repetida."),d("march","Ingresos netos de marzo (USD)",f,"Incluye el movimiento negativo de marzo."),d("delta","Variación absoluta, marzo menos enero (USD)",f-p,"Resta los ingresos iniciales a los finales."),d("percent","Variación porcentual (%)",(f-p)/p*100,"Divide la diferencia entre el valor de enero y multiplica por 100.",.05),u("direction","Conclusión sobre los ingresos",["Disminuyeron","Aumentaron","Se mantuvieron"],"Disminuyeron","Contrasta los totales de enero y marzo."),u("category","Categoría que explica la mayor caída absoluta",["A","B"],"A","Compara la diferencia en USD de cada categoría."),d("categoryDelta","Variación de esa categoría (USD)",-2e3,"La categoría A pasa de 6.000 a 4.000 USD."),d("control","Total neto del trimestre para conciliar (USD)",v(m),"La suma de los meses debe coincidir con la suma de movimientos únicos.");var S=`import json

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
`,I=`from sqlalchemy import Boolean, Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


class Pet(Base):
    __tablename__ = "pets"
    id = Column(Integer, primary_key=True)
    species = Column(String(40))
    city = Column(String(60))
    urgency_level = Column(Integer)
    is_adopted = Column(Boolean, default=False)


PETS = [
    {
        "id": i,
        "species": "dog" if i % 3 else "cat",
        "city": "Guayaquil" if i % 4 else "Quito",
        "urgency_level": (i % 5) + 1,
        "is_adopted": i % 7 == 0,
    }
    for i in range(1, 51)
]


def open_pets_database():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    db.add_all([Pet(**row) for row in PETS])
    db.commit()
    return db, engine
`;const b="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",D=new URL("pyodide.mjs",b).href;async function P(){const{loadPyodide:e}=await import(D);if(typeof e!="function")throw new Error("El módulo de Pyodide no expuso loadPyodide.");return e({indexURL:b})}self.onmessage=async({data:{code:e,parameters:o,taskType:a}})=>{let r="";try{const n=await P();if(a!=="inventory"&&a!=="bank-movements"&&await n.loadPackage(["sqlalchemy","sqlite3"]),n.setStdout({batched:l=>{r+=`${l}
`}}),n.setStderr({batched:l=>{r+=`${l}
`}}),self.postMessage({phase:"ready"}),a==="inventory"||a==="bank-movements"){const l=a==="bank-movements";n.globals.set("_inventory_source",e),n.globals.set("_inventory_cases",JSON.stringify(l?w:q));const j=await n.runPythonAsync(l?k:h);self.postMessage({output:r,result:JSON.parse(j)});return}const g=a==="bank-operations";await n.runPythonAsync(g?y:I),n.globals.set("_worksim_source",e),n.globals.set("_worksim_parameters",JSON.stringify(o));const z=await n.runPythonAsync(g?_:S);self.postMessage({output:r,...JSON.parse(z)})}catch(n){self.postMessage({output:r,error:n.message})}}})();
