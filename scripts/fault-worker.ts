import {PgStore} from '../src/runtime/store.ts';
import {scriptedChild} from './runtime-fixture.ts';
const db=await PgStore.open(),id=process.argv[2];
const s=await db.read(id);const packet=(await db.pool.query(`SELECT packet FROM ${db.schema}.cases WHERE id=$1`,[s.case_id])).rows[0].packet;
await scriptedChild(db,id,packet,'tests','fault-child');process.send?.({pid:process.pid,accepted:true,trial_id:id});
setInterval(()=>{},1000);
