
# WORKSIM

**Entrenamiento y evaluación del criterio profesional en entornos laborales asistidos por IA.**

WORKSIM es una plataforma que busca preparar a estudiantes universitarios para enfrentar situaciones profesionales en las que deben evaluar, cuestionar y tomar decisiones sobre soluciones generadas por inteligencia artificial.

A través de simulaciones de escenarios laborales, los estudiantes enfrentan problemas contextualizados, analizan propuestas de IA, realizan pruebas y justifican sus decisiones mediante evidencias verificables.

## Problema

La creciente incorporación de herramientas de inteligencia artificial en el entorno laboral está transformando la manera en que se realizan las tareas profesionales.

Sin embargo, saber utilizar estas herramientas no garantiza que una persona pueda evaluar correctamente sus resultados. Un estudiante puede obtener una solución aparentemente funcional sin contar con los conocimientos necesarios para reconocer sus errores, limitaciones o riesgos.

Esto plantea una pregunta:

> ¿De qué sirve que la IA te entregue un trabajo si tú no tienes el criterio para seleccionar qué estaría bien?

WORKSIM busca abordar esta brecha mediante experiencias prácticas que permitan desarrollar y evaluar el criterio profesional frente a la IA.

## Propuesta de valor

A diferencia de una interacción convencional con un chatbot, WORKSIM proporciona un entorno de evaluación estructurado donde:

- **Los desafíos son controlados:** escenarios diseñados para explorar problemas y puntos ciegos que el estudiante posiblemente no identificaría por iniciativa propia.
- **La investigación es autónoma:** las soluciones de IA no revelan anticipadamente sus posibles errores.
- **Las decisiones se respaldan con evidencias:** el estudiante puede inspeccionar soluciones, ejecutar pruebas y comprobar sus hipótesis.
- **El desempeño es evaluable:** se registran las decisiones, pruebas, errores detectados y justificaciones para generar retroalimentación estructurada.

## ¿Cómo funciona?

El flujo principal de WORKSIM se compone de seis etapas:

| Etapa | Descripción |
|---|---|
| 1. Desafíos | Selección de una situación profesional simulada. |
| 2. Briefing | Presentación del contexto, rol, objetivos y restricciones. |
| 3. Análisis inicial | Registro del enfoque y razonamiento antes de consultar la IA. |
| 4. Investigación IA | Inspección de una solución generada por IA y formulación de hipótesis. |
| 5. Pruebas y decisión | Validación mediante pruebas, análisis de resultados y toma de decisiones. |
| 6. Informe de desempeño | Retroalimentación basada en las acciones, evidencias y justificaciones del estudiante. |

## Funcionalidades principales

### Banco de desafíos
Repositorio estructurado de escenarios profesionales asociados a competencias, dificultades, requisitos y criterios de evaluación.

### Auditoría de soluciones IA
Entorno para inspeccionar propuestas generadas por inteligencia artificial sin recibir pistas sobre posibles errores.

### Sandbox de pruebas
Espacio de experimentación donde el estudiante puede inspeccionar, modificar y validar soluciones mediante pruebas controladas.

### Evaluación basada en evidencias
Registro de las acciones realizadas durante el desafío para generar informes que expliquen el desempeño del estudiante.

## Alcance actual

WORKSIM es un prototipo funcional de frontend en **React, JavaScript y Vite**, con áreas de Datos, Software y Comunicación. No tiene backend, cuentas ni autenticación. Los borradores, avances e historial se conservan en `localStorage` del navegador; no se sincronizan entre dispositivos.

Los escenarios y las propuestas atribuidas a IA están preparados en el código. **No hay una conexión a un modelo externo ni generación de respuestas de IA en vivo.** Un escenario laboral simulado puede incluir ejecución real de código: son conceptos distintos.

### Ejecución y evaluación disponibles

