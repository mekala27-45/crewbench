import {PgStore} from '../src/runtime/store.ts';
const db=await PgStore.open();try{await db.migrate();console.log(JSON.stringify({ready:await db.ready(),schema:db.schema}));}finally{await db.close();}
