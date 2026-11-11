const indexURL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";

export function loadBrowserPython() {
  importScripts(`${indexURL}pyodide.js`);
  return self.loadPyodide({ indexURL });
}
