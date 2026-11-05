import {Refusal} from '../../src/contracts/core.ts';
import type {Store} from '../../src/runtime/store.ts';
import type {Trial} from '../../src/runtime/state.ts';
// Unit-test adapter only. Public runtime always requires PostgreSQL.
export class MemoryStore implements Store {
 states=new Map<string,Trial>();queue=Promise.resolve();now=1793908000000;
 async create(s:Trial){this.states.set(s.id,structuredClone(s));return s;}
 async read(id:string){return structuredClone(this.states.get(id)!);}
 async change<T>(id:string,fn:(s:Trial,now:number)=>T):Promise<T>{let release!:()=>void;const prior=this.queue;this.queue=new Promise(r=>release=r);await prior;try{const state=structuredClone(this.states.get(id)!);try{const value=fn(state,this.now);this.states.set(id,state);return structuredClone(value);}catch(e){if(e instanceof Refusal)this.states.set(id,state);throw e;}}finally{release();}}
 async close(){}
}
