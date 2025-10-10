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
  if (!fs.existsSync(filePath)) {
    console.error(`❌  Missing ${label}: ${path.relative(rootDir, filePath)}`);
    return { ok: false };
  }

  let json;
  try {
    json = readJson(filePath);
  } catch (error) {
    console.error(`❌  Failed to parse ${label}: ${error.message}`);
    return { ok: false };
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
    return { ok: true, json };
  }

  if (writeMode) {
    const updatedJson = writeIntegrityHash(filePath, json, integrityKey, canonicalHash, label);
    return { ok: true, json: updatedJson };
  }

  console.warn(`⚠️  ${label} integrity mismatch or missing hash tag`);
  console.warn(`    stored: ${storedValue ?? 'N/A'}`);
  console.warn(`    expected: SHA256-${canonicalHash}`);
  return { ok: false, json };
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

function checkCrossReferences(manifestJson, moduleIndexJson, masonryJson) {
  let ok = true;

  if (manifestJson && moduleIndexJson) {
    const expectedModuleIndexPath = 'system/Builderverse_ModuleIndex.json';
    if (manifestJson.linked_files?.module_index !== expectedModuleIndexPath) {
      console.warn('⚠️  Manifest linked module index path differs from expected.');
      ok = false;
    }
  }

  if (moduleIndexJson && masonryJson) {
    const moduleEntry = (moduleIndexJson.core_modules || []).find(
      (mod) => mod.name === masonryJson.system?.subsystem
    );
    if (!moduleEntry) {
      console.error(`❌  Module index missing entry for subsystem '${masonryJson.system?.subsystem}'.`);
      ok = false;
    } else {
      console.log(`✅  Module index includes '${masonryJson.system?.subsystem}'.`);
    }
  }

  return ok;
}

console.log('\n🔍  Running Builderverse Integrity Check...\n');
if (writeMode) {
  console.log('✏️  Write mode enabled — integrity hashes will be updated if mismatched.\n');
}

const manifestResult = verifyIntegrity(files.manifest);
const moduleIndexResult = verifyIntegrity(files.moduleIndex);
const masonryResult = verifyIntegrity(files.masonryUpdate);

const manifestOk = checkManifestLinks(manifestResult.json);
const moduleLinksOk = checkModuleIndexLinks(moduleIndexResult.json);
const crossOk = checkCrossReferences(manifestResult.json, moduleIndexResult.json, masonryResult.json);

const success = [
  manifestResult.ok,
  moduleIndexResult.ok,
  masonryResult.ok,
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
