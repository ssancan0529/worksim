# Ejecución y evaluación en WORKSIM

Este documento describe la implementación de `src/`. Complementa las instrucciones de inicio del [README](../README.md). No todos los ejercicios ejecutan código y ejecutar sin errores no equivale a resolver correctamente un encargo.

## Motores y experiencias

### SQL: SQLite mediante SQL.js

El motor y el WASM proceden de `vendor/sql-wasm.js` y `vendor/sql-wasm.wasm`. Vite los incorpora a la compilación. No se conecta a una base de datos de una empresa ni a un servidor SQL remoto.

**Banco Horizonte — «¿Coincide el resultado de la consulta?»**

- `src/features/MayraChallengePage.jsx` llama a `runMayraSql()` en `src/lib/mayraSql.js`.
- `src/lib/mayraSql.worker.js` crea `transacciones`, inserta los datos de `src/data/mayra.js` y valida la entrada con `src/lib/readOnlySql.js` antes de ejecutarla con `db.exec()`: una sola sentencia SELECT/WITH que devuelva columnas, con modo de solo lectura activo. Rechaza PRAGMA y lotes de sentencias antes de ejecutarlos.
- Cada llamada tiene una base nueva que se cierra al terminar. El límite de 10 segundos abarca carga y ejecución; al excederlo se termina el worker.
- La interfaz utiliza el primer conjunto de resultados. Sus comprobaciones verifican presencia de columnas, selección de IDs y orden ascendente de IDs. No validan exhaustivamente cada valor calculado de cada columna ni todas las consultas equivalentes posibles.
- Este ejecutor no aplica el límite explícito de 100 filas y 16 columnas del motor de práctica siguiente.

**Práctica — Transferencias y Cola de soporte**

- `src/practica/runExercise.js` crea `src/practica/engines.worker.js`; `src/practica/sql-engine.mjs` ejecuta y comprueba la consulta.
- Usa los datos de `src/practica/cases.mjs`: dos conjuntos por ejercicio para reducir la posibilidad de aprobar una respuesta ajustada a una sola muestra.
- Admite una consulta de lectura que comience por `SELECT` o `WITH` tras comentarios iniciales. Activa `PRAGMA query_only`, exige un único resultado tabular y una sola sentencia, y limita la salida a 100 filas y 16 columnas. Los textos devueltos se recortan a 240 caracteres.
- Comprueba columnas, filtros, selección y orden sobre los resultados. Los nombres solicitados y la columna `id` son relevantes para el evaluador; cambiar alias puede incumplir el contrato aunque SQLite acepte la consulta.
- Tiene hasta 10 segundos para cargar el motor y otros 10 para la evaluación, incluida la comparación con la propuesta preparada cuando se solicita.

**Límites comunes:** es el dialecto SQLite, no PostgreSQL, MySQL ni SQL Server. No hay persistencia de la base entre ejecuciones. Los casos finitos no demuestran corrección para cualquier dato, rendimiento de producción ni seguridad de una consulta. El worker evita ejecutar en el hilo de interfaz y puede terminarse por tiempo, pero no establece una cuota estricta de memoria.

### Python: Pyodide

`src/lib/pyodideRuntime.js` importa Pyodide **0.27.7** desde `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/`. Python se ejecuta realmente en el navegador mediante WebAssembly, dentro de un Web Worker; no se envía a un backend de ejecución de WORKSIM.

| Experiencia | Qué se ejecuta y comprueba | Archivos principales |
|---|---|---|
| Adopta+ | Código del editor y llamada a `list_pets(species, city, limit, offset)`. Se preparan SQLAlchemy y una base SQLite en memoria con 50 mascotas sintéticas. Se muestran salida/errores y resultados serializables. | `src/features/PythonExecution.jsx`, `src/lib/python.worker.js`, `src/lib/pythonSetup.py` |
| Práctica: Retiros | Código que define `retirar(saldo, monto)`. Cinco llamadas verifican saldo suficiente, saldo exacto, saldo insuficiente, cero y monto negativo; se espera una tupla de dos enteros con estado y saldo. | `src/practica/engines.worker.js`, `src/practica/python-cases.py` |
| Proyecto: API de inventario | `mover_stock(stock, cantidad, operacion)`, en un espacio de nombres nuevo por caso. Diez casos comparan aceptación y stock, incluidos rechazos que deben conservar existencias. Se exige un diccionario con `aceptado` booleano y `stock` entero. | `src/features/projects/ProjectEvidence.jsx`, `src/lib/inventoryCheck.py`, `src/data/projectRubrics.js` |

