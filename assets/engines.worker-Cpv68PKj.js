(function(){"use strict";var w=""+new URL("sql-wasm-CZHpDDNI.js",self.location.href).href,q=""+new URL("sql-wasm-C1U8OeUW.wasm",self.location.href).href;const b="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";function D(){return importScripts(`${b}pyodide.js`),self.loadPyodide({indexURL:b})}var L=`import json


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
`;const y=[[108,"Guayaquil","transferencia","confirmada",190],[106,"Guayaquil","transferencia","pendiente",310],[101,"Guayaquil","transferencia","confirmada",220],[107,"Quito","transferencia","confirmada",390],[103,"Guayaquil","transferencia","confirmada",190],[105,"Guayaquil","retiro","confirmada",280],[104,"Guayaquil","transferencia","confirmada",100],[102,"Guayaquil","transferencia","confirmada",99],[110,"Guayaquil","transferencia","confirmada",190]],g=[[108,"Acceso al portal","abierta",5],[106,"Restablecer contraseña","cerrada",5],[102,"Error al descargar reporte","abierta",3],[104,"Permisos de facturación","abierta",2],[101,"Inicio de sesión bloqueado","abierta",5],[107,"Actualizar correo","cerrada",3],[103,"Pago duplicado","abierta",4],[105,"Cambiar foto de perfil","abierta",1]],h=`SELECT id, monto
FROM transacciones
WHERE ciudad = 'Guayaquil'
  AND tipo = 'transferencia'
  AND monto >= 100
ORDER BY monto DESC, id ASC
LIMIT 3;`,v=`SELECT id, asunto, prioridad
FROM solicitudes
WHERE estado = 'abierta' AND prioridad >= 3
ORDER BY prioridad DESC, id DESC;`,T=`def retirar(saldo, monto):
    if monto < 0:
        return (400, saldo)
    if monto >= saldo:
        return (409, saldo)
    saldo_final = saldo - monto
    return (201, saldo_final)`,S=`SELECT titulo, anio
FROM libros
WHERE categoria = 'ciencia'
ORDER BY anio DESC;`,f=[{id:"transfers",label:"Transferencias",language:"SQL",company:"Banco Horizonte",title:"Prepara el reporte de transferencias",intro:"Tu supervisora necesita las tres transferencias confirmadas de mayor monto para revisar el reporte de Guayaquil.",requirements:["Incluye transferencias confirmadas de Guayaquil por $100 o más.","Ordena por monto de mayor a menor. En empate, pon primero el ID menor.","Devuelve las primeras tres filas. Muestra las columnas id y monto, en ese orden."],guide:[["SELECT · FROM","Elige las columnas e indica de qué tabla salen."],["WHERE · AND","Usa AND cuando todas las condiciones tengan que cumplirse."],["ORDER BY · LIMIT","Ordena el resultado antes de quedarte con sus primeras filas."]],example:S,hint:"Comprueba que tu WHERE considere ciudad, tipo, estado y monto. Usa LIMIT al final.",ai:h,reference:h.replace("  AND monto",`  AND estado = 'confirmada'
  AND monto`),table:"transacciones",columns:["id","ciudad","tipo","estado","monto"],output:["id","monto"],rows:y,variation:[...y.map(([a,...e])=>[350-a,...e]),[222,"Guayaquil","transferencia","confirmada",270]]},{id:"support",label:"Cola de soporte",language:"SQL",company:"Mesa de soporte",title:"Ordena la cola de soporte",intro:"El equipo de soporte quiere ver las solicitudes abiertas que debe atender primero.",requirements:["Incluye solo solicitudes abiertas con prioridad 3 o superior.","Ordena la prioridad de mayor a menor. En empate, pon primero el ID menor.","Muestra las columnas id, asunto y prioridad, en ese orden."],guide:[["SELECT · FROM","Indica cuáles columnas necesitas y de qué tabla vienen."],["WHERE","Las condiciones eligen las filas que aparecerán en tu resultado."],["ORDER BY","Usa DESC para ordenar de mayor a menor y ASC para el sentido contrario."]],example:S,hint:"Puedes indicar dos columnas separadas por una coma en ORDER BY. La segunda resuelve los empates.",ai:v,reference:v.replace("id DESC","id ASC"),table:"solicitudes",columns:["id","asunto","estado","prioridad"],output:["id","asunto","prioridad"],rows:g,variation:[...g.map(([a,...e])=>[330-a,...e]),[235,"Exportar comprobante","abierta",4]]},{id:"withdrawal",label:"Retiros",language:"Python",company:"Banco Horizonte",title:"Valida un retiro",intro:"Escribe una función que decida si se puede retirar un monto y devuelva el saldo correspondiente.",requirements:["Define retirar(saldo, monto). Recibirás dos números enteros y el saldo inicial será mayor o igual a cero.","Devuelve una tupla (código, saldo_final). Si el monto es cero o negativo, devuelve (400, saldo).","Si el monto supera el saldo, devuelve (409, saldo). Si el retiro se puede hacer, devuelve (201, saldo - monto)."],guide:[["def","Define la función con el nombre y los parámetros del encargo."],["if","Comprueba una condición y decide qué resultado corresponde."],["return","Devuelve los dos valores juntos, separados por una coma."]],example:`def revisar_stock(unidades):
    if unidades == 0:
        return ("agotado", unidades)
    return ("disponible", unidades)`,hint:"Comprueba el caso con monto cero y el retiro por el saldo exacto.",ai:T}];[...f.map(a=>({path:a.id,label:a.label}))];const C={transfers:{schema:"id INTEGER UNIQUE, ciudad TEXT, tipo TEXT, estado TEXT, monto INTEGER",eligible:([,a,e,i,s])=>a==="Guayaquil"&&e==="transferencia"&&i==="confirmada"&&s>=100,order:(a,e)=>e[4]-a[4]||a[0]-e[0],limit:3,selectionLabel:"Las tres transferencias solicitadas",orderLabel:"Orden por monto e ID"},support:{schema:"id INTEGER UNIQUE, asunto TEXT, estado TEXT, prioridad INTEGER",eligible:a=>a[2]==="abierta"&&a[3]>=3,order:(a,e)=>e[3]-a[3]||a[0]-e[0],selectionLabel:"Todas las solicitudes elegibles",orderLabel:"Orden por prioridad e ID"}};function I(a){const e=String(a.message||a).slice(0,220),i=/^no such table: (.+)$/.exec(e);if(i)return`No se encontró la tabla «${i[1]}». Revisa el nombre después de FROM.`;const s=/^no such column: (.+)$/.exec(e);if(s)return`No se encontró la columna «${s[1]}». Revisa los nombres y las comillas del texto.`;const o=/^near "(.+)": syntax error$/.exec(e);return o?`Hay un error de sintaxis cerca de «${o[1]}».`:e==="incomplete input"?"La consulta está incompleta.":e}function O(a,e,i,s,o){const n=new a.Database;try{const p=s.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/,"");if(!/^(SELECT|WITH)\b/i.test(p))throw new Error("Escribe una consulta de lectura con SELECT o WITH.");n.run(`CREATE TABLE ${e.table} (${i})`);const d=e.columns.map(()=>"?").join(", "),c=n.prepare(`INSERT INTO ${e.table} VALUES (${d})`);try{for(const u of o)c.run(u)}finally{c.free()}n.run("PRAGMA query_only = ON");const l=n.iterateStatements(s),t=l.next().value,m=(t==null?void 0:t.getColumnNames())??[];if(!m.length)throw new Error("La consulta debe devolver una tabla.");if(m.length>16)throw new Error("La consulta devolvió más de 16 columnas.");const r=[];for(;t.step();){if(r.length>=100)throw new Error("La consulta devolvió más de 100 filas.");r.push(t.get().map(u=>ArrayBuffer.isView(u)?"[binario]":typeof u=="string"?u.slice(0,240):u))}if(!l.next().done)throw new Error("Ejecuta una sola consulta por vez.");return{columns:m,rows:r,error:null}}catch(p){return{columns:[],rows:[],error:I(p)}}finally{n.close()}}function A(a,e,i,s){const o=s.columns.map(r=>r.toLowerCase()),n=s.rows.map(r=>r[o.indexOf("id")]),p=new Map(i.map(r=>[r[0],r])),d=o.map(r=>a.columns.indexOf(r)),c=s.rows.map((r,u)=>{const E=p.get(n[u]);return E&&d.every((R,x)=>R<0||E[R]===r[x])?E:null}),l=c.length>0&&c.every(Boolean),t=i.filter(e.eligible).sort(e.order).slice(0,e.limit??i.length),m=new Set(n);return[["Columnas solicitadas",o.length===a.output.length&&a.output.every((r,u)=>o[u]===r),`Columnas esperadas: ${a.output.join(", ")}.`],["Filtros del encargo",l&&c.every(e.eligible),"Comprueba que todas las filas devueltas cumplan las condiciones."],[e.selectionLabel,l&&n.length===t.length&&m.size===t.length&&t.every(r=>m.has(r[0])),`Se esperaban ${t.length} filas. La consulta devolvió ${n.length}.`],[e.orderLabel,l&&c.length>1&&c.every((r,u)=>u===0||e.order(c[u-1],r)<=0),"Revisa el orden principal y el sentido del desempate por ID."]]}function N(a,e,i){var c;const s=f.find(l=>l.id===e),o=C[e],n=[s.rows,s.variation].map(l=>{const t=O(a,s,o.schema,i,l);return{...t,checks:A(s,o,l,t)}}),p=n[0],d=p.checks.map(([l],t)=>{var m;return{label:l,passed:n.every(r=>!r.error&&r.checks[t][1]),evidence:((m=n.find(r=>!r.checks[t][1]))==null?void 0:m.checks[t][2])??p.checks[t][2]}});return{columns:p.columns,rows:p.rows,checks:d,passed:d.filter(l=>l.passed).length,total:d.length,error:((c=n.find(l=>l.error))==null?void 0:c.error)??null}}self.onmessage=async({data:a})=>{try{const e=f.find(o=>o.id===a.id);let i;if(e.language==="SQL"){importScripts(w);const o=await self.initSqlJs({locateFile:()=>q});i=n=>N(o,e.id,n)}else{const o=await D();o.setStdout({batched:()=>{}}),o.setStderr({batched:()=>{}}),o.runPython(L);const n=o.globals.get("ejecutar_pruebas");i=p=>{const d=JSON.parse(n(p));return d.error?{...d,checks:[],passed:0,total:5}:{...d,passed:d.checks.filter(c=>c.passed).length,total:d.checks.length}}}self.postMessage({phase:"ready"});const s=i(a.code);self.postMessage({user:s,ai:a.compare?i(e.ai):null})}catch(e){self.postMessage({error:String(e.message||e).slice(0,300)})}}})();
