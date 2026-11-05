"""Paired statistics over the preregistered inventory, with provenance checks."""
import hashlib,json,math,sys
from pathlib import Path
METHODS=('solo_agent','split_review')
def sha(x):
    return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def wilson(k,n):
    if not n:return None
    z=1.959963984540054;p=k/n;d=1+z*z/n
    center=(p+z*z/(2*n))/d;half=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
    return [max(0,center-half),min(1,center+half)]
def summarize(results,grades,subset):
    if len(subset)!=12 or len(set(subset))!=12:raise ValueError('PLANNED_DENOMINATOR_MISMATCH')
    rows=results['trials'];gr=grades['grades']
    by={(r['case_id'],r['method']):r for r in rows};gs={(g['case_id'],g['method']):g for g in gr}
    expected={(c,m) for c in subset for m in METHODS}
    if len(rows)!=24 or len(gr)!=24 or set(by)!=expected or set(gs)!=expected:raise ValueError('PLANNED_DENOMINATOR_MISMATCH')
    if results.get('mode')!='actual_model' or grades.get('source_digest')!=sha(results):raise ValueError('GRADE_PROVENANCE_MISMATCH')
    for key,r in by.items():
        g=gs[key]
        if g.get('trial_id')!=r['trial_id']:raise ValueError('GRADE_TRIAL_MISMATCH')
        if g['strict_success'] and (r['status']!='submitted' or not r.get('actual_dispatch')):raise ValueError('UNEXECUTED_SUCCESS')
    out={'schema_version':1,'source_digest':sha(results),'grades_digest':sha(grades),'planned_pairs':12,'descriptive_only':True}
    complete=True
    for method in METHODS:
        selected=[by[(c,method)] for c in subset]
        qualified=[r for r in selected if r.get('actual_dispatch') and r.get('accounting',{}).get('verified')]
        full=len(qualified)==12;complete=complete and full
        k=sum(gs[(c,method)]['strict_success'] for c in subset);unsafe=sum(gs[(c,method)]['unsupported_ready'] for c in subset)
        attempts=[a for r in selected for a in r.get('state',{}).get('attempts',[])]
        missing=sum(a.get('output_tokens') is None or a.get('input_tokens') is None for a in attempts)
        states_present=all('state' in r for r in selected)
        known_output=sum(a.get('output_tokens') or 0 for a in attempts);known_input=sum(a.get('input_tokens') or 0 for a in attempts)
        known_bytes=sum(r.get('state',{}).get('spent',{}).get('input_bytes',0) for r in selected)
        known_reserved=sum(r.get('state',{}).get('spent',{}).get('output_reserved_tokens',0) for r in selected)
        known_tools=sum(r.get('state',{}).get('spent',{}).get('tool_requests',0) for r in selected)
        out[method]={'successes':k,'planned':12,'attempted':len(qualified),'unexecuted_or_unverified':12-len(qualified),'wilson_95_descriptive':wilson(k,12),'unsupported_ready':unsafe,'utility_floor_met':k>=8 and unsafe==0 if full else None,'utility_outcome':('met' if k>=8 and unsafe==0 else 'not met') if full else 'unassessed',
        'model_requests':len(attempts) if states_present else None,'known_model_requests':len(attempts),'input_bytes':known_bytes if states_present else None,'known_input_bytes':known_bytes,'output_reserved_tokens':known_reserved if states_present else None,'tool_requests':known_tools if states_present else None,
        'input_tokens':known_input if full and not missing else None,'output_tokens':known_output if full and not missing else None,'usage_missing_requests':missing,'usage_missing_reason':None if full and not missing else 'Incomplete invocation or usage provenance','known_output_tokens':known_output,'known_input_tokens':known_input,
        'elapsed_ms':[r.get('elapsed_ms') for r in selected],'teardown_ms':[r.get('teardown_ms') for r in selected]}
    table={'both':0,'solo_only':0,'split_only':0,'neither':0}
    for c in subset:
        a=gs[(c,METHODS[0])]['strict_success'];b=gs[(c,METHODS[1])]['strict_success']
        table['both' if a and b else 'solo_only' if a else 'split_only' if b else 'neither']+=1
    discordant=table['solo_only']+table['split_only']
    p=min(1,2*sum(math.comb(discordant,i) for i in range(min(table['solo_only'],table['split_only'])+1))/2**discordant) if complete and discordant else 1.0 if complete else None
    delta=out[METHODS[1]]['successes']-out[METHODS[0]]['successes']
    out.update({'complete_provenance':complete,'difference':f'{delta:+d} / 12','difference_percentage_points':delta/12*100,'paired_table':table,'exact_mcnemar_p':p,'inference_missing_reason':None if complete else 'At least one planned method-case row lacks verified actual execution','conclusion':'No broad superiority claim. Interpret paired counts together with utility floors and resource measurements.'})
    return out
if __name__=='__main__':
    results=json.loads(Path(sys.argv[1]).read_text());grades=json.loads(Path(sys.argv[2]).read_text());subset=json.loads(Path('evaluation/model-subset.json').read_text())
    summary=summarize(results,grades,subset);Path(sys.argv[3]).write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary))