| Experiencia | Ejecución | Evaluación actual |
|---|---|---|
| «¿Coincide el resultado de la consulta?» — Banco Horizonte | SQL real mediante SQL.js (SQLite en WebAssembly), sobre `transacciones` en memoria. | Comprobaciones deterministas de columnas, IDs seleccionados y orden. |
| «Práctica de SQL y Python»: Transferencias y Cola de soporte | SQL real mediante SQL.js. | Resultados contrastados con dos conjuntos de datos por ejercicio. |
| «Práctica de SQL y Python»: Retiros | Python real mediante Pyodide; se llama a `retirar(saldo, monto)`. | Cinco casos con salida y formato esperados. |
| «Un problema en producción» — Adopta+ | Python real mediante Pyodide, SQLAlchemy y SQLite en memoria; se llama a `list_pets`. | Ocho casos ejecutan la función y comprueban filtros, orden, desempate, paginación y resultados vacíos. Un intento evaluado puede continuar con criterios pendientes. |
| «El informe que no coincide» | Escenario y fuentes preparados; no ejecuta SQL ni Python. | Clasificaciones comparadas con respuestas esperadas; detección heurística de palabras en la omisión escrita. |
| Proyecto «Diagnóstico de ventas» | No ejecuta el SQL ni los archivos del proyecto. | Evidencia estructurada: periodo, duplicados, devoluciones, cálculos e interpretación seleccionada. |
| Proyecto «API de inventario» | Ejecuta únicamente la función de stock en Python con Pyodide. No levanta una API HTTP. | Diez casos de stock más comprobaciones del contrato y ejemplos declarados. |
| Proyecto «Campaña de lanzamiento» | No ejecuta código ni publica una campaña. | Reglas sobre público, objetivo, presupuesto, promesa, cobertura, calendario y métricas. |

Las evaluaciones de proyectos distinguen resultados completos, parciales, incorrectos y sin evidencia. Permiten corregir y volver a entregar, conservando las entregas anteriores. Las explicaciones abiertas requieren revisión cualitativa: cumplir los campos objetivos y escribir una explicación **no demuestra automáticamente que todo el razonamiento sea correcto**. Las evaluaciones históricas se conservan; algunas fueron realizadas con la rúbrica anterior basada en palabras clave.

Consulta [Ejecución y evaluación](docs/ejecucion-y-evaluacion.md) para conocer motores, límites, conexión y archivos responsables.

## Iniciar el proyecto

Necesitas Node.js y npm. Entorno comprobado para este proyecto: Node.js 24.22.1. Desde la raíz del repositorio:

```bash
npm ci
npm run dev
```

Abre la dirección que indique Vite en la terminal. `npm ci` instala las versiones del archivo `package-lock.json` y requiere acceso al registro de paquetes si no están en caché.

```bash
# Pruebas automatizadas existentes
npm test

# Compilar y revisar la compilación localmente
npm run build
npm run preview
```

`npm test` ejecuta las pruebas de Node del repositorio; no abre un navegador ni garantiza que el CDN de Pyodide esté accesible. Para comprobar Python, ejecuta también un ejercicio desde la interfaz.

Vite genera `dist/`. Las entradas son `src/index.html` y `src/practica/index.html`; la segunda redirige a la práctica integrada. Sirve la aplicación por HTTP/HTTPS: abrir el HTML con `file://` no es una forma compatible de iniciar los workers y módulos.

### Conexión y publicación

- SQL.js y su archivo WASM se incluyen localmente desde `vendor/`; no necesitan un CDN externo para ejecutar SQL una vez disponibles los archivos de la aplicación.
- Python carga Pyodide 0.27.7 desde jsDelivr. Adopta+ descarga además SQLAlchemy y SQLite a través de Pyodide. Se necesita conexión al CDN cuando estos recursos no están en caché; no hay garantía de funcionamiento sin conexión.
- Las fuentes Inter y JetBrains Mono se solicitan a Google Fonts. Si no cargan, se usan las fuentes alternativas del CSS.
- Guardar avances y aplicar reglas de evaluación son operaciones locales. No requieren un servicio remoto de evaluación. No hay un modo offline completo implementado.

