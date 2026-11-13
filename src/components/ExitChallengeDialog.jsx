import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export default function ExitChallengeDialog({ deadline, onConfirm }) {
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);
  const onConfirmRef = useRef(onConfirm);
  const [secondsRemaining, setSecondsRemaining] = useState(
    () => Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
  );

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open) dialog?.showModal();
    confirmRef.current?.focus();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) onConfirmRef.current();
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(timer);
  }, [deadline]);

  return (
    <dialog
      ref={dialogRef}
      className="challenge-policy-dialog"
      aria-labelledby="challenge-violation-title"
      aria-describedby="challenge-violation-description"
      onCancel={(event) => {
        event.preventDefault();
      }}
    >
      <div className="exit-challenge-icon"><Icon name="circle-alert" size={23} /></div>
      <h2 id="challenge-violation-title">Incumplimiento de las normas</h2>
      <p id="challenge-violation-description">
        El desafío se finalizará por el incumplimiento de las normas.
      </p>
      <p className="challenge-violation-countdown" aria-live="polite">
        El desafío se cerrará en <strong>{secondsRemaining}</strong> segundos.
      </p>
      <div className="exit-challenge-actions">
        <button ref={confirmRef} className="button exit-challenge-confirm" type="button" onClick={onConfirm}>
          Salir
        </button>
      </div>
    </dialog>
  );
}
