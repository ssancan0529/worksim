import bankSetup from "./bankOperations.py?raw";
import bankCheck from "./bankOperationsCheck.py?raw";
import movementsCheck from "./movementsCheck.py?raw";
import { MOVEMENT_CASES } from "../data/bankProjects.js";
import inventoryCheck from "./inventoryCheck.py?raw";
import { INVENTORY_CASES } from "../data/projectRubrics.js";
import petsCheck from "./petsCheck.py?raw";
import setup from "./pythonSetup.py?raw";
import { loadBrowserPython } from "./pyodideRuntime.js";

self.onmessage = async ({ data: { code, parameters, taskType } }) => {
  let output = "";
  try {
    const pyodide = await loadBrowserPython();
    if (taskType !== "inventory" && taskType !== "bank-movements") await pyodide.loadPackage(["sqlalchemy", "sqlite3"]);
    pyodide.setStdout({ batched: (line) => { output += `${line}\n`; } });
    pyodide.setStderr({ batched: (line) => { output += `${line}\n`; } });
    self.postMessage({ phase: "ready" });
    if (taskType === "inventory" || taskType === "bank-movements") {
      const bank = taskType === "bank-movements";
      pyodide.globals.set("_inventory_source", code);
      pyodide.globals.set("_inventory_cases", JSON.stringify(bank ? MOVEMENT_CASES : INVENTORY_CASES));
      const result = await pyodide.runPythonAsync(bank ? movementsCheck : inventoryCheck);
      self.postMessage({ output, result: JSON.parse(result) });
      return;
    }
    const bank = taskType === "bank-operations";
    await pyodide.runPythonAsync(bank ? bankSetup : setup);
    pyodide.globals.set("_worksim_source", code);
    pyodide.globals.set("_worksim_parameters", JSON.stringify(parameters));
    const result = await pyodide.runPythonAsync(bank ? bankCheck : petsCheck);
    self.postMessage({ output, ...JSON.parse(result) });
  } catch (error) {
    self.postMessage({ output, error: error.message });
  }
};
