# Builderverse Bob Mate Repository Structure Overview

This guide captures the repository layout before the system layer upgrade and the organised structure now committed to source control. Share it with collaborators or automation agents (like Codex) whenever they need a quick understanding of where to place new assets.

## Before: Flat Layout

```
builderverse-bob-mate/
├── BobCore.ai
├── CrackPack.yaml
├── LegacyLog.json
├── MacDeploy.sh
├── ProtectionStack.conf
├── README.md
├── TrackDropper.js
├── VoiceTrigger.lock
├── bob-avatar.png
├── index.html
├── index 3.html
├── index 5.html
└── index 6.html
```

The repo originally grouped code, configuration, deployment scripts, and media in a single directory, making it difficult for Builderverse tooling to target the right files.

## After: System Layer + Structured Directories

```
builderverse-bob-mate/
├── README.md
├── assets/
│   └── bob-avatar.png
├── config/
│   ├── CrackPack.yaml
│   ├── ProtectionStack.conf
│   └── VoiceTrigger.lock
├── deploy/
│   └── MacDeploy.sh
├── docs/
│   ├── structure-overview.md
│   └── craic-pack-manager.md
├── logs/
│   └── LegacyLog.json
├── package.json
├── src/
│   ├── BobCore.ai
│   ├── TrackDropper.js
│   ├── index.html
│   ├── index 3.html
│   ├── index 5.html
│   └── index 6.html
└── system/
    ├── Builderverse_ModuleIndex.json
    ├── Builderverse_ReleaseOrchestrator.json
    ├── Builderverse_SystemManifest.json
    ├── scripts/
    │   └── verify_builderverse_integrity.js
    └── update_logs/
        ├── Builderverse_MasonryEstimatorPro+_v2.4_fullscope.json
        └── Builderverse_CraicPackManager_v1.0_fullscope.json
```

This hierarchy separates responsibilities:

- **assets/** holds visual artefacts such as the Bob avatar render.
- **config/** stores runtime configuration and protection stacks.
- **deploy/** contains platform-specific deployment scripts that now run the integrity verifier.
- **docs/** provides quick references like this structure comparison for future contributors.
- **logs/** tracks legacy Builderverse snapshots.
- **src/** houses HTML mock-ups, AI logic, and persona content.
- **system/** bundles the Builderverse system layer: manifest, module index, update logs (masonry + craic packs), and integrity tooling.

## Integrity Workflow Cheatsheet

- `npm run verify` – confirm manifests, registries, and logs are in sync before releasing.
- `npm run sync-integrity` – refresh stored hash tags after intentional JSON edits.
- `./deploy/MacDeploy.sh` – macOS pipeline that aborts when integrity drift is detected.

Keep this document updated if new top-level directories are added so that every Builderverse persona and automation agent knows exactly where to plug in.
