import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('statistics_under_test',Path(__file__).resolve().parents[1]/'evaluation/statistics.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class StatisticsTests(unittest.TestCase):
    def data(self):
        cases=[str(i) for i in range(12)];rows=[{'case_id':c,'method':method,'actual_dispatch':True} for c in cases for method in ['solo_agent','split_review']];grades=[{**r,'strict_success':False,'unsupported_ready':False} for r in rows];return cases,rows,grades
    def test_all_fail_is_zero_success_not_missing(self):
        cases,rows,grades=self.data();s=m.summarize({'trials':rows},{'grades':grades},cases);self.assertEqual(s['solo_agent']['successes'],0);self.assertEqual(s['exact_mcnemar_p'],1);self.assertFalse(s['solo_agent']['utility_floor_met'])
    def test_missing_dispatch_disables_test(self):
        cases,rows,grades=self.data();rows[0]['actual_dispatch']=False;s=m.summarize({'trials':rows},{'grades':grades},cases);self.assertIsNone(s['exact_mcnemar_p']);self.assertEqual(s['solo_agent']['planned'],12)
    def test_discordant_exact_binomial(self):
        cases,rows,grades=self.data()
        for g in grades:g['strict_success']=g['method']=='split_review'
        s=m.summarize({'trials':rows},{'grades':grades},cases);self.assertEqual(s['exact_mcnemar_p'],2/4096);self.assertEqual(s['difference'],'+12 / 12')
    def test_empty_refused(self):
        with self.assertRaises(ValueError):m.summarize({'trials':[]},{'grades':[]},[])
if __name__=='__main__':unittest.main()
