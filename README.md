
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

El proyecto se encuentra en etapa de diseño y prototipado.

El prototipo contempla el flujo de experiencia principal, desde la selección de desafíos hasta la presentación del informe de desempeño.
El catálogo incluye «El informe que no coincide», una práctica introductoria de pensamiento crítico con seis etapas propias: briefing, análisis, investigación de fuentes, verificación, decisión e informe. Sus resultados son simulados y se guardan por separado del desafío técnico de Adopta+.

**Importante:** algunas interacciones, ejecuciones de pruebas y resultados mostrados en el prototipo son simulados. No representan todavía un entorno real de ejecución de código ni un sistema de evaluación validado.

## Ejecutar el prototipo

La interfaz está desarrollada con React y Vite. Para iniciar el servidor local:

```bash
npm install
npm run dev
```

Para generar la versión de producción, ejecuta `npm run build`. Las plantillas editables están en `src/index.html` y `src/practica/index.html`. GitHub Pages publica desde la raíz de `main`. Copia `dist/index.html`, `dist/practica/index.html` y los archivos de `dist/assets/` a sus rutas equivalentes en la raíz en el mismo commit.

El flujo de seis etapas y el caso de Adopta+ siguen las pantallas de `screens.html`; el análisis, las hipótesis, el dictamen y la reflexión se guardan en el navegador. El historial y la evidencia se pueden consultar y exportar como JSON.

El sandbox realiza comprobaciones heurísticas sobre el texto del código editado; no ejecuta Python, no modifica bases de datos y no sustituye pruebas reales. El informe muestra los resultados encontrados y recomendaciones relacionadas, sin asignar una calificación automática.

### Estructura frontend

- `src/components/`: elementos reutilizables de navegación, iconografía, campos, tarjetas, avisos y controles.
- `src/features/`: vistas de desafíos, briefing, análisis, investigación, pruebas e informe.
- `src/data/`: escenario, requisitos y esquema usados por el prototipo.
- `src/lib/`: persistencia local y reglas de simulación y retroalimentación.
- `src/App.jsx`: coordina el estado del flujo entre las vistas.

Las funcionalidades previstas para etapas posteriores incluyen:

- Modo de incidentes de producción.
- Desafíos de comunicación y habilidades interpersonales.
- Escenarios de distintas disciplinas profesionales.
- Historial de desempeño y analítica de competencias.
- Reportes para instituciones educativas y organizaciones.

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
| Sandbox de pruebas | Simulación visual |
| Evaluación basada en evidencias | Diseño conceptual |
| Analítica de competencias | Planificada |

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
