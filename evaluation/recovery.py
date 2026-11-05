"""Independent recovery evidence validation. Replayed assertions are insufficient."""
import hashlib, json, sys
from pathlib import Path
from datetime import datetime
FAULTS={'lost_child_response','duplicate_delivery','worker_death','cancel_race','budget_race','uncertain_dispatch'}
def sha(x):
    return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def fresh(o,after,trial_id):
    s=o['state'];c=o['counts']
    return (o['trial_id']==trial_id==s['id'] and o['schema'].startswith('crewbench_test_')
        and datetime.fromisoformat(o['read_at'].replace('Z','+00:00'))>=datetime.fromisoformat(after.replace('Z','+00:00'))
        and o['connection_id']>0 and o['state_digest']==sha(s) and o['event_sequence']==len(s['events'])
        and c['child_packets']==len(s['children']) and c['join_receipts']==int(s['join'] is not None)
        and c['assessments']==int(s['assessment'] is not None)
        and c['provider_attempts']==len(s['attempts']) and c['budget_reservations']==len(s['reservations'])
        and c['tool_receipts']==len(s['receipts'])
        and c['child_packets']<=2 and c['join_receipts']<=1 and c['assessments']<=1
        and all(0<=v<=s['budget'][k] for k,v in s['spent'].items()))
def verify(row):
    try:
        o=row['observation'];s=o['state'];p=row['injection'];c=o['counts'];fault=row['fault']
        ok=p['injected'] and not p.get('error') and fresh(o,row['window']['action_end'],row['trial_id'])
        if fault in ('lost_child_response','duplicate_delivery','worker_death'):
            ok=ok and s['status']=='submitted' and c['child_packets']==2 and c['join_receipts']==1 and c['assessments']==1
            if fault=='worker_death':
                ok=ok and p['exit']['signal']=='SIGKILL' and p['killed_pid']>0 and s['generation']==2 and s['deadline']==p['original_deadline'] and sha(s['children']['tests'])==p['before_child_digest']
            else: ok=ok and p['original_receipt']==p['repeat_receipt']
        elif fault=='cancel_race':
            subs=p['orderings'];ok=ok and len(subs)==2 and {x['order'] for x in subs}=={'cancel_then_submit','submit_then_cancel'}
            for sub in subs:
                x=sub['observation'];ok=ok and sub['barrier_armed'] and sub['first_committed'] and fresh(x,sub['action_end'],sub['trial_id'])
                if sub['order']=='cancel_then_submit':
                    ok=ok and x['state']['status']=='canceled' and x['counts']['assessments']==0 and sub['late_submit_refusal']=='TRIAL_TERMINAL'
                else:ok=ok and x['state']['status']=='submitted' and x['counts']['assessments']==1
        elif fault=='budget_race':
            ok=ok and p['outcomes'].count('reserved')==1 and p['outcomes'].count('BUDGET_EXHAUSTED')==1 and c['budget_reservations']==1 and s['spent']['model_requests']==1
        elif fault=='uncertain_dispatch':
            ok=ok and p['exit']['signal']=='SIGKILL' and p['barrier']['boundary']=='dispatch_intent' and p['killed_pid']>0 and s['status']=='indeterminate' and c['provider_attempts']==1 and c['budget_reservations']==1 and c['assessments']==0
        else:ok=False
        return bool(ok)
    except (KeyError,TypeError,ValueError):return False
def grade(data):
    rows=data.get('trials',[])
    keys={(r['fixture_id'],r['fault']) for r in rows}
    fixtures={r['fixture_id'] for r in rows}
    inventory=len(rows)==12 and len(fixtures)==2 and keys=={(f,k) for f in fixtures for k in FAULTS}
    grades=[{'trial_id':r['trial_id'],'verified':inventory and verify(r),'fault':r['fault']} for r in rows]
    return {'schema_version':2,'source_digest':sha(data),'mode':'scripted_runtime','planned':12,'observed':len(grades),'inventory_valid':inventory,'verified':sum(g['verified'] for g in grades),'grades':grades}
if __name__=='__main__':
    data=json.loads(Path(sys.argv[1]).read_text());out=grade(data)
    Path(sys.argv[2]).write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({k:v for k,v in out.items() if k!='grades'}))
    if out['observed']!=12 or out['verified']!=12:sys.exit(1)
