import {PgStore} from '../src/runtime/store.ts';
const db=await PgStore.open();try{console.log(JSON.stringify(await db.independentReadback(process.argv[2])));}finally{await db.close();}
