(function(){"use strict";var u=`import json
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
`;const n=(e,t,s,o,a=.01)=>({id:e,label:t,type:"number",expected:s,help:o,tolerance:a}),r=(e,t,s,o,a)=>({id:e,label:t,type:"select",options:s,expected:o,help:a}),_=[["v1","enero","A",6e3],["v2","enero","B",2200],["v1","enero","A",6e3],["v3","febrero","A",5e3],["v4","febrero","B",2400],["v5","marzo","A",4e3],["v6","marzo","B",2300],["d1","marzo","B",-200]],d=[...new Map(_.map(e=>[e[0],e])).values()],l=e=>e.reduce((t,s)=>t+s[3],0),c=l(d.filter(e=>e[1]==="enero")),p=l(d.filter(e=>e[1]==="marzo")),y=[{name:"Salida válida",stock:10,cantidad:3,operacion:"salida",expected:{aceptado:!0,stock:7}},{name:"Salida superior al stock",stock:10,cantidad:12,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Salida de todas las unidades",stock:10,cantidad:10,operacion:"salida",expected:{aceptado:!0,stock:0}},{name:"Entrada",stock:10,cantidad:3,operacion:"entrada",expected:{aceptado:!0,stock:13}},{name:"Cantidad cero",stock:10,cantidad:0,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad negativa",stock:10,cantidad:-3,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad fraccionaria",stock:10,cantidad:1.5,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad de texto",stock:10,cantidad:"3",operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Cantidad booleana",stock:10,cantidad:!0,operacion:"salida",expected:{aceptado:!1,stock:10}},{name:"Operación desconocida",stock:10,cantidad:3,operacion:"otra",expected:{aceptado:!1,stock:10}}];r("period","Periodo de comparación",["enero–marzo","enero–febrero","febrero–marzo"],"enero–marzo","El encargo compara enero con marzo."),r("metric","Indicador principal",["Ingresos netos","Número de filas","Ingresos sin devoluciones"],"Ingresos netos","Las devoluciones forman parte del valor neto vendido."),n("duplicates","Movimientos duplicados que debes excluir",1,"Cuenta las repeticiones del mismo ID de movimiento."),r("key","Clave para eliminar duplicados",["ID de movimiento","Mes","Categoría"],"ID de movimiento","Varias ventas del mismo mes o categoría son válidas."),n("refund","Importe neto de la devolución (USD)",-200,"La devolución reduce los ingresos de marzo."),n("january","Ingresos netos de enero (USD)",c,"Suma enero después de excluir la importación repetida."),n("march","Ingresos netos de marzo (USD)",p,"Incluye el movimiento negativo de marzo."),n("delta","Variación absoluta, marzo menos enero (USD)",p-c,"Resta los ingresos iniciales a los finales."),n("percent","Variación porcentual (%)",(p-c)/c*100,"Divide la diferencia entre el valor de enero y multiplica por 100.",.05),r("direction","Conclusión sobre los ingresos",["Disminuyeron","Aumentaron","Se mantuvieron"],"Disminuyeron","Contrasta los totales de enero y marzo."),r("category","Categoría que explica la mayor caída absoluta",["A","B"],"A","Compara la diferencia en USD de cada categoría."),n("categoryDelta","Variación de esa categoría (USD)",-2e3,"La categoría A pasa de 6.000 a 4.000 USD."),n("control","Total neto del trimestre para conciliar (USD)",l(d),"La suma de los meses debe coincidir con la suma de movimientos únicos.");var v=`from sqlalchemy import Boolean, Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class Pet(Base):
    __tablename__ = "pets"
    id = Column(Integer, primary_key=True)
    species = Column(String(40))
    city = Column(String(60))
    urgency_level = Column(Integer)
    is_adopted = Column(Boolean, default=False)

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)
db = sessionmaker(bind=engine)()
for i in range(1, 51):
    db.add(Pet(
        id=i,
        species="dog" if i % 3 else "cat",
        city="Guayaquil" if i % 4 else "Quito",
        urgency_level=(i % 5) + 1,
        is_adopted=(i % 7 == 0),
    ))
db.commit()
`;const m="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",g=new URL("pyodide.mjs",m).href;async function f(){const{loadPyodide:e}=await import(g);if(typeof e!="function")throw new Error("El módulo de Pyodide no expuso loadPyodide.");return e({indexURL:m})}self.onmessage=async({data:{code:e,parameters:t,taskType:s}})=>{let o="";try{const a=await f();if(s!=="inventory"&&await a.loadPackage(["sqlalchemy","sqlite3"]),a.setStdout({batched:i=>{o+=`${i}
`}}),a.setStderr({batched:i=>{o+=`${i}
`}}),self.postMessage({phase:"ready"}),s==="inventory"){a.globals.set("_inventory_source",e),a.globals.set("_inventory_cases",JSON.stringify(y));const i=await a.runPythonAsync(u);self.postMessage({output:o,result:JSON.parse(i)});return}await a.runPythonAsync(v),await a.runPythonAsync(e),a.globals.set("_worksim_parameters",JSON.stringify(t));const k=await a.runPythonAsync(`
import json
_worksim_args = json.loads(_worksim_parameters)
_worksim_items = list_pets(**_worksim_args)
_worksim_rows = [
    {"id": pet.id, "species": pet.species, "city": pet.city,
     "urgency_level": pet.urgency_level, "is_adopted": pet.is_adopted}
    if isinstance(pet, Pet) else pet
    for pet in _worksim_items
]
json.dumps(_worksim_rows)
`);self.postMessage({output:o,result:JSON.parse(k)})}catch(a){self.postMessage({output:o,error:a.message})}}})();
