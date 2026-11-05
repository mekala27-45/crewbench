import {defineAgent} from 'eve';
import {mockModel} from 'eve/evals';
// This is deterministic workflow dispatch, never an evaluated model role.
export default defineAgent({defaultTools:false,tool:false,model:mockModel({modelId:'crewbench-code-dispatch',provider:'scripted_orchestration',respond:({lastUserMessage,toolResults}:any)=>toolResults.length?{text:'Workflow finished.'}:{toolCalls:[{name:'run_trial',input:JSON.parse(lastUserMessage)}]}})});
