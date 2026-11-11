(function(){"use strict";var T=""+new URL("sql-wasm-CZHpDDNI.js",self.location.href).href,C=""+new URL("sql-wasm-C1U8OeUW.wasm",self.location.href).href;const I="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";function $(){return importScripts(`${I}pyodide.js`),self.loadPyodide({indexURL:I})}var x=`import json


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
`;const S=[[108,"Guayaquil","transferencia","confirmada",190],[106,"Guayaquil","transferencia","pendiente",310],[101,"Guayaquil","transferencia","confirmada",220],[107,"Quito","transferencia","confirmada",390],[103,"Guayaquil","transferencia","confirmada",190],[105,"Guayaquil","retiro","confirmada",280],[104,"Guayaquil","transferencia","confirmada",100],[102,"Guayaquil","transferencia","confirmada",99],[110,"Guayaquil","transferencia","confirmada",190]],R=[[108,"Acceso al portal","abierta",5],[106,"Restablecer contraseña","cerrada",5],[102,"Error al descargar reporte","abierta",3],[104,"Permisos de facturación","abierta",2],[101,"Inicio de sesión bloqueado","abierta",5],[107,"Actualizar correo","cerrada",3],[103,"Pago duplicado","abierta",4],[105,"Cambiar foto de perfil","abierta",1]],D=`SELECT id, monto
FROM transacciones
WHERE ciudad = 'Guayaquil'
  AND tipo = 'transferencia'
  AND monto >= 100
ORDER BY monto DESC, id ASC
LIMIT 3;`,w=`SELECT id, asunto, prioridad
FROM solicitudes
WHERE estado = 'abierta' AND prioridad >= 3
ORDER BY prioridad DESC, id DESC;`,A=`def retirar(saldo, monto):
    if monto < 0:
        return (400, saldo)
    if monto >= saldo:
        return (409, saldo)
    saldo_final = saldo - monto
    return (201, saldo_final)`,L=`SELECT titulo, anio
FROM libros
WHERE categoria = 'ciencia'
ORDER BY anio DESC;`,b=[{id:"transfers",label:"Transferencias",language:"SQL",company:"Banco Horizonte",title:"Prepara el reporte de transferencias",intro:"Tu supervisora necesita las tres transferencias confirmadas de mayor monto para revisar el reporte de Guayaquil.",requirements:["Incluye transferencias confirmadas de Guayaquil por $100 o más.","Ordena por monto de mayor a menor. En empate, pon primero el ID menor.","Devuelve las primeras tres filas. Muestra las columnas id y monto, en ese orden."],guide:[["SELECT · FROM","Elige las columnas e indica de qué tabla salen."],["WHERE · AND","Usa AND cuando todas las condiciones tengan que cumplirse."],["ORDER BY · LIMIT","Ordena el resultado antes de quedarte con sus primeras filas."]],example:L,hint:"Comprueba que tu WHERE considere ciudad, tipo, estado y monto. Usa LIMIT al final.",ai:D,reference:D.replace("  AND monto",`  AND estado = 'confirmada'
  AND monto`),table:"transacciones",columns:["id","ciudad","tipo","estado","monto"],output:["id","monto"],rows:S,variation:[...S.map(([r,...e])=>[350-r,...e]),[222,"Guayaquil","transferencia","confirmada",270]]},{id:"support",label:"Cola de soporte",language:"SQL",company:"Mesa de soporte",title:"Ordena la cola de soporte",intro:"El equipo de soporte quiere ver las solicitudes abiertas que debe atender primero.",requirements:["Incluye solo solicitudes abiertas con prioridad 3 o superior.","Ordena la prioridad de mayor a menor. En empate, pon primero el ID menor.","Muestra las columnas id, asunto y prioridad, en ese orden."],guide:[["SELECT · FROM","Indica cuáles columnas necesitas y de qué tabla vienen."],["WHERE","Las condiciones eligen las filas que aparecerán en tu resultado."],["ORDER BY","Usa DESC para ordenar de mayor a menor y ASC para el sentido contrario."]],example:L,hint:"Puedes indicar dos columnas separadas por una coma en ORDER BY. La segunda resuelve los empates.",ai:w,reference:w.replace("id DESC","id ASC"),table:"solicitudes",columns:["id","asunto","estado","prioridad"],output:["id","asunto","prioridad"],rows:R,variation:[...R.map(([r,...e])=>[330-r,...e]),[235,"Exportar comprobante","abierta",4]]},{id:"withdrawal",label:"Retiros",language:"Python",company:"Banco Horizonte",title:"Valida un retiro",intro:"Escribe una función que decida si se puede retirar un monto y devuelva el saldo correspondiente.",requirements:["Define retirar(saldo, monto). Recibirás dos números enteros y el saldo inicial será mayor o igual a cero.","Devuelve una tupla (código, saldo_final). Si el monto es cero o negativo, devuelve (400, saldo).","Si el monto supera el saldo, devuelve (409, saldo). Si el retiro se puede hacer, devuelve (201, saldo - monto)."],guide:[["def","Define la función con el nombre y los parámetros del encargo."],["if","Comprueba una condición y decide qué resultado corresponde."],["return","Devuelve los dos valores juntos, separados por una coma."]],example:`def revisar_stock(unidades):
    if unidades == 0:
        return ("agotado", unidades)
    return ("disponible", unidades)`,hint:"Comprueba el caso con monto cero y el retiro por el saldo exacto.",ai:A}];[...b.map(r=>({path:r.id,label:r.label}))];const O={transfers:{schema:"id INTEGER UNIQUE, ciudad TEXT, tipo TEXT, estado TEXT, monto INTEGER",filterIssue([,r,e,s,o]){return r!=="Guayaquil"?`es de ${r}. El encargo pide Guayaquil.`:e!=="transferencia"?`es de tipo «${e}». El encargo pide transferencias.`:s!=="confirmada"?`tiene estado «${s}». El encargo pide «confirmada».`:o<100?`tiene un monto de $${o}. El mínimo es $100.`:null},order:(r,e)=>e[4]-r[4]||r[0]-e[0],limit:3,selectionLabel:"Las tres transferencias solicitadas",orderLabel:"Orden por monto e ID"},support:{schema:"id INTEGER UNIQUE, asunto TEXT, estado TEXT, prioridad INTEGER",filterIssue([,,r,e]){return r!=="abierta"?`tiene estado «${r}». El encargo pide solicitudes abiertas.`:e<3?`tiene prioridad ${e}. El mínimo es 3.`:null},order:(r,e)=>e[3]-r[3]||r[0]-e[0],selectionLabel:"Todas las solicitudes elegibles",orderLabel:"Orden por prioridad e ID"}};function N(r){const e=String(r.message||r).slice(0,220),s=/^no such table: (.+)$/.exec(e);if(s)return`No se encontró la tabla «${s[1]}». Revisa el nombre después de FROM.`;const o=/^no such column: (.+)$/.exec(e);if(o)return`No se encontró la columna «${o[1]}». Revisa los nombres y las comillas del texto.`;const a=/^near "(.+)": syntax error$/.exec(e);return a?`Hay un error de sintaxis cerca de «${a[1]}».`:e==="incomplete input"?"La consulta está incompleta.":e}function G(r,e,s,o,a){const t=new r.Database;try{const i=o.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/,"");if(!/^(SELECT|WITH)\b/i.test(i))throw new Error("Escribe una consulta de lectura con SELECT o WITH.");t.run(`CREATE TABLE ${e.table} (${s})`);const d=e.columns.map(()=>"?").join(", "),l=t.prepare(`INSERT INTO ${e.table} VALUES (${d})`);try{for(const f of a)l.run(f)}finally{l.free()}t.run("PRAGMA query_only = ON");const c=t.iterateStatements(o),u=c.next().value,m=(u==null?void 0:u.getColumnNames())??[];if(!m.length)throw new Error("La consulta debe devolver una tabla.");if(m.length>16)throw new Error("La consulta devolvió más de 16 columnas.");const p=[];for(;u.step();){if(p.length>=100)throw new Error("La consulta devolvió más de 100 filas.");p.push(u.get().map(f=>ArrayBuffer.isView(f)?"[binario]":typeof f=="string"?f.slice(0,240):f))}if(!c.next().done)throw new Error("Ejecuta una sola consulta por vez.");return{columns:m,rows:p,error:null}}catch(i){return{columns:[],rows:[],error:N(i)}}finally{t.close()}}function M(r,e,s){if(e.length===0)return"La consulta devolvió cero filas.";if(s<0)return"Incluye la columna id para comprobar los filtros en cada fila.";for(const o of e){if(!o)return"Algún ID o valor devuelto no coincide con los datos de la tabla.";const a=r.filterIssue(o);if(a)return`La fila con ID ${o[0]} ${a}`}return null}function j(r,e,s,o){const a=o.columns.map(n=>n.toLowerCase()),t=a.indexOf("id"),i=o.rows.map(n=>n[t]),d=new Map(s.map(n=>[n[0],n])),l=a.map(n=>r.columns.indexOf(n)),c=o.rows.map((n,g)=>{const v=d.get(i[g]);return v&&l.every((q,B)=>q<0||v[q]===n[B])?v:null}),u=c.length>0&&c.every(Boolean),m=M(e,c,t),p=s.filter(n=>!e.filterIssue(n)).sort(e.order).slice(0,e.limit??s.length),f=new Set(p.map(n=>n[0])),E=new Set(i),y=[...f].filter(n=>!E.has(n)),h=[...E].filter(n=>n!=null&&!f.has(n)),U=t<0?"Incluye la columna id para comparar las filas.":[`Se esperaban ${p.length} filas. La consulta devolvió ${i.length}.`,y.length&&`IDs faltantes (${y.join(", ")}).`,h.length&&`IDs de más (${h.slice(0,6).join(", ")}${h.length>6?", …":""}).`,E.size<i.length&&"Hay IDs repetidos."].filter(Boolean).join(" ");return[["Columnas solicitadas",a.length===r.output.length&&r.output.every((n,g)=>a[g]===n),`Columnas esperadas: ${r.output.join(", ")}.`],["Filtros del encargo",m===null,m??"Todas las filas devueltas cumplen las condiciones."],[e.selectionLabel,u&&i.length===p.length&&E.size===p.length&&y.length===0,U],[e.orderLabel,u&&c.length>1&&c.every((n,g)=>g===0||e.order(c[g-1],n)<=0),"Revisa el orden principal y el sentido del desempate por ID."]]}function _(r,e,s){const o=b.find(l=>l.id===e),a=O[e],t=[o.rows,o.variation].map(l=>{const c=G(r,o,a.schema,s,l);return{...c,checks:j(o,a,l,c)}}),i=t[0],d=i.checks.map(([l,,c],u)=>{const m=t.findIndex(E=>E.error||!E.checks[u][1]);if(m===-1)return{label:l,passed:!0,evidence:c};const p=t[m];return{label:l,passed:!1,evidence:(m===1?"En el segundo conjunto de prueba. ":"")+(p.error??p.checks[u][2])}});return{columns:i.columns,rows:i.rows,checks:d,passed:d.filter(l=>l.passed).length,total:d.length,error:i.error}}self.onmessage=async({data:r})=>{try{const e=b.find(a=>a.id===r.id);let s;if(e.language==="SQL"){importScripts(T);const a=await self.initSqlJs({locateFile:()=>C});s=t=>_(a,e.id,t)}else{const a=await $();a.setStdout({batched:()=>{}}),a.setStderr({batched:()=>{}}),a.runPython(x);const t=a.globals.get("ejecutar_pruebas");s=i=>{const d=JSON.parse(t(i));return d.error?{...d,checks:[],passed:0,total:5}:{...d,passed:d.checks.filter(l=>l.passed).length,total:d.checks.length}}}self.postMessage({phase:"ready"});const o=s(r.code);self.postMessage({user:o,ai:r.compare?s(e.ai):null})}catch(e){self.postMessage({error:String(e.message||e).slice(0,300)})}}})();
