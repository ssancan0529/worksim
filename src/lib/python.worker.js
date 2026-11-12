import inventoryCheck from "./inventoryCheck.py?raw";
import { INVENTORY_CASES } from "../data/projectRubrics.js";
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
    await pyodide.runPythonAsync(code);
    pyodide.globals.set("_worksim_parameters", JSON.stringify(parameters));
    const result = await pyodide.runPythonAsync(`
import json
_worksim_args = json.loads(_worksim_parameters)
_worksim_items = list_pets(**_worksim_args)
_worksim_rows = [
    {"id": pet.id, "species": pet.species, "city": pet.city,
     "urgency_level": pet.urgency_level, "is_adopted": pet.is_adopted}
    if isinstance(pet, Pet) else pet
    for pet in _worksim_items
]
json.dumps(_worksim_rows)
`);
    self.postMessage({ output, result: JSON.parse(result) });
  } catch (error) {
    self.postMessage({ output, error: error.message });
  }
};
