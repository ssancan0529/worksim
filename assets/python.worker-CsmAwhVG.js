(function(){"use strict";var i=`from sqlalchemy import Boolean, Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class Pet(Base):
    __tablename__ = "pets"
    id = Column(Integer, primary_key=True)
    species = Column(String(40))
    city = Column(String(60))
    urgency_level = Column(Integer)
    is_adopted = Column(Boolean, default=False)

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)
db = sessionmaker(bind=engine)()
for i in range(1, 51):
    db.add(Pet(
        id=i,
        species="dog" if i % 3 else "cat",
        city="Guayaquil" if i % 4 else "Quito",
        urgency_level=(i % 5) + 1,
        is_adopted=(i % 7 == 0),
    ))
db.commit()
`;const n="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";self.onmessage=async({data:{code:a,parameters:r}})=>{let s="";try{importScripts(`${n}pyodide.js`);const e=await self.loadPyodide({indexURL:n});await e.loadPackage(["sqlalchemy","sqlite3"]),e.setStdout({batched:t=>{s+=`${t}
`}}),e.setStderr({batched:t=>{s+=`${t}
`}}),self.postMessage({phase:"ready"}),await e.runPythonAsync(i),await e.runPythonAsync(a),e.globals.set("_worksim_parameters",JSON.stringify(r));const o=await e.runPythonAsync(`
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
`);self.postMessage({output:s,result:JSON.parse(o)})}catch(e){self.postMessage({output:s,error:e.message})}}})();
