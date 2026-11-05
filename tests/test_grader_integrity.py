import copy,importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('g',Path(__file__).resolve().parents[1]/'evaluation/grade.py');g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
class Integrity(unittest.TestCase):
 def fixture(self):
  records=[dict(evidence_id='e'+str(i),record_kind='check',check_key=k,subject_revision='r',state='pass',case_id='c',snapshot_id='s') for i,k in enumerate(g.CHECKS)]
  p=dict(case_id='c',snapshot_id='s',target_revision='r',records=records);truth=g.expected_from_records(p)
  a=dict(case_id='c',snapshot_id='s',**truth,evidence_refs=[dict(receipt_id='h1',evidence_id=r['evidence_id'],field='state') for r in records])
  def receipt(i,tool,payload,role='baseline'):return dict(id=i,trial_id='t',role=role,tool=tool,payload=payload,payload_digest=g.sha(payload))
  row=dict(trial_id='t',method='deterministic_baseline',status='submitted',on_time=True,assessment=a,receipts=[receipt('h1','read_evidence',dict(records=records)),receipt('h2','submit_assessment',a)])
  return p,truth,row
 def test_acceptance_bound(self):
  p,t,r=self.fixture();self.assertTrue(g.grade(p,t,r)['strict_success']);r['receipts'].pop();self.assertFalse(g.grade(p,t,r)['strict_success'])
 def test_role_scope(self):
  p,t,r=self.fixture();r['receipts'][0]['role']='staging';self.assertFalse(g.grade(p,t,r)['strict_success'])
 def test_corrupt_and_empty(self):
  p,t,r=self.fixture();r['receipts'][0]['payload_digest']='bad';self.assertFalse(g.grade(p,t,r)['references_valid']);r['assessment']=None;self.assertFalse(g.grade(p,t,r)['strict_success'])
 def test_scope_precedes_current_state(self):
  p,t,r=self.fixture();p['records'][0]['snapshot_id']='other';self.assertEqual(g.expected_from_records(p)['checks']['unit_tests'],'missing_current')
