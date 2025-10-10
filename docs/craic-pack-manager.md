# Craic Pack Manager Module Blueprint

The Craic Pack Manager expands the Builderverse system layer with a governed space for dialect packs, humour routines, and persona banter triggers. Use this document to coordinate development tasks, prompt AI collaborators, and brief contributors on release expectations.

## Mission Objectives

- Curate authentic craic packs with provenance metadata and cultural validation.
- Synchronise BobMateBuilder persona scripts with approved packs via AI hooks.
- Provide Liv with checkpoints to review tone, slang, and regional accuracy before deployment.
- Offer tooling for quick retirement or rollback of outdated craic content.

## Delivery Phases

| Phase | Target | Description |
| ----- | ------ | ----------- |
| 1. Scaffolding | v1.0 | Stand up registry schema, integrate with DialectScannerCore API, and expose pack metadata in the system manifest. |
| 2. Persona Wiring | v1.1 | Wire BobMateBuilder prompts to pull curated packs, add fallback flows, and verify tone alignment with Liv. |
| 3. Community Loop | v1.2 | Introduce submission portal, review queues, and automated provenance hashing for community-sourced craic. |

## Key Files

- `system/update_logs/Builderverse_CraicPackManager_v1.0_fullscope.json` – authoritative change log and deployment staging plan.
- `system/Builderverse_ModuleIndex.json` – registers the module as `BV-M09` with dependencies on DialectScannerCore, BobMateBuilder, and UI_Toolkit.
- `system/Builderverse_SystemManifest.json` – links persona routing and manifest pointers for the update log.

## AI Collaboration Prompts

Use the snippets below when briefing Codex, Copilot, or internal Builderverse personas:

```text
Implement Craic Pack Manager scaffolding:
- Create src/craic-pack/registry.json with regional pack metadata schema
- Add pack approval queue component using UI_Toolkit conventions
- Wire BobMateBuilder fallback prompt when no pack approved
```

```text
Liv QA checklist for new craic pack:
- Validate dialect tags align with DialectScannerCore taxonomy
- Confirm humour tone slider stays within 3.84s rhythm window
- Sign off pack provenance hash via verify_integrity --write
```

## Next Steps

1. Generate initial registry schema and placeholder packs for Belfast and Dublin dialects.
2. Expose REST or file-based interface for BobMateBuilder to fetch active packs.
3. Expand the integrity verifier to auto-detect future craic update logs as they are added.
4. Design UI mock-ups (desktop + mobile) using the Builderverse Dark Steel theme for the Craic dashboard.

Keep this page synced with progress updates so any persona or contributor jumping in understands the roadmap instantly.
