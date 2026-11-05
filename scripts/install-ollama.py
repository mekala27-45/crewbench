"""Install the development-verified official release by frozen digest."""
import hashlib, json, os, subprocess, urllib.request
from pathlib import Path
root = Path(os.environ["RUNNER_TEMP"]) / "crewbench-ollama"
root.mkdir(parents=True, exist_ok=True)
lock = json.loads(Path("evaluation/model-lock.json").read_text())
archive = root / lock["provider_url"].rsplit("/", 1)[1]
urllib.request.urlretrieve(lock["provider_url"], archive)
actual = "sha256:" + hashlib.file_digest(archive.open("rb"), "sha256").hexdigest()
if "sha256:" + lock["provider_sha256"] != actual:
    raise RuntimeError("OFFICIAL_BINARY_DIGEST_MISMATCH_OR_MISSING")
subprocess.run(["tar", "-xf", str(archive), "-C", str(root)], check=True)
Path("artifacts/probes").mkdir(parents=True, exist_ok=True)
Path("artifacts/probes/ollama-binary.json").write_text(json.dumps({"version": lock["provider_version"], "url": lock["provider_url"], "digest": actual, "source_commit": os.environ.get("GITHUB_SHA")}, indent=2) + "\n")
with open(os.environ["GITHUB_PATH"], "a") as handle:
    handle.write(str(root / "bin") + "\n")
