"""Verify post-action observations independently of the injection process."""
import json,sys,hashlib
from pathlib import Path
data=json.loads(Path(sys.argv[1]).read_text()); grades=[]
for row in data['trials']:
    o=row['observation']; s=o['state']; p=row['injection']; c=o['counts']; fault=row['fault']
    ok=p['injected'] and not p.get('error') and o['read_at']>=row['window']['action_end'] and o['connection_id']>0
    ok=ok and c['child_packets']<=2 and c['join_receipts']<=1 and c['assessments']<=1
    ok=ok and all(0<=v<=s['budget'][k] for k,v in s['spent'].items())
    if fault in ('lost_child_response','duplicate_delivery','worker_death'):
        ok=ok and s['status']=='submitted' and c['child_packets']==2 and c['join_receipts']==1 and c['assessments']==1
        if fault=='worker_death': ok=ok and p['exit']['signal']=='SIGKILL' and s['generation']==2 and s['deadline']==p['original_deadline']
        else: ok=ok and p['original_receipt']==p['repeat_receipt']
    elif fault=='cancel_race':
        if p['order']=='cancel_then_submit': ok=ok and s['status']=='canceled' and c['assessments']==0 and p['late_submit_refusal']=='TRIAL_TERMINAL'
        else: ok=ok and s['status']=='submitted' and c['assessments']==1
    elif fault=='budget_race': ok=ok and p['outcomes'].count('reserved')==1 and p['outcomes'].count('BUDGET_EXHAUSTED')==1 and c['budget_reservations']==1 and s['spent']['model_requests']==1
    elif fault=='uncertain_dispatch': ok=ok and s['status']=='indeterminate' and c['provider_attempts']==1 and c['budget_reservations']==1 and c['assessments']==0
    grades.append({'trial_id':row['trial_id'],'verified':bool(ok),'fault':fault})
out={'schema_version':1,'mode':'scripted_runtime','source_digest':hashlib.sha256(json.dumps(data,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'planned':12,'observed':len(grades),'verified':sum(g['verified'] for g in grades),'grades':grades}
Path(sys.argv[2]).write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k!='grades'}))
if out['observed']!=12 or out['verified']!=12: sys.exit(1)
