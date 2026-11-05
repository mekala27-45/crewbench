"""Resolve an official release during development and verify downloaded bytes."""
import hashlib, json, os, subprocess, urllib.request
from pathlib import Path
root = Path(os.environ["RUNNER_TEMP"]) / "crewbench-ollama"
root.mkdir(parents=True, exist_ok=True)
lock_path=Path('evaluation/model-lock.json')
if lock_path.exists():
    lock=json.loads(lock_path.read_text())
    version=lock['provider_version']
    release=json.load(urllib.request.urlopen('https://api.github.com/repos/ollama/ollama/releases/tags/v'+version,timeout=30))
    asset=next(a for a in release['assets'] if a['browser_download_url']==lock['provider_url'])
    if asset.get('digest')!='sha256:'+lock['provider_sha256']:raise RuntimeError('PINNED_PROVIDER_DIGEST_MISMATCH')
else:
    raise RuntimeError('MODEL_LOCK_REQUIRED')
archive = root / asset["name"]
urllib.request.urlretrieve(asset["browser_download_url"], archive)
actual = "sha256:" + hashlib.file_digest(archive.open("rb"), "sha256").hexdigest()
if not asset.get("digest") or asset["digest"] != actual:
    raise RuntimeError("OFFICIAL_BINARY_DIGEST_MISMATCH_OR_MISSING")
subprocess.run(["tar", "-xf", str(archive), "-C", str(root)], check=True)
Path("artifacts/probes").mkdir(parents=True, exist_ok=True)
Path("artifacts/probes/ollama-binary.json").write_text(json.dumps({"version": release["tag_name"], "url": asset["browser_download_url"], "digest": actual, "source_commit": os.environ.get("GITHUB_SHA")}, indent=2) + "\n")
with open(os.environ["GITHUB_PATH"], "a") as handle:
    handle.write(str(root / "bin") + "\n")