Los ejecutores permiten 90 segundos para inicializar Python y 10 segundos después de la señal de motor listo. El tiempo de ejecución puede incluir varias pruebas o las evaluaciones de usuario y propuesta, según el ejecutor. Al finalizar, cancelar o superar el tiempo, se termina el worker. Una nueva ejecución inicia otro worker; no se conserva una sesión Python de trabajo entre llamadas.

Adopta+ carga los paquetes `sqlalchemy` y `sqlite3` antes de emitir la señal de motor listo. Los casos de retiros y stock no cargan esos paquetes. Adopta+ muestra stdout/stderr; la práctica de retiros los descarta y presenta los casos. El comprobador de stock utiliza los resultados estructurados, no la consola, como evidencia.

**Límites:** Pyodide no es un servidor Python ni un entorno de sistema operativo completo. No se inicia un endpoint HTTP real ni se accede al sistema de archivos del equipo del estudiante como desde Python de escritorio. Las bibliotecas deben ser compatibles con Pyodide y estar disponibles en su entorno; no se instala automáticamente cualquier dependencia importada. Los recursos, memoria y tiempo dependen del navegador. Los workers y los tiempos máximos no constituyen un entorno de seguridad certificado para código hostil. Las pruebas cubren los contratos y muestras indicados, no todos los casos de una API real.

## Ejecución real frente a evaluación

### Adopta+: ejecución y heurística conviven

`PythonExecution` ejecuta Python; si termina sin error llama a `onSuccess`. En `TestingPage` ese callback llega a `runTests` en `src/App.jsx`, que llama a `simulateTests` de `src/lib/simulation.js`.

`simulateTests` **no ejecuta código**: inspecciona su texto con expresiones regulares y posiciones de fragmentos para buscar filtros, orden y validación de paginación. Estos resultados alimentan el informe. Puede reconocer patrones sin que la lógica sea correcta o no reconocer implementaciones equivalentes. La tabla de salida Python es evidencia de ejecución real, pero los indicadores heurísticos no prueban que esa salida satisfaga todos los requisitos. No se deben presentar como una suite ejecutable completa del endpoint.

### «El informe que no coincide»: escenario sin ejecución de código

Las fuentes y afirmaciones del escenario están preparadas en `src/data/scenario.js`. `src/lib/generalChallenge.js` compara la clasificación elegida con la esperada. Para la información omitida busca grupos de palabras relacionados con móvil y soporte. Esta última comprobación es heurística: no comprende automáticamente la justificación ni sus negaciones. No consulta fuentes externas, ejecuta SQL/Python ni llama a un modelo de IA.

### Proyectos: rúbrica determinista y revisión cualitativa

`evaluateProjectSubmission()` en `src/lib/projects.js` usa la rúbrica de `src/data/projectRubrics.js`:

- **Ventas:** valores numéricos y opciones sobre periodo, duplicados, devolución, ingresos, variación e interpretación. La evidencia estructurada se contrasta con el conjunto publicado. No ejecuta el SQL o los archivos entregables del estudiante.
- **Inventario:** verifica códigos de respuesta y resultados declarados, y compara los resultados de diez pruebas Python de stock con el contrato. La ejecución debe corresponder al código actual. No prueba rutas HTTP, almacenamiento de una API desplegada ni concurrencia.
- **Comunicación:** verifica opciones y números del brief, presupuesto permitido, secuencia de días y cálculo de conversión. No comprueba automáticamente la claridad o coherencia semántica de todo el texto libre, ni publica o mide una campaña real.

Los criterios distinguen completo/correcto, parcialmente correcto, incorrecto e insuficiente/sin evidencia. Estos estados se refieren a las comprobaciones objetivas. Para marcar la validación objetiva del proyecto como cumplida, además se exige una explicación no vacía en cada etapa; su mera presencia no valida su calidad. El resultado mantiene `requiresReview: true` y señala lo que necesita revisión cualitativa.

Los borradores pueden corregirse y entregarse nuevamente. La evaluación se guarda con su versión y las reentregas conservan instantáneas anteriores. Cargar un trabajo no recalifica silenciosamente una entrega histórica. La función antigua de palabras clave se conserva solo como compatibilidad para reconstruir entregas antiguas sin evaluación almacenada; no evalúa las nuevas entregas.

