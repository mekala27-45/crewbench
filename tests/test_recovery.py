import copy,importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('recovery',Path(__file__).resolve().parents[1]/'evaluation/recovery.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class RecoveryTests(unittest.TestCase):
    def observation(self):
        state={'id':'t','children':{},'join':None,'assessment':None,'attempts':[],'reservations':[],'receipts':[],'events':[{'sequence':1}],'spent':{'model_requests':0},'budget':{'model_requests':1}}
        return {'state':state,'state_digest':m.sha(state),'trial_id':'t','schema':'crewbench_test_123','connection_id':12,'event_sequence':1,'read_at':'2026-11-05T20:00:02Z','counts':{'child_packets':0,'join_receipts':0,'assessments':0,'provider_attempts':0,'budget_reservations':0,'tool_receipts':0}}
    def test_fresh_read_clean_mutated_and_missing(self):
        o=self.observation();self.assertTrue(m.fresh(o,'2026-11-05T20:00:01Z','t'))
        o['state']['spent']['model_requests']=1;self.assertFalse(m.fresh(o,'2026-11-05T20:00:01Z','t'))
        self.assertFalse(m.verify({}))
    def test_stale_wrong_trial_and_runtime_schema_fail(self):
        o=self.observation();self.assertFalse(m.fresh(o,'2026-11-05T20:00:03Z','t'));self.assertFalse(m.fresh(o,'2026-11-05T20:00:01Z','another'))
        o['schema']='crewbench';self.assertFalse(m.fresh(o,'2026-11-05T20:00:01Z','t'))
    def test_empty_is_not_perfect_recovery(self):
        result=m.grade({'trials':[]});self.assertFalse(result['inventory_valid']);self.assertEqual(result['verified'],0)
    def test_old_cancellation_without_both_barriers_is_refused(self):
        o=self.observation();row={'trial_id':'t','fault':'cancel_race','window':{'action_end':'2026-11-05T20:00:01Z'},'injection':{'injected':True,'order':'cancel_then_submit'},'observation':o};self.assertFalse(m.verify(row))
if __name__=='__main__':unittest.main()
