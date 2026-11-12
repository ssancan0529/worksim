import { useEffect, useRef } from "react";
import Icon from "./Icon";

export default function ExitChallengeDialog({ onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

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
      className="exit-challenge-dialog"
      aria-labelledby="exit-challenge-title"
      aria-describedby="exit-challenge-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <div className="exit-challenge-icon"><Icon name="circle-alert" size={23} /></div>
      <h2 id="exit-challenge-title">¿Salir del desafío?</h2>
      <p id="exit-challenge-description">
        Los desafíos no se pueden dejar a medias. Si sales ahora, se borrará todo el progreso actual y tendrás que empezar de nuevo.
      </p>
      <div className="exit-challenge-actions">
        <button ref={cancelRef} className="button secondary" type="button" onClick={onCancel}>
          Seguir con el desafío
        </button>
        <button className="button exit-challenge-confirm" type="button" onClick={onConfirm}>
          Salir y borrar progreso
        </button>
      </div>
    </dialog>
  );
}
