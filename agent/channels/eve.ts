import {eveChannel} from 'eve/channels/eve';
import {timingSafeEqual,createHash} from 'node:crypto';
export default eveChannel({auth:async(request:Request)=>{
 const expected=process.env.CREWBENCH_WORKER_TOKEN;if(!expected||expected.length<43)return null;
 const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 const hash=(s:string)=>createHash('sha256').update(s).digest();
 if(!timingSafeEqual(hash(expected),hash(supplied)))return null;
 return {authenticator:'crewbench-ephemeral-worker',principalId:'crewbench-worker',principalType:'service'};
}});
