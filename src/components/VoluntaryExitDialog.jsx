import { useEffect, useRef } from "react";
import Icon from "./Icon";

export default function VoluntaryExitDialog({ onCancel, onConfirm }) {
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
      aria-labelledby="voluntary-exit-title"
      aria-describedby="voluntary-exit-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <div className="exit-challenge-icon"><Icon name="circle-alert" size={23} /></div>
      <h2 id="voluntary-exit-title">¿Salir del desafío?</h2>
      <p id="voluntary-exit-description">
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
