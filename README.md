# Builderverse Bob Mate

This repository houses Builderverse persona assets and configuration files. The latest update introduces a structured system manifest for coordinating module updates across the Builderverse stack and reorganises supporting files into a clearer directory layout.

## Repository Structure

```
builderverse-bob-mate/
├── assets/                # Visual and media artefacts (e.g. Bob avatar render)
├── config/                # Runtime configuration and protection stacks
├── deploy/                # Deployment and packaging scripts
├── logs/                  # Historical Builderverse log snapshots
├── src/                   # Persona source files, HTML mock-ups, and AI logic
└── system/                # Manifests, registries, and integrity tooling
```

The new layout mirrors the recommended Builderverse system architecture so Codex, CAI, and CI workflows can resolve files predictably.

## Key System Files

- `system/Builderverse_SystemManifest.json` – top-level manifest linking Git metadata, AI personas, deployment policy, and integrity tracking for the Builderverse ecosystem.
- `system/Builderverse_ModuleIndex.json` – registry describing each module, persona link, and dependency relationship within the stack.
- `system/update_logs/Builderverse_MasonryEstimatorPro+_v2.4_fullscope.json` – detailed change log for the MasonryEstimatorPro+ refactor, including removed calculators, rebuilt logic, and AI automation hooks.
- `system/Builderverse_ReleaseOrchestrator.json` – CI/CD coordination plan that runs integrity verification, syncs the module registry, and dispatches persona notifications during releases.

## Usage

1. Review the system manifest to understand orchestration hooks and deployment automation.
2. Consult the module index before updating or deprecating Builderverse subsystems.
3. Reference the MasonryEstimatorPro+ update log when working on masonry estimation tooling or Builderverse AI integrations.

These files are designed to act as both human-readable documentation and AI-ready prompts for Builderverse automation workflows.

## Integrity Verification

Run the Builderverse integrity verifier before releasing updates to confirm the manifest, module index, and masonry update log are in sync.

```bash
npm run verify
```

The script checks that each JSON file exists, validates its integrity hash tag, confirms cross-file links, and raises an error if anything is missing or misaligned.

## Deployment

The macOS deployment script delegates to the integrity verifier before continuing with packaging steps.

```bash
./deploy/MacDeploy.sh
```

If the verification fails, the script exits early so you can update the manifest, registry, or update log before distributing a new Builderverse build.

## FAQ

### Why does the diff show a red line with `-1`?

The original repository only contained a single placeholder line (`Placeholder content for README.md`) with no newline at the end of the file. When the README was replaced with the fuller documentation above, Git recorded the removal of that placeholder line as a red `-1` entry in the diff. The new content is now tracked normally, and the red line simply reflects the deletion of the outdated placeholder.
