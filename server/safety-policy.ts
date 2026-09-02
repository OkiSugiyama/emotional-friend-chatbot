import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * High-risk routing policy loader.
 *
 * The trigger set is configuration, not source. `server/safety-policy.json` is
 * the shipped, public, illustrative set; the evaluated set never enters the
 * repository. Resolution, in order:
 *
 *   1. `SAFETY_POLICY_JSON`  — inline JSON. How production is served.
 *   2. `SAFETY_POLICY_PATH`  — a file path, for local overrides.
 *   3. `server/safety-policy.local.json` — gitignored, the usual local case.
 *   4. `server/safety-policy.json` — the shipped illustrative set.
 *
 * The loaded policy's own `policyVersion` is what gets recorded on every routed
 * response, so a run can never be labelled with a version whose patterns it did
 * not use. A production runtime refuses to start on an `evaluated: false`
 * policy; see the guard at the end of `loadSafetyPolicy`.
 */

export interface SafetyCategory {
  readonly category: string;
  readonly pattern: RegExp;
  readonly responseText: string;
  /**
   * A phrase this category's own pattern matches, verified at load. Tests route
   * through it instead of hardcoding a trigger literal, so no test source in
   * this repository carries part of the trigger inventory.
   */
  readonly sample: string;
}

export interface SafetyPolicy {
  readonly policyVersion: string;
  readonly copyVersion: string;
  /** True only for a set an evaluation has actually been run against. */
  readonly evaluated: boolean;
  /**
   * Whether the response copy names no region-specific resource. False once the
   * copy names one, so the metadata on a routed response can never claim
   * neutrality the wording does not have.
   */
  readonly locationNeutral: boolean;
  /** Human-readable origin, for diagnostics. Never a full filesystem path. */
  readonly source: string;
  readonly categories: ReadonlyArray<SafetyCategory>;
}

const SHIPPED_FILE = "safety-policy.json";
const LOCAL_FILE = "safety-policy.local.json";
const MAX_PATTERN_LENGTH = 2_000;

function beside(name: string): string {
  return fileURLToPath(new URL(name, import.meta.url));
}

/**
 * Deployments have no filesystem to put a gitignored file on, so the evaluated
 * policy reaches production as `SAFETY_POLICY_JSON` — set in the host's
 * environment, never committed. That is the only resolution step that works on
 * a serverless deployment; the file steps are for local work.
 */
function readPolicySource(): { raw: string; source: string } {
  const inline = process.env.SAFETY_POLICY_JSON?.trim();
  if (inline) return { raw: inline, source: "SAFETY_POLICY_JSON" };

  const configured = process.env.SAFETY_POLICY_PATH?.trim();
  if (configured) {
    if (!existsSync(configured)) {
      throw new Error("SAFETY_POLICY_PATH is set but names no existing file.");
    }
    return { raw: readFileSync(configured, "utf8"), source: "SAFETY_POLICY_PATH" };
  }

  const local = beside(LOCAL_FILE);
  if (existsSync(local)) return { raw: readFileSync(local, "utf8"), source: LOCAL_FILE };
  return { raw: readFileSync(beside(SHIPPED_FILE), "utf8"), source: SHIPPED_FILE };
}

/**
 * True when this process is serving real users. Vercel sets VERCEL_ENV; NODE_ENV
 * covers other hosts. Test runners must never trip this, so an explicit
 * NODE_ENV=test wins.
 */
function isProductionRuntime(): boolean {
  if (process.env.NODE_ENV === "test") return false;
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Safety policy field "${field}" must be a non-empty string.`);
  }
  return value;
}

function compile(pattern: unknown, category: string): RegExp {
  const source = requireText(pattern, `categories[${category}].pattern`);
  if (source.length > MAX_PATTERN_LENGTH) {
    throw new Error(`Safety policy pattern for "${category}" exceeds ${MAX_PATTERN_LENGTH} characters.`);
  }
  try {
    return new RegExp(source, "i");
  } catch (cause) {
    throw new Error(`Safety policy pattern for "${category}" is not a valid regular expression.`, { cause });
  }
}

export function loadSafetyPolicy(): SafetyPolicy {
  const { raw, source } = readPolicySource();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new Error(`Safety policy in ${source} is not readable JSON.`, { cause });
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Safety policy in ${source} must be a JSON object.`);
  }

  const record = parsed as Record<string, unknown>;
  const policyVersion = requireText(record.policyVersion, "policyVersion");
  const copyVersion = requireText(record.copyVersion, "copyVersion");
  if (typeof record.evaluated !== "boolean") {
    throw new Error('Safety policy field "evaluated" must be a boolean.');
  }
  if (!Array.isArray(record.categories) || record.categories.length === 0) {
    throw new Error('Safety policy field "categories" must be a non-empty array.');
  }

  const seen = new Set<string>();
  const categories = record.categories.map((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      throw new Error(`Safety policy in ${source} has a category that is not an object.`);
    }
    const item = entry as Record<string, unknown>;
    const category = requireText(item.category, "categories[].category");
    if (seen.has(category)) {
      throw new Error(`Safety policy in ${source} declares "${category}" more than once.`);
    }
    seen.add(category);
    const pattern = compile(item.pattern, category);
    const sample = requireText(item.sample, `categories[${category}].sample`);
    if (!pattern.test(sample)) {
      throw new Error(`Safety policy sample for "${category}" does not match its own pattern.`);
    }
    return {
      category,
      pattern,
      responseText: requireText(item.responseText, `categories[${category}].responseText`),
      sample,
    } satisfies SafetyCategory;
  });

  // A deployment must never serve the illustrative set. It exists so a local
  // clone has something to exercise the routing path with; it is four obvious
  // phrases, materially weaker than the evaluated set, and shipping it would
  // silently downgrade the safety routing of a live service. Fail to start
  // instead — a deployment that will not boot is recoverable, one that quietly
  // under-routes is not.
  if (!record.evaluated && isProductionRuntime()) {
    throw new Error(
      `Refusing to start: the safety policy loaded from ${source} is marked evaluated: false. ` +
        "Production must be given the evaluated policy through SAFETY_POLICY_JSON.",
    );
  }

  const locationNeutral = record.locationNeutral === undefined ? true : record.locationNeutral;
  if (typeof locationNeutral !== "boolean") {
    throw new Error('Safety policy field "locationNeutral" must be a boolean when present.');
  }

  return {
    policyVersion,
    copyVersion,
    evaluated: record.evaluated,
    locationNeutral,
    source,
    categories,
  };
}

export const safetyPolicy: SafetyPolicy = loadSafetyPolicy();
