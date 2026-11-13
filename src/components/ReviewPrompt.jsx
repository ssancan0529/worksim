export default function ReviewPrompt({ question, hint }) {
  if (!question) return null;
  return <section className="exercise-hint">
    <p><strong>Pregunta de revisión guiada</strong> · {question}</p>
    {hint && <details><summary>Ver pista adicional</summary><p>{hint}</p></details>}
  </section>;
}
