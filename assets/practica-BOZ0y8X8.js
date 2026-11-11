import"./modulepreload-polyfill-B5Qt9EMX.js";const L="Intermedio-alto",M=`WITH elegidas AS (
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
LIMIT 10 OFFSET 10;`,F=`WITH candidatas AS (
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
ORDER BY puntaje DESC, id ASC;`,te=`def retirar(cuenta_id, monto, solicitud_id):
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
    return 201`,S=[{lines:[5,6],title:"Validación incompleta del monto",explanation:"La comparación con cero admite decimales y True. El contrato exige un entero positivo y excluye los booleanos."},{lines:[7,9,10],title:"Falta comprobar si la solicitud ya se atendió",explanation:"Consulta la clave antes de validar saldo. Una repetición idéntica debe devolver 201 sin un segundo débito, incluso si el saldo quedó en cero."},{lines:[2,11,12],title:"Lectura y actualización fuera de una transacción",explanation:"Dos solicitudes pueden decidir con el mismo saldo. La lectura, el registro y el débito deben quedar dentro de la misma transacción, con reversión si falla la escritura."}],z=`SELECT producto, fecha,
       ROW_NUMBER() OVER (
         PARTITION BY producto ORDER BY fecha DESC
       ) AS posicion
FROM entregas;`,m=[{id:"transfers",engine:"sql",company:"Banco Horizonte",short:"Transferencias",title:"Prioriza las transferencias por cuenta",intro:"El equipo de riesgo revisa una transferencia reciente por cuenta. Prepara la segunda página del reporte de Guayaquil.",requirements:["Filtra las <strong>transferencias</strong> de <strong>Guayaquil</strong> por montos de <strong>$100 o más</strong>.","De las filas que cumplen el filtro, conserva la más reciente por <code>cuenta_id</code>. En empate de <code>fecha</code>, conserva la de <strong>ID mayor</strong>.","Ordena por <code>sospechosa</code> de mayor a menor, luego por <code>monto</code> de mayor a menor y al final por <code>id</code> ascendente. Devuelve la <strong>página 2 de 10 filas</strong>.","Entrega <code>id</code>, <code>cuenta_id</code>, <code>fecha</code>, <code>monto</code> y <code>sospechosa</code>, en ese orden."],guide:[["WHERE","Reduce el conjunto a las filas que pueden competir dentro de cada cuenta."],["ROW_NUMBER()","Numera las filas dentro de cada grupo usando un orden explícito."],["WITH · LIMIT · OFFSET","Divide la consulta en pasos. Pagina cuando el orden final ya esté definido."]],example:z,hint:"Define qué significa «primera» en dos niveles. Dentro de una cuenta manda la fecha. En el reporte global mandan las alertas y el monto.",ai:M,reference:M.replace("ORDER BY monto DESC, id DESC","ORDER BY fecha DESC, id DESC"),dataName:"transacciones",columns:["id","cuenta_id","tipo","ciudad","monto","sospechosa","fecha"],output:["id","cuenta_id","fecha","monto","sospechosa"]},{id:"support",engine:"sql",company:"Mesa de soporte",short:"Cola de soporte",title:"Ordena la cola de soporte",intro:"La supervisora necesita una lista que priorice solicitudes urgentes sin saturar a un solo equipo.",requirements:["Incluye solo solicitudes <strong>abiertas</strong> con prioridad <strong>3 o superior</strong>.","Calcula <code>puntaje = prioridad * 10 + horas_espera</code>.","Conserva hasta <strong>dos solicitudes por equipo</strong> con mayor puntaje. En caso de empate, elige el <strong>ID menor</strong>.","Ordena el resultado completo por <code>puntaje</code> descendente e <code>id</code> ascendente. Muestra <code>id</code>, <code>asunto</code>, <code>equipo</code> y <code>puntaje</code>, en ese orden."],guide:[["SELECT · FROM · WHERE","Elige los datos, calcula columnas y filtra las solicitudes elegibles."],["PARTITION BY","Una función de ventana puede reiniciar el conteo al cambiar de equipo."],["ORDER BY","Una columna adicional desempata cuando dos filas tienen el mismo puntaje."]],example:z,hint:"Una numeración por equipo permite limitar la cantidad de filas. Comprueba qué ocurre si tres solicitudes empatan en el segundo puesto.",ai:F,reference:F.replace("RANK()","ROW_NUMBER()").replace("PARTITION BY equipo ORDER BY puntaje DESC","PARTITION BY equipo ORDER BY puntaje DESC, id ASC"),dataName:"solicitudes",columns:["id","asunto","equipo","estado","prioridad","horas_espera"],output:["id","asunto","equipo","puntaje"]},{id:"withdrawal",engine:"python",company:"Banco Horizonte",short:"Retiros",title:"Protege el registro de retiros",intro:"Dos solicitudes pueden usar el mismo saldo. Implementa una función que también resista reintentos y fallos de escritura.",requirements:["Implementa <code>retirar(cuenta_id, monto, solicitud_id)</code>. Devuelve <strong>400</strong> si el monto no es un entero positivo. <code>True</code> y <code>False</code> no cuentan como montos.","Devuelve <strong>404</strong> si la cuenta no existe y <strong>409</strong> si no hay saldo suficiente.","Si la clave de solicitud ya existe en esa cuenta, devuelve <strong>201</strong> cuando el monto coincide, incluso con saldo cero. Devuelve <strong>409</strong> si el monto cambió. En ambos casos, evita un nuevo débito.","Por un retiro nuevo, registra la solicitud, actualiza el saldo y devuelve <strong>201</strong>. Si una escritura falla con <code>RuntimeError</code>, revierte la operación y devuelve <strong>503</strong>."],guide:[["Validación","Comprueba tipos y límites antes de cambiar el estado."],["Idempotencia","Un reintento de la misma solicitud debe devolver el mismo resultado sin repetir el efecto."],["Transacción","Agrupa la lectura y las escrituras. Deja salir el error del bloque para que se revierta la operación."]],example:`try:
    with inventario.transaccion():
        inventario.actualizar_existencias()
except RuntimeError:
    registrar_incidencia()`,hint:"Piensa qué debería pasar cuando la primera solicitud dejó saldo cero y el cliente repite la misma clave.",ai:te,methods:[["db.transaccion()","Úsalo con with. Serializa las operaciones y revierte sus cambios si sale una excepción."],["db.buscar_cuenta(cuenta_id)","Devuelve un dict con id y saldo, o None."],["db.buscar_retiro(cuenta_id, solicitud_id)","Devuelve el monto registrado para esa clave, o None."],["db.registrar_retiro(cuenta_id, monto, solicitud_id)","Registra el movimiento y la clave."],["db.guardar_cuenta(cuenta)","Persiste el saldo actualizado del diccionario."]]}];function oe(e){return Array.from({length:28},(a,t)=>{const o=1e3+e*1e3+(t*17+e*3)%28*10,n=200+e*100+t,r=`2026-10-${String(8+(t*5+e*3)%20).padStart(2,"0")}`,u=100+(t*17+e*7)%8*25,p=[[o+1,n,"transferencia","Guayaquil",u+(t%3?75:0),1,"2026-10-02"],[o+2,n,"transferencia","Guayaquil",u,+((t+e)%3!==1),r]];t%4===e&&p.push([o+4,n,"transferencia","Guayaquil",u,1,r]);const y=[["retiro","Guayaquil",700],["transferencia","Quito",700],["transferencia","Guayaquil",99]][(t+e)%3];return[[o+9,n,...y,1,"2026-10-31"],...p.reverse()]}).reverse().flat()}const se=[[108,"Acceso al portal","Accesos","abierta",5,6],[106,"Restablecer contraseña","Accesos","cerrada",5,18],[102,"Error al descargar reporte","Reportes","abierta",3,9],[104,"Permisos de facturación","Pagos","abierta",2,30],[101,"Inicio de sesión bloqueado","Accesos","abierta",5,6],[107,"Actualizar correo","Reportes","cerrada",3,22],[103,"Pago duplicado","Pagos","abierta",4,15],[105,"Cambiar foto de perfil","Accesos","abierta",1,25],[110,"Error de autenticación","Accesos","abierta",5,12],[112,"Exportar reporte","Reportes","abierta",4,8],[111,"Conciliar depósito","Pagos","abierta",3,25],[114,"Confirmar devolución","Pagos","abierta",5,5],[109,"Informe incompleto","Reportes","abierta",3,18]];function ne(e){return se}function q(e){return Number.isInteger(e)&&e>=1&&e<=5}function O(e){const a=[...new Set(e)],t=S.filter(n=>n.lines.some(i=>a.includes(i))).length,o=a.filter(n=>!S.some(i=>i.lines.includes(n))).length;return{hits:t,total:S.length,extra:o,precision:t+o?Math.round(100*t/(t+o)):null,status:o>=3?"excess":t?"valid":"no-hits"}}function E(e){return e.step===m.length+1&&q(e.before)&&q(e.after)&&m.every(({id:a})=>!!e.attempts[a].comparison)}const c=document.querySelector("#main"),w=document.querySelector("#announcement"),I="worksim-banco-test-draft-v1",P="worksim-banco-test-records-v1",ie=["Nada seguro/a","Poco seguro/a","Algo seguro/a","Bastante seguro/a","Muy seguro/a"],re=["Mi consulta","La de la IA","Ninguna cumple del todo","No estoy seguro/a"],le=["Cómodo/a","Normal","Presionado/a"],j=m.length+1;let R=!1,d="",f=null;function x(e,a){try{return JSON.parse(localStorage.getItem(e))??a}catch{return R=!0,a}}function A(e,a){try{a===null?localStorage.removeItem(e):localStorage.setItem(e,JSON.stringify(a)),R=!1}catch{R=!0}}function U(e=""){return{code:e,initialCode:null,pick:"",differences:"",lines:[],none:!1,hypothesis:"",lastResult:null,comparison:null,predictionLocked:!1,runs:[]}}function Y(){return{version:2,id:crypto.randomUUID(),startedAt:new Date().toISOString(),step:0,before:null,after:null,feel:"",note:"",attempts:Object.fromEntries(m.map(e=>[e.id,U()]))}}function ce(e){if(!e||e.version===2)return e;const a=Y();return a.id=e.id,a.startedAt=e.startedAt,a.before=e.before,a.feel=e.feel,a.note=e.note,a.step=q(e.before)?1:0,a.attempts.transfers=U(e.query||""),a.attempts.transfers.differences=e.differences||"",a.attempts.withdrawal.hypothesis=e.hypothesis||"",a.migrated=!!e.query,a}const H=x(I,null);let s=ce(H),$=x(P,[]);s&&s!==H&&A(I,s);const l=e=>String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a]),C=e=>`<pre class="code"><code>${l(e)}</code></pre>`,Q='<span aria-hidden="true">→</span>',v=(e,a)=>`<div class="metric"><strong>${l(e)}</strong><span>${l(a)}</span></div>`,D=()=>m[s.step-1],b=()=>s.attempts[D().id],g=()=>A(I,s);function de(e){return new Intl.DateTimeFormat("es-EC",{dateStyle:"medium",timeStyle:"short"}).format(new Date(e))}function ue(e){const a=e.detection,t=r=>r.error?"Error de ejecución":`${r.passed}/${r.total}`,o=e.support?` · Soporte ${t(e.support.user)}`:"",n=e.python.user?`Python ${t(e.python.user)}${e.python.user.error?"":" pruebas"}`:`Python ${a.hits}/${a.total} hallazgos`,i=a.status==="excess"?" · Auditoría no validada":"";return`SQL ${t(e.sql.user)}${o} · ${n}${i} · Seguridad ${e.before} → ${e.after}`}function pe(){return`
    <section class="portal-intro">
      <a class="secondary catalog-link" href="../#available-challenges">← Volver a desafíos</a>
      <div class="eyebrow">PORTAL DE PRÁCTICA</div>
      <h1 tabindex="-1">Revisa código de IA<br class="wide"> con pruebas reales</h1>
      <p>Escribe tu solución, contrástala con una propuesta de IA y comprueba tu decisión con casos de prueba.</p>
    </section>
    <div class="portal-grid">
      <section class="mission panel">
        <div class="mission-top">
          <span class="mission-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span class="mission-meta">DATOS Y ANÁLISIS</span>
        </div>
        <h2>Práctica de SQL y Python</h2>
        <p>Resuelve tres encargos en Banco Horizonte y en la mesa de soporte.</p>
        <ul class="tags"><li>SQL</li><li>Python</li><li>${L}</li></ul>
        <button class="primary" id="start">${$.length?"Iniciar otra práctica":"Iniciar práctica"} ${Q}</button>
      </section>
      <aside class="route panel" aria-labelledby="route-title">
        <h2 id="route-title">Ejercicios de la práctica</h2>
        <ol>${m.map((e,a)=>`<li><span class="route-number">${a+1}</span>
          <div><strong>${e.title}</strong><p>${e.engine==="sql"?"SQL":"Python"}</p></div></li>`).join("")}</ol>
      </aside>
    </div>
    ${$.length?`<section class="panel history"><h2>Intentos completados</h2>
      <ul>${[...$].reverse().map(e=>`<li><div><strong>${l(de(e.completedAt))}</strong>
        <span>${l(ue(e))}</span></div>
        <button class="secondary" data-export="${l(e.id)}">Descargar resultados</button></li>`).join("")}</ul>
      </section>`:""}
    <p class="privacy-note">Tus respuestas se guardan en este navegador. Puedes descargar un resumen para compartirlo.</p>`}function me(){return`<nav class="progress" aria-label="Progreso de la práctica"><ol>
    ${["Inicio",...m.map(a=>a.short),"Cierre"].map((a,t)=>`<li class="${t===s.step?"current":t<s.step?"complete":""}" ${t===s.step?'aria-current="step"':""}>
      <span class="step-circle" aria-hidden="true">${t<s.step?"✓":t+1}</span><span>${a}</span>
    </li>`).join("")}
  </ol></nav>`}function V(e){return`<div class="scale">${ie.map((a,t)=>`<label>
    <input type="radio" name="${e}" value="${t+1}" ${s[e]===t+1?"checked":""} aria-label="${t+1} de 5, ${a}">
    <span>${t+1}</span>
  </label>`).join("")}</div>
  <div class="scale-ends"><span>Nada seguro/a</span><span>Muy seguro/a</span></div>`}function G(e,a,t){return`<div class="options">${a.map(o=>`<label class="option">
    <input type="radio" name="${e}" value="${l(o)}" ${t===o?"checked":""}>
    <span>${l(o)}</span></label>`).join("")}</div>`}function T(e,a,t){return`<label class="field" for="${e}">${a}</label>
    <textarea id="${e}" data-bind="${e}" maxlength="1600" rows="3">${l(t)}</textarea>`}function K(e,a,t){return`<div class="lab-table" tabindex="0" role="region" aria-label="${l(t)}">
    <table><thead><tr>${e.map(o=>`<th scope="col">${l(o)}</th>`).join("")}</tr></thead>
    <tbody>${a.map(o=>`<tr>${o.map(n=>`<td>${n===null?"NULL":l(n)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`}function fe(e){let a;if(e.engine==="sql"){const t=e.id==="support"?ne():oe(0).slice(0,8);a=`<div class="lab-data"><h3>Tabla <code>${e.dataName}</code></h3>
      <p class="small">${e.id==="support"?`${t.length} filas de práctica`:"Muestra de 8 filas · sospechosa vale 1 o 0"}</p>
      ${K(e.columns,t,`Datos de ${e.dataName}`)}</div>`}else a=`<div class="lab-data"><h3>Métodos disponibles en <code>db</code></h3>
      <dl class="lab-methods">${e.methods.map(([t,o])=>`<div><dt><code>${l(t)}</code></dt><dd>${l(o)}</dd></div>`).join("")}</dl></div>`;return`<section class="panel lab-brief"><div class="lab-requirements"><h2>Tu encargo</h2>
    <ul>${e.requirements.map(t=>`<li>${t}</li>`).join("")}</ul></div>${a}</section>`}function be(e){return`<details class="panel lab-guide" data-panel="guide-${e.id}" open>
    <summary><span class="lab-help-icon" aria-hidden="true">?</span> Guía rápida de ${e.engine==="sql"?"SQL":"Python"}</summary>
    <div class="lab-guide-body"><dl>${e.guide.map(([a,t])=>`<div><dt>${l(a)}</dt><dd>${l(t)}</dd></div>`).join("")}</dl>
    ${C(e.example)}</div></details>`}function J(e,a){if(!e)return'<p class="small">Ejecuta tu código para comprobar los requisitos.</p>';if(e.error)return`<p class="error" role="status">${l(e.error)}</p>`;const t=e.passed===e.total,o=n=>{const i=n.withdrawals.map(([u,p,y])=>`${u}/${y}: $${p}`).join(", ")||"ninguno",r=Object.entries(n.balances).map(([u,p])=>`${u}: $${p}`).join(", ")||"sin cuenta";return`Códigos ${n.codes.join(", ")||"—"} · Retiros ${i} · Saldos ${r}`};return`<div class="lab-result-status">
      <span class="badge ${t?"pass":"score"}">${e.passed} de ${e.total} pruebas</span>
      ${a==="sql"?`<span class="small">${e.rowCount===1?"1 fila devuelta":`${e.rowCount} filas devueltas`}</span>`:""}
    </div>
    ${a==="sql"&&e.rows.length?K(e.columns,e.rows,"Filas devueltas"):""}
    ${a==="sql"&&e.rowCount>e.rows.length?'<p class="small">Se muestran las primeras 25 filas.</p>':""}
    <ul class="checks">${e.checks.map(n=>`<li>
      <div class="check-line"><strong>${l(n.label)}</strong>
        <span class="badge ${n.passed?"pass":"fail"}">${n.passed?"Pasa":"Por revisar"}</span></div>
      <details><summary>Ver evidencia</summary>${a==="sql"?n.evidence.map(i=>`<p>${l(i)}</p>`).join(""):`<p><strong>Esperado</strong> · ${l(o(n.expected))}</p>
           <p><strong>Obtenido</strong> · ${l(o(n.observed))}</p>`}</details>
    </li>`).join("")}</ul>`}function ge(e,a){const t=e.engine==="sql";return`<section class="panel lab-editor"><div class="result-title">
    <h2><label for="code-editor">${t?"Tu consulta":"Tu función"}</label></h2>
    <span class="small lab-engine"><i aria-hidden="true"></i>${t?"SQLite":"Python"}</span></div>
    <div class="lab-code">
      <div class="lab-file" aria-hidden="true">&lt;/&gt; &nbsp; ${t?"consulta.sql":"retiros.py"}</div>
      <div class="lab-code-body"><div class="lab-gutter" aria-hidden="true"><pre id="line-numbers">1</pre></div>
        <textarea id="code-editor" data-bind="code" rows="8" maxlength="6000" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off"
          ${d?"readonly":""} placeholder="${t?"Escribe tu consulta SQL aquí…":"def retirar(cuenta_id, monto, solicitud_id):"}">
${l(a.code)}</textarea></div>
    </div>
    <div class="lab-editor-actions">
      <button type="button" class="primary" id="run-code" ${!a.code.trim()||d?"disabled":""}><span class="lab-play" aria-hidden="true"></span>${d==="code"?"Ejecutando…":t?"Ejecutar consulta":"Ejecutar Python"}</button>
      <span class="lab-shortcut small" aria-hidden="true"><kbd>${/Mac|iPhone|iPad/.test(navigator.platform)?"⌘":"Ctrl"}</kbd> + <kbd>↵</kbd></span>
      <details class="lab-hint" data-panel="hint-${e.id}"><summary>Ver pista</summary><p>${l(e.hint)}</p></details>
    </div></section>`}function he(e,a){const t=!!a.comparison;return`<div class="code code-lines" aria-label="Código Python de la IA">${e.ai.split(`
`).map((o,n)=>{const i=n+1,r=a.lines.includes(i),u=S.some(y=>y.lines.includes(i)),p=`<span class="line-num" aria-hidden="true">${i}</span><code>${l(o)}</code>`;return t||a.predictionLocked?`<div class="code-line ${t?r?u?"hit":"extra":u?"relevant":"":r?"selected":""}">${p}</div>`:`<button type="button" class="code-line ${r?"selected":""}" aria-pressed="${r}" data-line="${i}" aria-label="Línea ${i}: ${l(o.trim())}">${p}</button>`}).join("")}</div>`}function $e(e){const a=O(e.lines),t=a.status==="excess"?"Detección no validada por exceso de líneas adicionales.":a.status==="valid"?"Detección validada.":"No se detectaron problemas.";return`<section class="panel result-card"><h2>Tu auditoría</h2>
    <div class="metric-row">${v(`${a.hits}/${a.total}`,"Problemas")}${v(a.extra,"Líneas extra")}
      ${v(a.precision===null?"—":`${a.precision}%`,"Precisión")}</div>
    <p class="${a.status==="excess"?"error":"small"}">${t}</p>
    <ul class="lab-findings">${S.map(o=>`<li><strong>${l(o.title)}.</strong> ${l(o.explanation)}</li>`).join("")}</ul>
  </section>`}function ye(e,a){return a.comparison?`<div class="lab-compare-feedback"><section class="panel result-card">
    <h2 tabindex="-1">Resultado de la IA</h2>${J(a.comparison.ai,e.engine)}
    </section>${e.engine==="python"?$e(a):`<section class="panel result-card">
      <h2>Revisa tu consulta</h2><details data-panel="solution-${e.id}"><summary>Ver una solución posible</summary>
      ${C(e.reference)}</details></section>`}</div>`:""}function k(e,a){return!d&&!!a.code.trim()&&(e.engine==="sql"?!!a.pick:a.lines.length>0||a.none)}function ve(e,a){if(a.initialCode===null)return`<section class="panel lab-compare-closed" aria-labelledby="compare-title">
    <div><h2 id="compare-title">Compara con la IA</h2><p class="small">Escribe tu primera solución para ver la propuesta.</p></div>
    <button class="secondary" id="reveal" ${!a.code.trim()||d?"disabled":""}>Ver propuesta de la IA</button></section>`;const t=e.engine==="python",o=d||a.predictionLocked;return`<section class="panel flow-card lab-ai" aria-labelledby="compare-title">
    <h2 id="compare-title" tabindex="-1">${t?"Audita la función de la IA":"Compara con la IA"}</h2>
    <div class="comparison"><section><h3>Tu primer código</h3>${C(a.initialCode)}</section>
    <section><h3>Propuesta de la IA</h3>${t?he(e,a):C(e.ai)}</section></div>
    <fieldset ${o?"disabled":""}>
      <legend>${t?"Marca las líneas que revisarías en la función de la IA.":"¿Cuál crees que cumple mejor el encargo?"}</legend>
      ${t?`<button class="secondary" type="button" id="none" aria-pressed="${a.none}">No veo ningún problema</button>
        ${T("hypothesis","¿En qué caso fallaría? (opcional)",a.hypothesis)}`:`${G("pick",re,a.pick)}${T("differences","¿Qué diferencia encontraste? (opcional)",a.differences)}`}
    </fieldset>
    <button class="primary" id="run-comparison" ${k(e,a)?"":"disabled"}>
      ${d==="comparison"?"Ejecutando comparación…":a.comparison?"Volver a ejecutar ambas soluciones":"Ejecutar ambas soluciones"}</button>
    ${d==="comparison"?'<p class="small" role="status">Ejecutando tu código y la propuesta de IA…</p>':""}
    ${(f==null?void 0:f.target)==="comparison"?`<p class="error" role="alert">${l(f.message)}</p>`:""}
  </section><div id="compare-feedback">${ye(e,a)}</div>`}function N(){return d?!1:s.step?s.step===j?E(s):!!b().comparison:q(s.before)}function _(){const e=s.step===j,a=N(),t=s.step?e?"Volver al portal":s.step===m.length?"Ir al cierre":"Ir al siguiente ejercicio":"Empezar";return`<div class="actions"><p class="small" id="step-hint">${s.step?e?a?"Tu seguridad posterior está registrada.":"Elige tu seguridad posterior para volver al portal.":a?"La comparación quedó registrada.":"Ejecuta la comparación para continuar.":"Selecciona un número para empezar."}</p>
    <button class="primary" id="next" ${a?"":"disabled"} aria-describedby="step-hint">${t} ${Q}</button></div>`}function Se(e){const a=b();return`<section class="lab-hero" aria-labelledby="exercise-title">
    <div><p class="eyebrow">${e.company} <span aria-hidden="true">/</span> ${L}</p>
    <h1 id="exercise-title" tabindex="-1">${e.title}</h1><p class="lede">${e.intro}</p></div>
    <div class="lab-hero-icon" aria-hidden="true"><i></i><i></i><i></i></div>
    </section>
    ${s.migrated&&s.step===1?'<p class="status">Recuperamos tu consulta anterior. Revisa el encargo actualizado antes de ejecutar.</p>':""}
    ${be(e)}
    <div class="lab-grid">${fe(e)}<div class="lab-workspace">${ge(e,a)}
      <section class="panel result-card lab-result"><h2 id="result-title" tabindex="-1">Resultado</h2>
      <div id="work-result" aria-live="polite" aria-busy="${!!d}">${d?'<p class="small">Ejecutando casos de prueba…</p>':(f==null?void 0:f.target)==="code"?`<p class="error" role="alert">${l(f.message)}</p>`:J(a.lastResult,e.engine)}</div></section>
    </div></div>
    ${ve(e,a)}${_()}`}function Ee(){return`<section class="flow-head"><p class="eyebrow">PRÁCTICA DE WORKSIM</p><h1 tabindex="-1">Antes de empezar</h1></section>
    <div class="flow-stack">
    <section class="panel flow-card"><h2>Tu encargo</h2><p>Prepara dos consultas SQL y una función de Python. Después de escribir cada solución, revisa la propuesta de IA y ejecuta ambas con los mismos casos de prueba.</p></section>
    <fieldset class="panel flow-card"><legend class="sr-only">Seguridad inicial</legend>
    <h2>¿Qué tan seguro/a te sientes revisando código generado por IA?</h2>${V("before")}</fieldset>${_()}</div>`}function Re(){const e=O(s.attempts.withdrawal.lines);return`<section class="flow-head"><p class="eyebrow">PRÁCTICA DE WORKSIM</p><h1 tabindex="-1">Cierra tu práctica</h1></section>
    <div class="flow-stack">
    <fieldset class="panel flow-card"><legend class="sr-only">Seguridad posterior</legend>
    <h2>¿Qué tan seguro/a te sientes ahora revisando código generado por IA?</h2>
    <p>Selecciona una respuesta para terminar la práctica.</p>${V("after")}</fieldset>
    <fieldset class="panel flow-card"><legend class="sr-only">Comentarios de la práctica</legend>
    <h2>¿Cómo te sentiste durante la práctica? (opcional)</h2>
    ${G("feel",le,s.feel)}${T("note","¿Algo te confundió durante el test? (opcional)",s.note)}</fieldset>
    <section class="panel flow-card"><h2>Resumen de tu intento</h2>
    <div class="metric-row">${m.map(a=>{const t=s.attempts[a.id].comparison.user;return v(t.error?"Error":`${t.passed}/${t.total}`,a.short)}).join("")}${v(`${e.hits}/${e.total}`,"Hallazgos de Python")}
      ${v(`${s.before} → ${s.after??"—"}`,"Seguridad antes y después")}</div>
    ${e.status==="excess"?'<p class="error">Detección de Python no validada por exceso de líneas adicionales.</p>':""}
    <div class="buttons"><button class="secondary" id="copy" ${E(s)?"":"disabled"}>Copiar resumen</button>
      <button class="secondary" id="export" ${E(s)?"":"disabled"}>Descargar resultados</button></div>
    <p class="small">El archivo incluye tus respuestas y la evidencia de las pruebas.</p></section>${_()}</div>`}function X(){const e=c.querySelector("#code-editor");e&&(c.querySelector("#line-numbers").style.transform=`translateY(-${e.scrollTop}px)`)}function Z(){const e=c.querySelector("#code-editor");if(!e)return;const a=e.value.split(`
`).length;c.querySelector("#line-numbers").textContent=Array.from({length:a},(t,o)=>o+1).join(`
`),X()}function h(e=""){var n;const a=new Map([...c.querySelectorAll("details[data-panel]")].map(i=>[i.dataset.panel,i.open]));let t=pe;s&&(t=s.step===0?Ee:s.step===j?Re:()=>Se(D())),c.innerHTML=(s?me():"")+t();for(const i of c.querySelectorAll("details[data-panel]"))a.has(i.dataset.panel)&&(i.open=a.get(i.dataset.panel));const o=c.querySelector("#code-editor");o&&(o.addEventListener("scroll",X),Z()),R&&c.insertAdjacentHTML("beforeend",'<p class="error" role="status">Este navegador no pudo guardar el intento. Descarga tus resultados antes de salir.</p>'),e&&((n=c.querySelector(e))==null||n.focus({preventScroll:e==="h1"}),e==="h1"&&window.scrollTo(0,0))}function qe(e,a,t){return new Promise((o,n)=>{const i=new Worker(new URL(""+new URL("engines.worker-DegjBJzl.js",import.meta.url).href,import.meta.url));let r=setTimeout(()=>{u(),n(new Error("El motor tardó demasiado en cargar. Vuelve a intentar."))},e.engine==="sql"?1e4:9e4);function u(){clearTimeout(r),i.terminate()}i.onmessage=({data:p})=>{if(p.phase==="ready"){clearTimeout(r),r=setTimeout(()=>{u(),n(new Error("La ejecución tardó demasiado. Revisa el código y vuelve a intentar."))},1e4);return}u(),p.error?n(new Error(p.error)):o(p)},i.onerror=()=>{u(),n(new Error("No se pudo iniciar el motor de pruebas. Vuelve a intentar."))},i.postMessage({id:e.id,code:a,compare:t})})}async function ee(e,a=!1){const t=D(),o=b();if(d||!o.code.trim()||e&&!k(t,o))return;const i=c.querySelector("#code-editor").selectionStart;d=e?"comparison":"code",f=null,h();try{const r=await qe(t,o.code,e);o.lastResult=r.user,e&&(o.comparison=r,o.predictionLocked=!0),o.runs.push({at:new Date().toISOString(),comparedWithAI:e,passed:r.user.passed??0,total:r.user.total??null,error:r.user.error??null}),g(),w.textContent=r.user.error?"Revisa el mensaje de ejecución.":`Tu código pasó ${r.user.passed} de ${r.user.total} pruebas.`}catch(r){f={target:d,message:r.message}}finally{d="",h(e?f?"#run-comparison":"#compare-feedback h2":a?"#code-editor":"#result-title"),a&&c.querySelector("#code-editor").setSelectionRange(i,i)}}function B(){const e=s.attempts,a=o=>{const n=e[o.id];return{query:n.code,initialQuery:n.initialCode,aiQuery:o.ai,initialComparison:n.pick,differences:n.differences,runs:n.runs,...n.comparison}},t=e.withdrawal;return{id:s.id,mission:"Práctica de SQL y Python",version:2,level:L,startedAt:s.startedAt,completedAt:new Date().toISOString(),before:s.before,after:s.after,confidenceChange:s.after-s.before,sql:a(m[0]),support:a(m[1]),python:{source:m[2].ai,code:t.code,initialCode:t.initialCode,markedLines:[...t.lines].sort((o,n)=>o-n),noIssueSelected:t.none,hypothesis:t.hypothesis,runs:t.runs,...t.comparison.ai,user:t.comparison.user},detection:O(t.lines),feel:s.feel,note:s.note}}function W(e){const a=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),t=URL.createObjectURL(a),o=document.createElement("a");o.href=t,o.download=`WORKSIM-${e.id.slice(0,8)}.json`,o.click(),setTimeout(()=>URL.revokeObjectURL(t),1e3)}async function we(){const e=B(),a=i=>i.error?"error de ejecución":`${i.passed}/${i.total} pruebas`,t=m.map(i=>{const r=s.attempts[i.id],{user:u,ai:p}=r.comparison;return`${i.title}
Mi código: ${a(u)} · IA: ${a(p)}
${r.code}`}),o=e.detection,n=["WORKSIM · Práctica de SQL y Python",`Seguridad antes y después: ${e.before} → ${e.after} de 5`,...t,`Auditoría Python: ${o.hits}/${o.total} hallazgos · ${o.extra} líneas extra${o.status==="excess"?" · Detección no validada":""}`,`Comentario: ${e.note||"—"}`].join(`

`);try{await navigator.clipboard.writeText(n),w.textContent="Resumen copiado.",c.querySelector("#copy").textContent="Resumen copiado"}catch{w.textContent="No se pudo copiar. Puedes descargar los resultados.",c.querySelector("#copy").textContent="No se pudo copiar"}}function Ae(){if(N()){if(s.step===j){const e=B();$=[...x(P,$).filter(a=>a.id!==e.id),e],A(P,$),R||A(I,null),s=null,w.textContent="Práctica finalizada."}else s.step+=1,g();f=null,h("h1")}}function ae(){const e=c.querySelector("#code-editor");if(c.querySelector("#next").disabled=!N(),!e)return;const a=b();c.querySelector("#run-code").disabled=!a.code.trim();const t=c.querySelector("#reveal");t&&(t.disabled=!a.code.trim());const o=c.querySelector("#run-comparison");o&&(o.disabled=!k(D(),a))}c.addEventListener("input",({target:e})=>{const a=e.dataset.bind;if(!(!s||!a||d)){if(a==="note")s.note=e.value;else{const t=b();if(t[a]=e.value,a==="code"){if(t.lastResult||t.comparison){t.lastResult=null,t.comparison=null,c.querySelector("#work-result").innerHTML='<p class="small">Ejecuta el código editado para actualizar el resultado.</p>';const o=c.querySelector("#compare-feedback");o&&o.replaceChildren(),c.querySelector("#step-hint").textContent="Ejecuta la comparación con el código editado para continuar."}Z()}}g(),ae()}});c.addEventListener("change",({target:e})=>{if(!(!s||e.type!=="radio"||d)){if(e.name==="pick"){b().pick=e.value,g(),ae();return}s[e.name]=["before","after"].includes(e.name)?Number(e.value):e.value,g(),h(`input[name="${e.name}"][value="${CSS.escape(e.value)}"]`)}});c.addEventListener("keydown",e=>{e.target.id==="code-editor"&&e.key==="Enter"&&(e.ctrlKey||e.metaKey)&&(e.preventDefault(),ee(!1,!0))});c.addEventListener("click",async({target:e})=>{const a=e.closest("button");if(!(!a||d)){if(a.id==="start")s=Y(),g(),h("h1");else if(a.id==="next")Ae();else if(a.id==="run-code"||a.id==="run-comparison")await ee(a.id==="run-comparison");else if(a.id==="reveal")b().initialCode=b().code,g(),h("#compare-title");else if(a.dataset.line||a.id==="none"){const t=b();if(t.predictionLocked)return;if(a.dataset.line){const o=Number(a.dataset.line);t.lines=t.lines.includes(o)?t.lines.filter(n=>n!==o):[...t.lines,o],t.none=!1}else t.none=!t.none,t.lines=[];g(),h(a.id?"#none":`[data-line="${a.dataset.line}"]`)}else if(s&&E(s)&&a.id==="copy")await we();else if(s&&E(s)&&a.id==="export")W(B());else if(a.dataset.export){const t=$.find(o=>o.id===a.dataset.export);t&&W(t)}}});h();
