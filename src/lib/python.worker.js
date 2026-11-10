import setup from "./pythonSetup.py?raw";

const indexURL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";

self.onmessage = async ({ data: { code, parameters } }) => {
  let output = "";
  try {
    importScripts(`${indexURL}pyodide.js`);
    const pyodide = await self.loadPyodide({ indexURL });
    await pyodide.loadPackage(["sqlalchemy", "sqlite3"]);
    pyodide.setStdout({ batched: (line) => { output += `${line}\n`; } });
    pyodide.setStderr({ batched: (line) => { output += `${line}\n`; } });
    self.postMessage({ phase: "ready" });
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
