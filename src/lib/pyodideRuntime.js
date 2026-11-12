const indexURL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
const pyodideModuleURL = new URL("pyodide.mjs", indexURL).href;

export async function loadBrowserPython() {
  const { loadPyodide } = await import(/* @vite-ignore */ pyodideModuleURL);
  if (typeof loadPyodide !== "function") {
    throw new Error("El módulo de Pyodide no expuso loadPyodide.");
  }
  return loadPyodide({ indexURL });
}
