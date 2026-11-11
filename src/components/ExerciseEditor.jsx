import { useRef } from "react";

export default function ExerciseEditor({
  id, label, file, value, onChange, onRun, readOnly = false, placeholder, rows = 7, maxLength,
}) {
  const gutter = useRef(null);

  return (
    <div className="exercise-editor">
      <label className="editor-label" htmlFor={id}>{label}</label>
      <div className="exercise-editor-frame">
        <div className="exercise-editor-file" aria-hidden="true">&lt;/&gt; &nbsp; {file}</div>
        <div className="exercise-editor-body">
          <div className="exercise-editor-gutter" aria-hidden="true">
            <pre ref={gutter}>{value.split("\n").map((_, index) => index + 1).join("\n")}</pre>
          </div>
          <textarea
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onScroll={(event) => {
              gutter.current.style.transform = `translateY(-${event.currentTarget.scrollTop}px)`;
            }}
            onKeyDown={(event) => {
              if (onRun && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                onRun();
              }
            }}
            rows={rows}
            readOnly={readOnly}
            maxLength={maxLength}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            wrap="off"
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
}
