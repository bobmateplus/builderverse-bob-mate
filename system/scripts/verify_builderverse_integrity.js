#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const rootDir = process.cwd();
const systemDir = path.join(rootDir, 'system');
const args = process.argv.slice(2);
const writeMode = args.includes('--write') || args.includes('-w');

const files = {
  manifest: {
    label: 'System Manifest',
    path: path.join(systemDir, 'Builderverse_SystemManifest.json'),
    integrityKey: 'manifest_hash'
  },
  moduleIndex: {
    label: 'Module Index',
    path: path.join(systemDir, 'Builderverse_ModuleIndex.json'),
    integrityKey: 'registry_hash'
  },
  masonryUpdate: {
    label: 'Masonry Update Log',
    path: path.join(systemDir, 'update_logs', 'Builderverse_MasonryEstimatorPro+_v2.4_fullscope.json'),
    integrityKey: 'hash'
  },
  craicUpdate: {
    label: 'Craic Pack Update Log',
    path: path.join(systemDir, 'update_logs', 'Builderverse_CraicPackManager_v1.0_fullscope.json'),
    integrityKey: 'hash'
  }
};

function readJson(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(contents);
}

function computeCanonicalHash(json) {
  const clone = JSON.parse(JSON.stringify(json));
  if (clone.integrity) {
    delete clone.integrity;
  }
  const canonical = `${JSON.stringify(clone, null, 2)}\n`;
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function extractHashValue(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const match = value.match(/[0-9a-f]{64}$/i);
  if (match) {
    return match[0].toLowerCase();
  }
  const suffixMatch = value.match(/[0-9a-f]{12}$/i);
  return suffixMatch ? suffixMatch[0].toLowerCase() : null;
}

function writeIntegrityHash(filePath, json, integrityKey, hash, label) {
  const clone = { ...(json || {}) };
  const integrity = typeof clone.integrity === 'object' && clone.integrity !== null
    ? { ...clone.integrity }
    : {};
  integrity[integrityKey] = `SHA256-${hash}`;
  clone.integrity = integrity;
  fs.writeFileSync(filePath, `${JSON.stringify(clone, null, 2)}\n`, 'utf8');
  console.log(`✏️  ${label} integrity hash updated [${hash.slice(0, 12)}]`);
  return clone;
}

function verifyIntegrity({ label, path: filePath, integrityKey }) {
  const relativePath = path.relative(rootDir, filePath);
  if (!fs.existsSync(filePath)) {
    console.error(`❌  Missing ${label}: ${relativePath}`);
    return { ok: false, filePath, relativePath };
  }

  let json;
  try {
    json = readJson(filePath);
  } catch (error) {
    console.error(`❌  Failed to parse ${label}: ${error.message}`);
    return { ok: false, filePath, relativePath };
  }

  const storedValue = json.integrity?.[integrityKey]
    ?? json.integrity?.manifest_hash
    ?? json.integrity?.registry_hash
    ?? json.integrity?.hash;

  const canonicalHash = computeCanonicalHash(json);
  const storedHash = extractHashValue(storedValue);
  const matches = storedHash ? canonicalHash === storedHash : false;

  if (matches) {
    console.log(`✅  ${label} integrity confirmed [${canonicalHash.slice(0, 12)}]`);
    return { ok: true, json, filePath, relativePath };
  }

  if (writeMode) {
    const updatedJson = writeIntegrityHash(filePath, json, integrityKey, canonicalHash, label);
    return { ok: true, json: updatedJson, filePath, relativePath };
  }

  console.warn(`⚠️  ${label} integrity mismatch or missing hash tag`);
  console.warn(`    stored: ${storedValue ?? 'N/A'}`);
  console.warn(`    expected: SHA256-${canonicalHash}`);
  return { ok: false, json, filePath, relativePath };
}

function checkManifestLinks(manifestJson) {
  if (!manifestJson) {
    return false;
  }
  const links = manifestJson.linked_files || {};
  const keys = Object.keys(links);
  let ok = true;

  keys.forEach((key) => {
    const relPath = links[key];
    if (typeof relPath !== 'string') {
      console.warn(`⚠️  Manifest link '${key}' is not a path string.`);
      ok = false;
      return;
    }
    const resolved = path.join(rootDir, relPath);
    if (!fs.existsSync(resolved)) {
      console.error(`❌  Manifest link '${key}' missing: ${relPath}`);
      ok = false;
    } else {
      console.log(`✅  Manifest link '${key}' resolved -> ${relPath}`);
    }
  });

  return ok;
}

function checkModuleIndexLinks(moduleIndexJson) {
  if (!moduleIndexJson) {
    return false;
  }
  let ok = true;
  const modules = Array.isArray(moduleIndexJson.core_modules) ? moduleIndexJson.core_modules : [];

  modules.forEach((mod) => {
    if (mod.linked_update_file) {
      const updatePath = path.join(systemDir, 'update_logs', mod.linked_update_file);
      if (!fs.existsSync(updatePath)) {
        console.error(`❌  Missing linked update for module '${mod.name}': ${mod.linked_update_file}`);
        ok = false;
      } else {
        console.log(`✅  Module '${mod.name}' linked update found.`);
      }
    }
  });

  return ok;
}

function checkCrossReferences(manifestResult, moduleIndexResult, updateResults) {
  const manifestJson = manifestResult.json;
  const moduleIndexJson = moduleIndexResult.json;
  let ok = true;

  if (manifestJson && moduleIndexResult.relativePath) {
    const expectedModuleIndexPath = moduleIndexResult.relativePath;
    if (manifestJson.linked_files?.module_index !== expectedModuleIndexPath) {
      console.warn(`⚠️  Manifest linked module index path differs from expected (${manifestJson.linked_files?.module_index} vs ${expectedModuleIndexPath}).`);
      ok = false;
    } else {
      console.log(`✅  Manifest links module index at ${expectedModuleIndexPath}.`);
    }
  }

  const modules = Array.isArray(moduleIndexJson?.core_modules) ? moduleIndexJson.core_modules : [];
  const manifestLinks = manifestJson?.linked_files || {};

  updateResults.forEach((updateResult) => {
    if (!updateResult.json) {
      ok = false;
      return;
    }

    const subsystem = updateResult.json.system?.subsystem;
    const relativePath = updateResult.relativePath;
    const moduleEntry = modules.find((mod) => mod.name === subsystem);

    if (!moduleEntry) {
      console.error(`❌  Module index missing entry for subsystem '${subsystem}'.`);
      ok = false;
    } else {
      console.log(`✅  Module index includes '${subsystem}'.`);
      if (moduleEntry.linked_update_file) {
        const expectedFileName = path.basename(relativePath);
        if (moduleEntry.linked_update_file !== expectedFileName) {
          console.warn(`⚠️  Module '${subsystem}' linked update file differs (${moduleEntry.linked_update_file} vs ${expectedFileName}).`);
          ok = false;
        }
      }
    }

    const manifestHasLink = Object.values(manifestLinks).includes(relativePath);
    if (!manifestHasLink) {
      console.warn(`⚠️  Manifest missing direct link to update log for '${subsystem}' (${relativePath}).`);
      ok = false;
    } else {
      console.log(`✅  Manifest links update log for '${subsystem}'.`);
    }
  });

  return ok;
}

console.log('\n🔍  Running Builderverse Integrity Check...\n');
if (writeMode) {
  console.log('✏️  Write mode enabled — integrity hashes will be updated if mismatched.\n');
}

const manifestResult = verifyIntegrity(files.manifest);
const moduleIndexResult = verifyIntegrity(files.moduleIndex);
const masonryResult = verifyIntegrity(files.masonryUpdate);
const craicResult = verifyIntegrity(files.craicUpdate);

const manifestOk = checkManifestLinks(manifestResult.json);
const moduleLinksOk = checkModuleIndexLinks(moduleIndexResult.json);
const crossOk = checkCrossReferences(manifestResult, moduleIndexResult, [masonryResult, craicResult]);

const success = [
  manifestResult.ok,
  moduleIndexResult.ok,
  masonryResult.ok,
  craicResult.ok,
  manifestOk,
  moduleLinksOk,
  crossOk
].every(Boolean);

if (success) {
  console.log('\n✨  All Builderverse files verified. System integrity stable.\n');
  process.exit(0);
}

console.log('\n⚠️  Integrity drift detected — review hashes or missing links.\n');
process.exit(1);
