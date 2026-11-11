export function runExercise(exercise, code, compare) {
  const worker = new Worker(new URL("./engines.worker.js", import.meta.url));
  let timer;
  let rejectRun;

  function stop() {
    clearTimeout(timer);
    worker.terminate();
  }

  const promise = new Promise((resolve, reject) => {
    rejectRun = reject;
    timer = setTimeout(() => {
      stop();
      reject(new Error("El motor tardó demasiado en cargar. Vuelve a intentar."));
    }, exercise.language === "SQL" ? 10000 : 90000);
    worker.onmessage = ({ data }) => {
      if (data.phase === "ready") {
        clearTimeout(timer);
        timer = setTimeout(() => {
          stop();
          reject(new Error("La ejecución tardó demasiado. Revisa el código y vuelve a intentar."));
        }, 10000);
        return;
      }
      stop();
      if (data.error) reject(new Error(data.error));
      else resolve(data);
    };
    worker.onerror = () => {
      stop();
      reject(new Error("No se pudo iniciar el motor de pruebas. Vuelve a intentar."));
    };
    worker.postMessage({ id: exercise.id, code, compare });
  });

  return {
    promise,
    cancel() {
      stop();
      rejectRun(new Error("Ejecución cancelada."));
    },
  };
}
