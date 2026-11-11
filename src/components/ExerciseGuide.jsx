import { useState } from "react";
import Icon from "./Icon";

export default function ExerciseGuide({ items, example, exampleIsCode = false }) {
  const [open, setOpen] = useState(true);

  return (
    <details className="exercise-guide" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary><span className="exercise-guide-icon"><Icon name="lightbulb" size={16} /></span>Guía rápida</summary>
      <div className={`exercise-guide-body${example ? " with-example" : ""}`}>
        <dl>
          {items.map(([term, description]) => (
            <div key={term}><dt>{term}</dt><dd>{description}</dd></div>
          ))}
        </dl>
        {example && (exampleIsCode
          ? <pre className="exercise-example"><code>{example}</code></pre>
          : <p className="exercise-example"><strong>Ejemplo.</strong> {example}</p>)}
      </div>
    </details>
  );
}
