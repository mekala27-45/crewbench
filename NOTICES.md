# Dependency notices

Crewbench source uses the repository LICENSE. Third-party packages retain their own licenses. Exact direct and transitive versions are recorded in package-lock.json.

Run node scripts/collect-notices.mjs after npm ci to retain the actual installed direct-dependency and font license text under site/public/notices. Its generated index records package name, installed version, declared license and local notice path. CI retains this output with the source commit. Do not present a planned file as a verified notice inventory.

The local model and Ollama binary are downloaded separately and are not redistributed in this repository. evaluation/model-lock.json pins the artifacts; artifacts/probes/model-native.json on model-probe and development results branches records the model's supplied license text, template and identity. Review those retained terms before redistributing weights.
