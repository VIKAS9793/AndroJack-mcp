/**
 * AndroJack MCP – Tool 21: Android Code Validator
 *
 * Level 3 Loop-Back Validation: the AI generates code, then immediately
 * calls this tool to validate it before returning to the user.
 *
 * Architecture:
 *   Level 1 — Tools available, AI may call them (passive)
 *   Level 2 — Grounding Gate mandates tool calls before generation (active)
 *   Level 3 — THIS TOOL: validates generated code against rules after generation (loop-back)
 *
 * The loop-back pattern is proven in production agentic systems:
 *   - Parasoft MCP (Oct 2025): rule-aware validation in C/C++ coding agents
 *   - ast-grep MCP: structural pattern matching for AI coding agents
 *   This is the Android-specific implementation of the same pattern.
 *
 * Rule engine: src/rules/android-rules.ts
 *   - 24 rules across Kotlin, XML, Gradle
 *   - Zero new dependencies (pure TypeScript RegExp)
 *   - Data-driven: new rules require no code changes
 */
import { runRules, countBySeverity, detectLanguage, } from "../rules/android-rules.js";
// ── Output formatter ──────────────────────────────────────────────────────────
function severityIcon(s) {
    return s === "error" ? "❌" : s === "warning" ? "⚠️" : "ℹ️";
}
function formatViolation(v, index) {
    return [
        `${index + 1}. ${severityIcon(v.severity)} [${v.severity.toUpperCase()}] ${v.ruleId}`,
        `   Line ${v.line}: \`${v.snippet}\``,
        `   Problem:     ${v.message}`,
        `   Fix:         ${v.replacement}`,
        `   Source:      ${v.docUrl}`,
    ].join("\n");
}
// ── Main validator function ───────────────────────────────────────────────────
export async function androidCodeValidator(code, languageHint, minSdk, targetSdk) {
    if (!code || code.trim().length < 10) {
        return "android_code_validator: No meaningful code provided. Pass a code block to validate.";
    }
    const language = detectLanguage(code, languageHint);
    const ctx = { language, minSdk, targetSdk };
    const violations = runRules(code, ctx);
    const counts = countBySeverity(violations);
    const errors = violations.filter(v => v.severity === "error");
    const warnings = violations.filter(v => v.severity === "warning");
    const infos = violations.filter(v => v.severity === "info");
    const verdict = counts.error > 0 ? "FAIL" : counts.warning > 0 ? "WARN" : "PASS";
    const verdictIcon = verdict === "PASS" ? "✅" : verdict === "WARN" ? "⚠️" : "❌";
    const lines = [];
    // Header
    lines.push("# AndroJack Code Validation Report");
    lines.push("");
    lines.push(`**Verdict:**  ${verdictIcon} ${verdict}`);
    lines.push(`**Language:** ${language}`);
    lines.push(`**Context:**  minSdk=${minSdk ?? "unset"}, targetSdk=${targetSdk ?? "unset"}`);
    lines.push(`**Summary:**  ${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info(s)`);
    lines.push("");
    if (violations.length === 0) {
        lines.push("No violations found. Code passes all AndroJack Android rules.");
        lines.push("");
        lines.push("---");
        lines.push("**Next step:** Proceed — code is grounded and rule-compliant.");
        return lines.join("\n");
    }
    // Errors first
    if (errors.length > 0) {
        lines.push(`## ❌ Errors (${errors.length}) — Must Fix Before Returning Code`);
        lines.push("");
        lines.push("These will break at runtime, cause CI failures, or fail Play Store review.");
        lines.push("");
        errors.forEach((v, i) => lines.push(formatViolation(v, i)));
        lines.push("");
    }
    // Warnings
    if (warnings.length > 0) {
        lines.push(`## ⚠️ Warnings (${warnings.length}) — Fix Unless Migrating Existing Code`);
        lines.push("");
        lines.push("Deprecated APIs — will break in a future release or violate architectural standards.");
        lines.push("");
        warnings.forEach((v, i) => lines.push(formatViolation(v, i)));
        lines.push("");
    }
    // Infos
    if (infos.length > 0) {
        lines.push(`## ℹ️ Info (${infos.length}) — Suboptimal Patterns`);
        lines.push("");
        infos.forEach((v, i) => lines.push(formatViolation(v, i)));
        lines.push("");
    }
    // Actionable instruction for the AI's next step
    lines.push("---");
    if (verdict === "FAIL") {
        lines.push("**Required action:** Fix all errors above before returning this code to the user.");
        lines.push("For each error: apply the Fix, verify against the Source URL, then re-run `android_code_validator`.");
    }
    else if (verdict === "WARN") {
        lines.push("**Required action:** Address warnings if writing new code (not migrating legacy).");
        lines.push("Re-run `android_code_validator` after fixes to confirm PASS.");
    }
    return lines.join("\n");
}