Para alojamiento estático puede servirse `dist/`. El repositorio también conserva una copia compilada en la raíz: si se publica esa copia, hay que actualizar `index.html`, `practica/index.html` y `assets/` con sus equivalentes de `dist/` en el mismo commit. Subir un commit no habilita por sí solo GitHub Pages: hay que configurar la fuente de publicación y verificar el despliegue. La vista de exportación de proyectos a GitHub es ilustrativa; no crea ni sincroniza repositorios de los estudiantes.

### Estructura frontend

- `src/components/`: controles y elementos reutilizables.
- `src/features/`: vistas, editores, ejecución y resultados.
- `src/data/`: escenarios, datos de práctica y rúbricas.
- `src/lib/`: persistencia, ejecutores y reglas de evaluación.
- `src/practica/`: ejercicios SQL/Python, workers y casos de prueba.
- `vendor/`: motor SQL.js y SQLite WASM incluidos en el repositorio.
- `src/App.jsx`: coordinación del estado y navegación.
- `docs/ejecucion-y-evaluacion.md`: alcance técnico y límites de la evaluación.

`screens.html`, `style-source.html` y `sql-worker.js` en la raíz son referencias del prototipo anterior; no describen por sí solos el comportamiento de la app React actual. Para cambios funcionales, revisa las rutas de `src/` indicadas en la documentación técnica.

## Arquitectura conceptual

La arquitectura propuesta contempla los siguientes componentes:

| Componente | Responsabilidad |
|---|---|
| Knowledge & Scenario Engine | Gestionar competencias, escenarios, requisitos y criterios de evaluación. |
| Challenge Engine | Orquestar los desafíos y las interacciones del estudiante con las soluciones de IA. |
| Evidence & Execution Engine | Gestionar pruebas, ejecuciones y evidencias. |
| Evaluation Engine | Evaluar las decisiones y el desempeño mediante criterios definidos. |
| Competency Analytics | Organizar el historial y los resultados de desempeño. |

Esta arquitectura es conceptual y no implica que los componentes estén implementados como servicios independientes.

## Público objetivo

- **Estudiantes universitarios:** personas que buscan desarrollar criterio y prepararse para sus primeras experiencias profesionales.
- **Instituciones educativas:** organizaciones interesadas en evaluar y fortalecer las competencias profesionales de sus estudiantes.
- **Empresas y reclutadores:** potenciales usuarios de informes estructurados de competencias, sujetos a validación y consentimiento del estudiante.

## Principios de diseño

1. **Criterio antes que automatización:** el estudiante debe comprender y evaluar antes de aceptar una solución.
2. **Evidencia antes que opinión:** las decisiones deben poder justificarse mediante resultados observables.
3. **Aprendizaje mediante la práctica:** los desafíos deben representar situaciones contextualizadas.
4. **Evaluación transparente:** los criterios de evaluación deben ser consistentes y comprensibles.
5. **Autonomía del estudiante:** la plataforma debe facilitar la investigación sin revelar anticipadamente las respuestas.

## Estado del proyecto

<sub>Proyecto en desarrollo · Prototipo de experiencia de usuario</sub>

| Área | Estado |
|---|---|
| Definición del problema y propuesta de valor | En desarrollo |
| Diseño del flujo de usuario | Prototipo |
| Interfaz de desafíos | Prototipo |
| Investigación de soluciones IA | Prototipo |
| Sandbox de pruebas | Ejecución SQL y Python en experiencias específicas; revisión heurística en otras |
| Evaluación basada en evidencias | Reglas deterministas y heurísticas locales; revisión cualitativa pendiente |
| Seguimiento de avances | Historial y progreso local; no certifica competencias |

## Contribuciones

El proyecto puede evolucionar mediante contribuciones en:

- Diseño y validación de escenarios profesionales.
- Diseño UX/UI.
- Desarrollo frontend y backend.
- Integración de modelos de inteligencia artificial.
- Diseño de pruebas automatizadas y mecanismos de evaluación.
- Investigación sobre evaluación de competencias y pensamiento crítico.

## Licencia

La licencia del proyecto está pendiente de definición.

---

*WORKSIM — No se trata de obtener respuestas de la IA, sino de desarrollar el criterio para evaluarlas.*
