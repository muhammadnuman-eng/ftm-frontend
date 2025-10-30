#!/usr/bin/env node
import {
    existsSync,
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

const root = resolve(__dirname, "..");
const rootPkg = readJson(resolve(root, "package.json"));

const SHOULD_FIX =
    process.argv.includes("--fix") || process.env.PIN_DEPS_FIX === "1";

function findWorkspacePackageJsons(rootDir) {
    const results = [resolve(rootDir, "package.json")];
    const roots = ["apps", "packages"];
    for (const r of roots) {
        const base = resolve(rootDir, r);
        if (!existsSync(base)) continue;
        for (const entry of readdirSync(base)) {
            const full = resolve(base, entry);
            try {
                if (statSync(full).isDirectory()) {
                    const pkgPath = resolve(full, "package.json");
                    if (existsSync(pkgPath)) results.push(pkgPath);
                }
            } catch {}
        }
    }
    return results;
}

function stripRange(version) {
    return typeof version === "string" ? version.replace(/^[~^]/, "") : version;
}

function checkAndFixRanges(pkgPath, shouldFix) {
    const pkg = readJson(pkgPath);
    const sections = [
        "dependencies",
        "devDependencies",
        "peerDependencies",
        "optionalDependencies",
    ];
    const offenders = [];
    for (const section of sections) {
        const deps = pkg[section];
        if (!deps) continue;
        for (const [name, ver] of Object.entries(deps)) {
            if (typeof ver === "string" && /^[~^]/.test(ver)) {
                offenders.push({ pkgPath, section, name, version: ver });
                if (shouldFix) deps[name] = stripRange(ver);
            }
        }
    }
    if (shouldFix && offenders.length > 0) {
        writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 4)}\n`, "utf8");
    }
    return offenders;
}

// Enforce exact versions across all workspace package.json files
const pkgPaths = findWorkspacePackageJsons(root);
let offenders = [];
for (const p of pkgPaths)
    offenders = offenders.concat(checkAndFixRanges(p, SHOULD_FIX));

if (offenders.length > 0 && !SHOULD_FIX) {
    console.error("Found non-pinned versions (using ^ or ~):");
    for (const o of offenders) {
        console.error(
            ` - ${o.pkgPath} -> ${o.section}.${o.name}: ${o.version}`,
        );
    }
    console.error(
        "Re-run with --fix or set PIN_DEPS_FIX=1 to strip ranges automatically.",
    );
    process.exit(1);
}
if (offenders.length > 0 && SHOULD_FIX) {
    console.log(
        `Pinned ${offenders.length} dependency versions by removing ^/~ ranges.`,
    );
}

const overrides = rootPkg?.pnpm?.overrides || {};

const lockPath = resolve(root, "pnpm-lock.yaml");
let lockText = "";
try {
    lockText = readFileSync(lockPath, "utf8");
} catch {
    console.warn(
        "pnpm-lock.yaml not found; ensure you have installed dependencies once.",
    );
    process.exit(0);
}

const failures = [];
for (const [name, version] of Object.entries(overrides)) {
    // Simple check: ensure a line like 'name: version' appears in lockfile specifier section
    const pattern = new RegExp(`(^|\\n)\\s*${name}:\\s*${version}(\\n|$)`);
    if (!pattern.test(lockText)) {
        failures.push({ name, version });
    }
}

if (failures.length > 0) {
    console.error("Pinned dependency versions not satisfied in lockfile:");
    for (const f of failures) {
        console.error(` - ${f.name} -> ${f.version}`);
    }
    console.error(
        "Run: pnpm install --lockfile-only to update lockfile with overrides, or pnpm install to re-resolve.",
    );
    process.exit(1);
}

console.log("Pinned dependency versions verified.");