Las propuestas de IA, ejemplos de apoyo y recomendaciones son contenido preparado o reglas locales. No hay integración activa con un modelo externo. Ningún resultado certifica competencias profesionales.

## Red, persistencia y diagnóstico

| Función | Requisito de conexión y persistencia |
|---|---|
| Instalar dependencias | `npm ci` necesita el registro de paquetes cuando no están en caché. |
| Abrir la aplicación | Hay que acceder al servidor local o al alojamiento estático y cargar sus recursos. No hay garantía de recarga offline. |
| SQL.js | JS/WASM se sirven con la app; no necesita jsDelivr. Sus bases de práctica son temporales. |
| Pyodide y paquetes | Requieren acceso a jsDelivr si los recursos no están en la caché del navegador. La caché no es un modo offline garantizado. |
| Tipografías | Google Fonts y sus archivos requieren conexión si no están en caché; hay alternativas CSS. |
| Evaluadores y guardado | Reglas ejecutadas en el navegador y estado en `localStorage`; no requieren un modelo o backend. |

El guardado se limita al navegador, perfil y origen usados. Cambiar de dominio o puerto, usar otro dispositivo, borrar datos del sitio o cerrar una sesión privada puede impedir recuperar el progreso. `localStorage` tiene cuota limitada y puede ser restringido por el navegador. El historial/evidencia de desafíos dispone de exportación JSON; no equivale a sincronización remota ni a una copia automática en GitHub.

Si SQL falla al cargar, comprueba que se sirve el directorio compilado completo, incluido el WASM, por HTTP/HTTPS. Si Python no inicia, comprueba la conexión a jsDelivr y posibles bloqueos de red; un timeout de carga no demuestra que el código del estudiante sea incorrecto. Si ya inició y supera los 10 segundos, revisa bucles y trabajo excesivo. La ejecución válida, el cumplimiento de los criterios y el desbloqueo de etapas son estados distintos: no debe inferirse que cualquier texto o cualquier error de sintaxis permita avanzar en todos los ejercicios.

## Verificación y referencias antiguas

`npm test` cubre reglas, persistencia y consultas SQL mediante el motor incluido. No ejecuta automáticamente Pyodide en un navegador ni verifica la disponibilidad de CDN. `npm run build` comprueba que Vite puede compilar la aplicación; tampoco valida todas las respuestas de los ejercicios.

Para comprobar manualmente los motores, abre un caso SQL y ejecuta una consulta válida y otra con error; ejecuta Retiros y Adopta+ para revisar resultados y errores Python; prueba la función de stock y una reentrega de proyecto, y recarga para comprobar persistencia. No introduzcas datos personales reales en los escenarios de prueba.

Los archivos históricos `screens.html`, `style-source.html` y `sql-worker.js` de la raíz no son los ejecutores actuales de React. Los bundles con hash en `assets/` son compilados, no la fuente para describir o modificar el comportamiento. La ruta `practica/index.html` redirige a la práctica integrada, no a una segunda aplicación independiente.


## Actividad y vigencia de resultados

- Abrir secciones no cuenta como actividad. Finalizar un desafío según sus condiciones o entregar un proyecto que cumple la validación objetiva sí cuenta.
- `src/lib/completion.js` comprueba decisiones válidas y justificación antes de finalizar. Adopta+ exige una ejecución vigente; no exige aprobar todos los criterios heurísticos. Banco Horizonte permite un intento parcial y comparación revisada; la práctica integrada conserva sus condiciones propias de ejecución y confianza posterior.
- Editar el código de Adopta+ o cambiar sus parámetros elimina los resultados visibles e invalida la ejecución. Los parámetros se guardan junto al borrador. Iniciar otra ejecución también invalida la anterior, incluso si el nuevo intento falla.
- Una entrega de proyecto idéntica a otra entrega aceptada, actual o histórica, no cuenta nuevamente como actividad. Se compara el contenido de respuestas, evidencia y código; una modificación aceptada sí puede contar. Esto no certifica que el cambio sea sustancial ni evita manipulación de localStorage.
- `activityStreak.js` registra como máximo un día activo por fecha local, mantiene días consecutivos y reinicia tras una interrupción. La racha se conserva en localStorage junto al progreso.
