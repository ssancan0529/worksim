import test from 'node:test';
import assert from 'node:assert/strict';
import { executePython } from './python.js';
import { runExercise } from '../practica/runExercise.js';

test('both worker clients report errors, stop on completion/cancel, and enforce timeouts', async () => {
  const original = {Worker:globalThis.Worker,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
  let worker; let timer; let duration;
  globalThis.Worker = class {
    constructor(){worker=this;this.stopped=false;}
    postMessage(data){this.data=data;}
    terminate(){this.stopped=true;}
  };
  globalThis.setTimeout=(callback,ms)=>{timer=callback;duration=ms;return 1;};
  globalThis.clearTimeout=()=>{};
  try {
    for (const start of [()=>executePython('source',{},()=>{}),()=>runExercise({id:'withdrawal',language:'Python'},'source',false)]) {
      let job=start();assert.equal(worker.data.code,'source');assert.equal(duration,90000);
      worker.onmessage({data:{phase:'ready'}});assert.equal(duration,10000);
      worker.onmessage({data:{result:42}});await job.promise;assert.equal(worker.stopped,true);
      job=start();worker.onerror({message:'WASM no disponible'});await assert.rejects(job.promise,/WASM/);assert.equal(worker.stopped,true);
      job=start();job.cancel();await assert.rejects(job.promise,/cancelada/);assert.equal(worker.stopped,true);
      job=start();timer();await assert.rejects(job.promise,/cargar/);assert.equal(worker.stopped,true);
      job=start();worker.onmessage({data:{phase:'ready'}});timer();await assert.rejects(job.promise,/ejecución/);assert.equal(worker.stopped,true);
    }
  } finally { Object.assign(globalThis,original); }
});
