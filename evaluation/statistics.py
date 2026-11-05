"""Paired descriptive statistics with retained planned denominators."""
import math,json,sys,hashlib
from pathlib import Path

def wilson(k,n):
    if not n:return None
    z=1.959963984540054; p=k/n; d=1+z*z/n
    center=(p+z*z/(2*n))/d; half=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
    return [center-half,center+half]

def summarize(results,grades,subset):
    rows=results['trials']; by={(r['case_id'],r['method']):r for r in rows}; gs={(r['case_id'],r['method']):r for r in grades['grades']}
    if len(by)!=len(rows) or len(rows)!=24 or len(subset)!=12:raise ValueError('PLANNED_DENOMINATOR_MISMATCH')
    methods=['solo_agent','split_review']; out={'planned_pairs':12,'descriptive_only':True}
    for method in methods:
        selected=[by[(c,method)] for c in subset]; measured=[r for r in selected if r.get('actual_dispatch')]
        k=sum(gs[(c,method)]['strict_success'] for c in subset); unsafe=sum(gs[(c,method)]['unsupported_ready'] for c in subset)
        attempts=[a for r in selected for a in r.get('state',{}).get('attempts',[])]
        missing=sum(a.get('output_tokens') is None or a.get('input_tokens') is None for a in attempts)
        elapsed=sorted(r['elapsed_ms'] for r in selected if r.get('elapsed_ms') is not None)
        median=(elapsed[(len(elapsed)-1)//2]+elapsed[len(elapsed)//2])/2 if elapsed else None
        out[method]={'successes':k,'planned':12,'attempted':len(measured),'unexecuted':12-len(measured),'wilson_95_descriptive':wilson(k,12),'unsupported_ready':unsafe,'utility_floor_met':k>=8 and unsafe==0,'model_requests':len(attempts),'input_bytes':sum(r.get('state',{}).get('spent',{}).get('input_bytes',0) for r in selected),'output_tokens':sum(a['output_tokens'] for a in attempts) if not missing else None,'usage_missing_requests':missing,'known_output_tokens':sum(a.get('output_tokens') or 0 for a in attempts)}
        out[method].update({'submitted':sum(r['status']=='submitted' for r in selected if 'status' in r),'graded':12,'input_tokens':sum(a['input_tokens'] for a in attempts) if attempts and not missing else None,'tool_requests':sum(len(r.get('state',{}).get('tool_requests',[])) for r in selected),'elapsed_median_ms':median,'elapsed_range_ms':[min(elapsed),max(elapsed)] if elapsed else None,'timeout_count':sum(r.get('status')=='timed_out' for r in selected),'usage_missing_reason':'No dispatch or incomplete provider usage' if not attempts or missing else None})
        if not attempts:out[method]['output_tokens']=None
    solo_only=split_only=both=neither=0
    for case in subset:
        a=gs[(case,'solo_agent')]['strict_success'];b=gs[(case,'split_review')]['strict_success']
        if a and b:both+=1
        elif a:solo_only+=1
        elif b:split_only+=1
        else:neither+=1
    complete=all(by[(c,m)].get('actual_dispatch') for c in subset for m in methods)
    discordant=solo_only+split_only
    p=min(1,2*sum(math.comb(discordant,i) for i in range(min(solo_only,split_only)+1))/2**discordant) if complete and discordant else 1.0 if complete else None
    out.update({'difference':f"{out['split_review']['successes']-out['solo_agent']['successes']:+d} / 12",'paired_table':{'both':both,'solo_only':solo_only,'split_only':split_only,'neither':neither},'exact_mcnemar_p':p,'inference_missing_reason':None if complete else 'At least one planned method-case row lacks actual dispatch','conclusion':'No broad superiority claim. Interpret paired counts together with utility floors and resource measurements.'})
    if not complete:out['conclusion']='Incomplete experiment: at least one planned trial has no actual provider dispatch.'
    elif not any(out[m]['utility_floor_met'] for m in methods):out['conclusion']='No demonstrated useful model behavior under the registered utility floor.'
    elif out['solo_agent']['successes']==out['split_review']['successes']:out['conclusion']='Observed tie on this small authored paired subset.'
    else:out['conclusion']='Observed '+('split' if out['split_review']['successes']>out['solo_agent']['successes'] else 'solo')+' advantage on this small authored paired subset.'
    out['rows']=[{'case_id':c,**{m:{'status':by[(c,m)].get('status'),'strict_success':gs[(c,m)]['strict_success'],'actual_dispatch':by[(c,m)].get('actual_dispatch'),'requests':len(by[(c,m)].get('state',{}).get('attempts',[])),'input_bytes':by[(c,m)].get('state',{}).get('spent',{}).get('input_bytes'),'elapsed_ms':by[(c,m)].get('elapsed_ms')} for m in methods}} for c in subset]
    return out

if __name__=='__main__':
    sha=lambda v:hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
    results=json.loads(Path(sys.argv[1]).read_text());grades=json.loads(Path(sys.argv[2]).read_text());subset=json.loads(Path('evaluation/model-subset.json').read_text())
    if grades['source_digest']!=sha(results):raise ValueError('GRADE_SOURCE_MISMATCH')
    summary=summarize(results,grades,subset);summary.update({'source_digest':sha(results),'grades_digest':sha(grades)});Path(sys.argv[3]).write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps({k:v for k,v in summary.items() if k!='rows'}))
