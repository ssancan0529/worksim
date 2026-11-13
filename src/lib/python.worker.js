import inventoryCheck from "./inventoryCheck.py?raw";
import { INVENTORY_CASES } from "../data/projectRubrics.js";
import petsCheck from "./petsCheck.py?raw";
import setup from "./pythonSetup.py?raw";
import { loadBrowserPython } from "./pyodideRuntime.js";

self.onmessage = async ({ data: { code, parameters, taskType } }) => {
  let output = "";
  try {
    const pyodide = await loadBrowserPython();
    if (taskType !== "inventory") await pyodide.loadPackage(["sqlalchemy", "sqlite3"]);
    pyodide.setStdout({ batched: (line) => { output += `${line}\n`; } });
    pyodide.setStderr({ batched: (line) => { output += `${line}\n`; } });
    self.postMessage({ phase: "ready" });
    if (taskType === "inventory") {
      pyodide.globals.set("_inventory_source", code);
      pyodide.globals.set("_inventory_cases", JSON.stringify(INVENTORY_CASES));
      const result = await pyodide.runPythonAsync(inventoryCheck);
      self.postMessage({ output, result: JSON.parse(result) });
      return;
    }
    await pyodide.runPythonAsync(setup);
    pyodide.globals.set("_worksim_source", code);
    pyodide.globals.set("_worksim_parameters", JSON.stringify(parameters));
    const result = await pyodide.runPythonAsync(petsCheck);
    self.postMessage({ output, ...JSON.parse(result) });
  } catch (error) {
    self.postMessage({ output, error: error.message });
  }
};
