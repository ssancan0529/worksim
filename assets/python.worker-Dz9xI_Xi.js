(function(){"use strict";var m=`import json
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
`;const a=(e,r,s,o,n=.01)=>({id:e,label:r,type:"number",expected:s,help:o,tolerance:n}),t=(e,r,s,o,n)=>({id:e,label:r,type:"select",options:s,expected:o,help:n}),f=[["v1","enero","A",6e3],["v2","enero","B",2200],["v1","enero","A",6e3],["v3","febrero","A",5e3],["v4","febrero","B",2400],["v5","marzo","A",4e3],["v6","marzo","B",2300],["d1","marzo","B",-200]],d=[...new Map(f.map(e=>[e[0],e])).values()],l=e=>e.reduce((r,s)=>r+s[3],0),c=l(d.filter(e=>e[1]==="enero")),p=l(d.filter(e=>e[1]==="marzo")),_=[{name:"Salida válida",stock:10,cantidad:3,operacion:"salida",expected:{aceptado:!0,stock:7}},{name:"Salida superior al stock",stock:10,cantidad:12,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Salida de todas las unidades",stock:10,cantidad:10,operacion:"salida",expected:{aceptado:!0,stock:0}},{name:"Entrada",stock:10,cantidad:3,operacion:"entrada",expected:{aceptado:!0,stock:13}},{name:"Cantidad cero",stock:10,cantidad:0,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad negativa",stock:10,cantidad:-3,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad fraccionaria",stock:10,cantidad:1.5,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad de texto",stock:10,cantidad:"3",operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad booleana",stock:10,cantidad:!0,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Operación desconocida",stock:10,cantidad:3,operacion:"otra",expected:{aceptado:!1,stock:10}}];t("period","Periodo de comparación",["enero–marzo","enero–febrero","febrero–marzo"],"enero–marzo","El encargo compara enero con marzo."),t("metric","Indicador principal",["Ingresos netos","Número de filas","Ingresos sin devoluciones"],"Ingresos netos","Las devoluciones forman parte del valor neto vendido."),a("duplicates","Movimientos duplicados que debes excluir",1,"Cuenta las repeticiones del mismo ID de movimiento."),t("key","Clave para eliminar duplicados",["ID de movimiento","Mes","Categoría"],"ID de movimiento","Varias ventas del mismo mes o categoría son válidas."),a("refund","Importe neto de la devolución (USD)",-200,"La devolución reduce los ingresos de marzo."),a("january","Ingresos netos de enero (USD)",c,"Suma enero después de excluir la importación repetida."),a("march","Ingresos netos de marzo (USD)",p,"Incluye el movimiento negativo de marzo."),a("delta","Variación absoluta, marzo menos enero (USD)",p-c,"Resta los ingresos iniciales a los finales."),a("percent","Variación porcentual (%)",(p-c)/c*100,"Divide la diferencia entre el valor de enero y multiplica por 100.",.05),t("direction","Conclusión sobre los ingresos",["Disminuyeron","Aumentaron","Se mantuvieron"],"Disminuyeron","Contrasta los totales de enero y marzo."),t("category","Categoría que explica la mayor caída absoluta",["A","B"],"A","Compara la diferencia en USD de cada categoría."),a("categoryDelta","Variación de esa categoría (USD)",-2e3,"La categoría A pasa de 6.000 a 4.000 USD."),a("control","Total neto del trimestre para conciliar (USD)",l(d),"La suma de los meses debe coincidir con la suma de movimientos únicos.");var y=`import json

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
`,v=`from sqlalchemy import Boolean, Column, Integer, String, create_engine
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
`;const u="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",g=new URL("pyodide.mjs",u).href;async function w(){const{loadPyodide:e}=await import(g);if(typeof e!="function")throw new Error("El módulo de Pyodide no expuso loadPyodide.");return e({indexURL:u})}self.onmessage=async({data:{code:e,parameters:r,taskType:s}})=>{let o="";try{const n=await w();if(s!=="inventory"&&await n.loadPackage(["sqlalchemy","sqlite3"]),n.setStdout({batched:i=>{o+=`${i}
`}}),n.setStderr({batched:i=>{o+=`${i}
`}}),self.postMessage({phase:"ready"}),s==="inventory"){n.globals.set("_inventory_source",e),n.globals.set("_inventory_cases",JSON.stringify(_));const i=await n.runPythonAsync(m);self.postMessage({output:o,result:JSON.parse(i)});return}await n.runPythonAsync(v),n.globals.set("_worksim_source",e),n.globals.set("_worksim_parameters",JSON.stringify(r));const k=await n.runPythonAsync(y);self.postMessage({output:o,...JSON.parse(k)})}catch(n){self.postMessage({output:o,error:n.message})}}})();
