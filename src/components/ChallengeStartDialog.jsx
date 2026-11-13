import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export default function ChallengeStartDialog({ onCancel, onAccept }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open) dialog?.showModal();
    cancelRef.current?.focus();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="challenge-policy-dialog"
      aria-labelledby="challenge-policy-title"
      aria-describedby="challenge-policy-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <div className="exit-challenge-icon"><Icon name="shield-alert" size={23} /></div>
      <h2 id="challenge-policy-title">Antes de iniciar el desafío</h2>
      <div id="challenge-policy-description" className="challenge-policy-copy">
        <p>Este desafío pone a prueba tu pensamiento crítico y debe completarse de corrido una vez iniciado.</p>
        <p>Está estrictamente prohibido salir de esta página, cambiar de pestaña o utilizar IA externa o herramientas de control del navegador.</p>
      </div>
      <label className="challenge-policy-accept">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span>Leí y acepto estas condiciones.</span>
      </label>
      <div className="exit-challenge-actions">
        <button ref={cancelRef} className="button secondary" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="button"
          type="button"
          disabled={!accepted}
          onClick={onAccept}
        >
          Acepto y comenzar
        </button>
      </div>
    </dialog>
  );
}
