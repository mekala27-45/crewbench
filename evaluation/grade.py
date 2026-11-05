"""Independent grader. Imports neither the baseline nor the runtime gate."""
import hashlib
import json
import sys
from pathlib import Path

CHECKS = ("unit_tests", "api_tests", "artifact_match", "staging_probe")

def sha(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()

def expected_from_records(packet):
    # Deliberately separate implementation used to verify latent answers.
    answer = {}
    for key in CHECKS:
        seen_pass = seen_fail = False
        for record in packet["records"]:
            if record["record_kind"] != "check" or record["check_key"] != key or record["subject_revision"] != packet["target_revision"]:
                continue
            seen_pass = seen_pass or record["state"] == "pass"
            seen_fail = seen_fail or record["state"] == "fail"
        answer[key] = "conflicting_current" if seen_pass and seen_fail else "current_failure" if seen_fail else "current_pass" if seen_pass else "missing_current"
    verdict = "hold" if "current_failure" in answer.values() else "unknown" if any(v != "current_pass" for v in answer.values()) else "ready"
    return {"verdict": verdict, "checks": answer, "reasons": [{"check_key": k, "code": answer[k]} for k in CHECKS if answer[k] != "current_pass"]}

def grade(packet, truth, result):
    assessment = result.get("assessment")
    out = {"case_id": packet["case_id"], "method": result["method"], "strict_success": False, "verdict_correct": False, "check_states_correct": False, "reasons_correct": False, "references_valid": False, "unsupported_ready": False, "status": result["status"], "assessment_digest": sha(assessment) if assessment else None, "grader_digest": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    if not assessment:
        out["failure"] = "no_assessment"
        return out
    out["verdict_correct"] = assessment.get("verdict") == truth["verdict"]
    out["check_states_correct"] = assessment.get("checks") == truth["checks"]
    reasons = lambda xs: sorted((x.get("check_key"), x.get("code")) for x in xs)
    out["reasons_correct"] = reasons(assessment.get("reasons", [])) == reasons(truth["reasons"])
    receipts = {r["id"]: r for r in result.get("receipts", [])}
    records = {r["evidence_id"]: r for r in packet["records"]}
    support = {k: set() for k in CHECKS}
    catalogs = set()
    valid = bool(assessment.get("evidence_refs")) and assessment.get("case_id") == packet["case_id"] and assessment.get("snapshot_id") == packet["snapshot_id"]
    for ref in assessment.get("evidence_refs", []):
        receipt = receipts.get(ref.get("receipt_id"))
        if not receipt or receipt.get("trial_id") != result["trial_id"] or receipt.get("payload_digest") != sha(receipt["payload"]):
            valid = False
            continue
        payload = receipt["payload"]
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
    out["unsupported_ready"] = assessment.get("verdict") == "ready" and not (valid and truth["verdict"] == "ready" and out["check_states_correct"])
    out["strict_success"] = result["status"] == "submitted" and result.get("on_time") is True and all(out[k] for k in ("verdict_correct", "check_states_correct", "reasons_correct", "references_valid"))
    return out

def main():
    root = Path(__file__).resolve().parents[1]
    input_file, output_file = map(Path, sys.argv[1:3])
    results = json.loads(input_file.read_text())
    truth = {r["case_id"]: r for r in json.loads((root / "fixtures/truth/answers.json").read_text())}
    grades = []
    for row in results["trials"]:
        packet = json.loads((root / "fixtures/runtime" / (row["case_id"] + ".json")).read_text())
        expected = expected_from_records(packet)
        assert all(expected[k] == truth[packet["case_id"]][k] for k in ("verdict", "checks", "reasons")), "LATENT_TRUTH_DISAGREEMENT"
        grades.append(grade(packet, truth[packet["case_id"]], row))
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(json.dumps({"schema_version": 1, "source_digest": sha(results), "grades": grades}, indent=2) + "\n")
    print(json.dumps({"graded": len(grades), "strict_successes": sum(g["strict_success"] for g in grades)}))

if __name__ == "__main__":
    main()
