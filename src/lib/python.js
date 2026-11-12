export function executePython(code, parameters, onReady, taskType = "pets") {
  const worker = new Worker(new URL("./python.worker.js", import.meta.url), { type: "module" });
  let timeout;
  let rejectRun;

  function stop() {
    clearTimeout(timeout);
    worker.terminate();
  }

  const promise = new Promise((resolve, reject) => {
    rejectRun = reject;
    timeout = setTimeout(() => {
      stop();
      reject(new Error("No se pudo cargar Python a tiempo. Comprueba tu conexión y vuelve a intentarlo."));
    }, 90000);
    worker.onmessage = ({ data }) => {
      if (data.phase === "ready") {
        clearTimeout(timeout);
        onReady();
        timeout = setTimeout(() => {
          stop();
          reject(new Error("La ejecución superó los 10 segundos. Revisa el código y vuelve a intentarlo."));
        }, 10000);
        return;
      }
      stop();
      resolve(data);
    };
    worker.onerror = event => {
      stop();
      reject(new Error(event.message || "No se pudo iniciar Python. Comprueba tu conexión y vuelve a intentarlo."));
    };
    worker.postMessage({ code, parameters, taskType });
  });

  return {
    promise,
    cancel() {
      stop();
      rejectRun(new Error("Ejecución cancelada."));
    },
  };
}
