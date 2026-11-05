"""Independent grader. Imports neither the baseline nor the runtime gate."""
import hashlib
import json
import sys
from pathlib import Path

CHECKS = ("unit_tests", "api_tests", "artifact_match", "staging_probe")

def sha(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()

def expected_from_records(packet):
    # Deliberately separate implementation used to verify latent answers.
    answer = {}
    for key in CHECKS:
        seen_pass = seen_fail = False
        for record in packet["records"]:
            if record["record_kind"] != "check" or record["check_key"] != key or record["subject_revision"] != packet["target_revision"] or record.get("case_id") != packet.get("case_id") or record.get("snapshot_id") != packet.get("snapshot_id"):
                continue
            seen_pass = seen_pass or record["state"] == "pass"
            seen_fail = seen_fail or record["state"] == "fail"
        answer[key] = "conflicting_current" if seen_pass and seen_fail else "current_failure" if seen_fail else "current_pass" if seen_pass else "missing_current"
    verdict = "hold" if "current_failure" in answer.values() else "unknown" if any(v != "current_pass" for v in answer.values()) else "ready"
    return {"verdict": verdict, "checks": answer, "reasons": [{"check_key": k, "code": answer[k]} for k in CHECKS if answer[k] != "current_pass"]}

def grade(packet, truth, result):
    assessment = result.get("assessment")
    out = {"trial_id": result.get("trial_id"), "case_id": packet["case_id"], "method": result["method"], "strict_success": False, "verdict_correct": False, "check_states_correct": False, "reasons_correct": False, "references_valid": False, "unsupported_ready": False, "status": result["status"], "assessment_digest": sha(assessment) if assessment else None, "grader_digest": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    if not assessment:
        out["failure"] = "no_assessment"
        return out
    out["verdict_correct"] = assessment.get("verdict") == truth["verdict"]
    out["check_states_correct"] = assessment.get("checks") == truth["checks"]
    reasons = lambda xs: sorted((x.get("check_key"), x.get("code")) for x in xs)
    out["reasons_correct"] = reasons(assessment.get("reasons", [])) == reasons(truth["reasons"])
    raw_receipts=result.get("receipts", [])
    receipts = {r["id"]: r for r in raw_receipts}
    final_role={"deterministic_baseline":"baseline","solo_agent":"solo","split_review":"synthesis"}.get(result["method"])
    accepted=result["status"]=="submitted" and any(r.get("trial_id")==result["trial_id"] and r.get("role")==final_role and r.get("tool")=="submit_assessment" and r.get("payload")==assessment and r.get("payload_digest")==sha(assessment) for r in raw_receipts)
    records = {r["evidence_id"]: r for r in packet["records"]}
    support = {k: set() for k in CHECKS}
    catalogs = set()
    valid = accepted and len(receipts)==len(raw_receipts) and bool(assessment.get("evidence_refs")) and assessment.get("case_id") == packet["case_id"] and assessment.get("snapshot_id") == packet["snapshot_id"]
    for ref in assessment.get("evidence_refs", []):
        receipt = receipts.get(ref.get("receipt_id"))
        if not receipt or receipt.get("trial_id") != result["trial_id"] or receipt.get("payload_digest") != sha(receipt["payload"]):
            valid = False
            continue
        payload = receipt["payload"]
        allowed_role = "baseline" if result["method"] == "deterministic_baseline" else "solo" if result["method"] == "solo_agent" else "synthesis"
        if receipt.get("role") != allowed_role:
            join = result.get("join") or {}
            transferred = join.get("evidence_receipts", [])
            if result["method"] != "split_review" or receipt not in transferred or join.get("trial_id") != result["trial_id"] or join.get("case_id") != packet["case_id"] or join.get("snapshot_id") != packet["snapshot_id"]:
                valid = False
                continue
        if ref["field"] == "catalog_complete":
            group = ref["evidence_id"].removeprefix("catalog_")
            catalog = next((c for c in payload.get("catalogs", []) if c["group"] == group), None)
            if not catalog or catalog.get("catalog_complete") is not True or catalog.get("snapshot_id") != packet["snapshot_id"] or catalog.get("case_id") != packet["case_id"]:
                valid = False
            else:
                wanted = [{k: r[k] for k in ("evidence_id", "evidence_group", "record_kind", "check_key", "subject_revision")} for r in packet["records"] if r["evidence_group"] == group]
                if sorted(catalog["rows"], key=lambda r: r["evidence_id"]) != sorted(wanted, key=lambda r: r["evidence_id"]):
                    valid = False
                catalogs.add(group)
        elif ref["field"] in ("state", "subject_revision"):
            record = records.get(ref["evidence_id"])
            if not record or record not in payload.get("records", []):
                valid = False
            elif record["record_kind"] == "check" and record["subject_revision"] == packet["target_revision"] and ref["field"] == "state":
                support[record["check_key"]].add(record["state"])
        else:
            valid = False
    for key in CHECKS:
        value = assessment.get("checks", {}).get(key)
        if value == "missing_current":
            valid = valid and ("tests" if key in CHECKS[:2] else "staging") in catalogs
        elif value == "current_pass":
            valid = valid and "pass" in support[key]
        elif value == "current_failure":
            valid = valid and "fail" in support[key]
        elif value == "conflicting_current":
            valid = valid and support[key] == {"pass", "fail"}
        else:
            valid = False
    out["references_valid"] = bool(valid)
    out["unsupported_ready"] = accepted and assessment.get("verdict") == "ready" and not (valid and truth["verdict"] == "ready" and out["check_states_correct"])
    provenance = True
    if result['method'] in ('solo_agent','split_review'):
        state=result.get('state') or {};attempts=state.get('attempts',[]);reservations=state.get('reservations',[])
        required=['solo'] if result['method']=='solo_agent' else ['tests','staging','synthesis']
        provenance=result.get('actual_dispatch') is True and bool(result.get('accounting',{}).get('verified')) and state.get('assessment')==assessment
        provenance=provenance and all(any(a.get('role')==role and a.get('status')=='response_recorded' and a.get('response') for a in attempts) for role in required)
        for attempt in attempts:
            reservation=next((r for r in reservations if r['operation_id']==attempt['operation_id']),None);body=attempt.get('request_body')
            provenance=provenance and bool(reservation) and bool(body)
            if reservation and body:provenance=provenance and reservation['request_digest']==sha(body) and reservation['input_bytes']==len(json.dumps(body,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode())
        final_role='solo' if result['method']=='solo_agent' else 'synthesis'
        final_args={k:v for k,v in assessment.items() if k not in ('case_id','snapshot_id')}
        provenance=provenance and any(c.get('function',{}).get('name')=='submit_assessment' and c['function'].get('arguments')==final_args for a in attempts if a.get('role')==final_role and a.get('status')=='response_recorded' for c in (a.get('response') or {}).get('message',{}).get('tool_calls',[]))
    out['actual_provenance_valid']=bool(provenance)
    out["strict_success"] = result["status"] == "submitted" and result.get("on_time") is True and provenance and all(out[k] for k in ("verdict_correct", "check_states_correct", "reasons_correct", "references_valid"))
    return out

def main():
    root = Path(__file__).resolve().parents[1]
    input_file, output_file = map(Path, sys.argv[1:3])
    results = json.loads(input_file.read_text())
    public_records = "--public-records" in sys.argv[3:]
    truth = None if public_records else {r["case_id"]: r for r in json.loads((root / "fixtures/truth/answers.json").read_text())}
    grades = []
    for row in results["trials"]:
        packet = json.loads((root / "fixtures/runtime" / (row["case_id"] + ".json")).read_text())
        expected = expected_from_records(packet)
        if truth is not None:
            assert all(expected[k] == truth[packet["case_id"]][k] for k in ("verdict", "checks", "reasons")), "LATENT_TRUTH_DISAGREEMENT"
        grades.append(grade(packet, expected if public_records else truth[packet["case_id"]], row))
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(json.dumps({"schema_version": 1, "source_digest": sha(results), "grading_basis": "independent_public_record_policy" if public_records else "private_truth_and_independent_policy", "private_truth_verified": not public_records, "grades": grades}, indent=2) + "\n")
    print(json.dumps({"graded": len(grades), "strict_successes": sum(g["strict_success"] for g in grades)}))

if __name__ == "__main__":
    main()
