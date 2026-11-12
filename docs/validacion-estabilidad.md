# Validación de estabilidad — 12 de noviembre de 2026

## Problemas corregidos

1. Banco Horizonte aceptaba un lote que desactivaba `query_only` y borraba datos de la base temporal. `readOnlySql.js` valida una sola sentencia SELECT/WITH con columnas antes de ejecutarla. Se mantiene el Worker existente y la protección de SQLite.
2. Adopta+ conservaba resultados y la marca de ejecución al cambiar parámetros. Los cambios de código/parámetros eliminan resultados visibles e invalidan la ejecución; se conservan parámetros y código ejecutado en el borrador. Iniciar otra ejecución también invalida el resultado anterior.
3. La finalización de desafíos dependía solo de los botones. `completion.js` valida los requisitos al guardar. Completar la experiencia no exige una puntuación perfecta.
4. Una entrega de proyecto aceptada podía repetirse idéntica otro día y contar como actividad nueva. Se contrasta su contenido con las entregas aceptadas actuales e históricas antes de registrar actividad.
5. La creación del Worker de inventario quedaba fuera del manejo de excepciones. Ahora el fallo de inicialización se captura y restablece el estado; al ejecutar de nuevo se elimina la evidencia de ejecución anterior.
6. El progreso decía «Completados al 100%» y la práctica decía «ejecución opcional» aunque sus condiciones requerían ejecutar. Se ajustaron esos textos al comportamiento real, sin rediseñar las pantallas.

## Archivos

- SQL: `src/lib/readOnlySql.js`, `src/lib/mayraSql.worker.js`, `src/lib/mayraSql.test.js`.
- Vigencia Python: `src/features/PythonExecution.jsx`, `src/features/TestingPage.jsx`, `src/lib/storage.js`, `src/lib/storage.test.js`.
- Progreso: `src/lib/completion.js`, `src/lib/completion.test.js`, `src/App.jsx`, `src/components/ExerciseDecision.jsx`, `src/lib/projects.js`, `src/features/workspaces/ProjectsPage.jsx`.
- Inventario y mensajes: `src/features/projects/ProjectEvidence.jsx`, `src/features/PracticeChallengePage.jsx`, `src/features/workspaces/IndividualWorkspacePage.jsx`.
- Ciclo de Workers: pruebas nuevas en `src/lib/workerLifecycle.test.js`; no se sustituyó la arquitectura.
- Documentación: `docs/ejecucion-y-evaluacion.md` y este informe. Se actualiza también la copia compilada de la aplicación.

## Pruebas y resultados

- `npm test`: **42 pruebas, 42 correctas**. Incluyen evaluación de los tres proyectos, reentregas, persistencia, días consecutivos, duplicados diarios, SQL real y bloqueo del intento de desactivar solo lectura.
- `npm run build`: correcto; Vite genera las entradas, Workers y SQLite WASM. No se modificó la configuración de Vite ni la URL del CDN de Pyodide.
- Chromium sobre compilación de producción, Adopta+: Python válido con resultados específicos para `dog` (IDs 1, 2) y `cat` (IDs 3, 6), error de sintaxis, ValueError y eliminación de resultados al cambiar código o parámetros. El parámetro `cat` y el borrador se conservaron tras recargar. Los errores impidieron finalizar usando una ejecución anterior.
- Chromium, Banco Horizonte: SELECT con filtros y orden devolvió IDs 101, 106, 107; consulta vacía mostró cero filas; sintaxis inválida mostró error; PRAGMA seguido de DELETE fue rechazado; editar eliminó la tabla del resultado anterior.
- Chromium, práctica integrada: ambos casos SQL ejecutaron consultas; `SELECT 1` obtuvo 0/4 criterios y permitió continuar. Retiros ejecutó la función correcta y obtuvo 5/5; editar eliminó el resultado y una sintaxis inválida mostró error.
- Chromium, progreso: finalizar Banco Horizonte con un intento y una decisión justificada registró un desafío y un día de racha. Ambos valores se conservaron después de recargar. Visitar pantallas no añadió actividad.
- Los clientes de Workers se probaron con dobles controlados para éxito, error, cancelación y límites de tiempo de carga/ejecución. Son pruebas de manejo de eventos, no cortes reales de la conexión al CDN.

## Límites y pendientes

- No se simuló un corte real de red/CDN ni un archivo WASM ausente en el navegador. El manejo de errores y timeouts se probó con dobles de Worker. La carga normal de Pyodide y SQLite WASM sí funcionó.
- Persistencia probada con recarga y serialización/deserialización; no se hizo una prueba adicional de cerrar por completo el proceso del navegador y volver a abrirlo.
- La racha en distintas fechas se verificó con fechas controladas en pruebas automatizadas, sin cambiar el reloj del sistema. La prevención de reentregas idénticas se verificó por pruebas automatizadas, incluido el estado restaurado.
- La evaluación abierta mantiene sus límites documentados: Adopta+ conserva criterios heurísticos; la calidad semántica completa de explicaciones de proyectos requiere revisión cualitativa. No hay IA externa.
- localStorage y el reloj local no constituyen un mecanismo antifraude ni sincronización remota.
- El despliegue público debe verificarse por separado de subir el código. La última comprobación de GitHub Pages en la sesión anterior devolvió 404.

No se añadieron ejercicios, áreas, backend, autenticación ni dependencias.
