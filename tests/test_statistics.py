import copy,importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('statistics_under_test',Path(__file__).resolve().parents[1]/'evaluation/statistics.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class StatisticsTests(unittest.TestCase):
    def data(self):
        cases=[str(i) for i in range(12)]
        rows=[{'case_id':c,'method':method,'trial_id':c+'_'+method,'status':'submitted','actual_dispatch':True,'accounting':{'verified':True},'state':{'attempts':[{'input_tokens':10,'output_tokens':2}],'spent':{'input_bytes':30,'tool_requests':1,'output_reserved_tokens':512}}} for c in cases for method in m.METHODS]
        grades=[{**r,'strict_success':False,'unsupported_ready':False} for r in rows]
        return cases,rows,grades
    def summary(self,cases,rows,grades):
        result={'mode':'actual_model','trials':rows}
        return m.summarize(result,{'grades':grades,'source_digest':m.sha(result)},cases)
    def test_all_fail_is_zero_success_not_missing(self):
        cases,rows,grades=self.data();s=self.summary(cases,rows,grades)
        self.assertEqual(s['solo_agent']['successes'],0);self.assertEqual(s['exact_mcnemar_p'],1);self.assertEqual(s['solo_agent']['utility_outcome'],'not met')
    def test_missing_dispatch_disables_test_and_utility(self):
        cases,rows,grades=self.data();rows[0]['actual_dispatch']=False;s=self.summary(cases,rows,grades)
        self.assertIsNone(s['exact_mcnemar_p']);self.assertEqual(s['solo_agent']['planned'],12);self.assertEqual(s['solo_agent']['utility_outcome'],'unassessed');self.assertIsNone(s['solo_agent']['output_tokens'])
    def test_discordant_exact_binomial(self):
        cases,rows,grades=self.data()
        for g in grades:g['strict_success']=g['method']=='split_review'
        s=self.summary(cases,rows,grades);self.assertEqual(s['exact_mcnemar_p'],2/4096);self.assertEqual(s['difference_percentage_points'],100)
    def test_empty_and_duplicate_grades_refused(self):
        with self.assertRaises(ValueError):self.summary([],[],[])
        cases,rows,grades=self.data();grades[-1]=grades[0]
        with self.assertRaises(ValueError):self.summary(cases,rows,grades)
    def test_mismatched_grade_source_refused(self):
        cases,rows,grades=self.data()
        with self.assertRaisesRegex(ValueError,'PROVENANCE'):m.summarize({'mode':'actual_model','trials':rows},{'grades':grades,'source_digest':'wrong'},cases)
    def test_unverified_accounting_suppresses_inference(self):
        cases,rows,grades=self.data();rows[0]['accounting']['verified']=False
        self.assertIsNone(self.summary(cases,rows,grades)['exact_mcnemar_p'])
    def test_unexecuted_rows_never_become_zero_measured_tokens(self):
        cases,rows,grades=self.data()
        for r in rows:r.update(status='unexecuted',actual_dispatch=False);r.pop('state')
        s=self.summary(cases,rows,grades);self.assertIsNone(s['solo_agent']['model_requests']);self.assertIsNone(s['solo_agent']['output_tokens'])
    def test_role_usage_does_not_replace_unknown_with_zero(self):
        cases,rows,grades=self.data()
        rows[1]['state']={'attempts':[{'role':'tests','status':'response_recorded','input_tokens':10,'output_tokens':3,'elapsed_ms':25},{'role':'tests','status':'timed_out','input_tokens':None,'output_tokens':None,'elapsed_ms':80}],'reservations':[{'role':'tests','input_bytes':100,'output_reserved_tokens':512}],'tool_requests':[{'role':'tests'}]}
        s=self.summary(cases,rows,grades)['split_review']['roles']
        self.assertEqual(s['tests']['model_requests'],2);self.assertIsNone(s['tests']['output_tokens']);self.assertEqual(s['tests']['known_output_tokens'],3);self.assertEqual(s['tests']['output_tokens_reserved'],512);self.assertEqual(s['tests']['usage_missing_requests'],1);self.assertEqual(s['tests']['provider_elapsed_known_ms'],105);self.assertIsNone(s['synthesis']['input_tokens'])
if __name__=='__main__':unittest.main()
