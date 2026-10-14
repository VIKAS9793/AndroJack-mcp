/**
 * Tool 4 – android_debugger
 *
 * Parses an Android/Kotlin stacktrace, identifies the error class,
 * and searches official sources for verified causes and fixes.
 * This is the most powerful debugging tool — no guesswork.
 *
 * Security note (v2.1): issuetracker.google.com indexes free-text,
 * publicly-postable, user-submitted bug reports — the highest-risk source for
 * indirect prompt injection. Its search UI is also rendered client-side, so a
 * server-side fetch returned the app shell, not issues. v2.1 therefore no
 * longer fetches it at all: the tool links to the tracker query instead,
 * which removes the injection surface while losing no actual content.
 * Documentation results flow through src/docs-search.ts and are always
 * wrapped as untrusted content.
 */

import { searchOfficialDocs, formatDocResults } from "../docs-search.js";

interface ParsedError {
  errorClass: string;
  message: string;
  topFrame: string;
  keywords: string[];
}

/**
 * Extracts the most useful signal from a raw stacktrace string.
 * Handles Java, Kotlin, and Compose crash formats.
 */
function parseStacktrace(stacktrace: string): ParsedError {
  const lines = stacktrace.split("\n").map((l) => l.trim()).filter(Boolean);

  // First line usually: "java.lang.NullPointerException: message"
  // or "FATAL EXCEPTION: main"
  let errorLine = lines.find((l) =>
    /^(java\.|android\.|kotlin\.|androidx\.|com\.|Caused by:)/.test(l)
  ) ?? lines[0] ?? stacktrace.slice(0, 200);

  // Strip "Caused by:" prefix
  errorLine = errorLine.replace(/^Caused by:\s*/i, "");

  const colonIdx = errorLine.indexOf(":");
  const errorClass = colonIdx > -1 ? errorLine.slice(0, colonIdx).trim() : errorLine.trim();
  const message = colonIdx > -1 ? errorLine.slice(colonIdx + 1).trim() : "";

  // Top at-frame
  const topFrame =
    lines.find((l) => l.startsWith("at ") && !l.includes("reflect.")) ?? "";

  // Keywords for search (short class name + key message words)
  const shortClass = errorClass.split(".").pop() ?? errorClass;
  const msgWords = message
    .split(/\s+/)
    .filter((w) => w.length > 3 && !/^\d+$/.test(w))
    .slice(0, 4);

  return {
    errorClass,
    message,
    topFrame,
    keywords: [shortClass, ...msgWords].filter(Boolean),
  };
}

/**
 * Searches official documentation for the parsed error. The issue tracker is
 * linked, not fetched (see security note above).
 */
async function searchError(parsed: ParsedError): Promise<string[]> {
  const query = [parsed.errorClass.split(".").pop() ?? "", ...parsed.keywords, parsed.message]
    .filter(Boolean)
    .join(" ");
  const outcome = await searchOfficialDocs(query, { limit: 2, maxChars: 1500 });
  const issueTrackerUrl =
    `https://issuetracker.google.com/issues?q=${encodeURIComponent(parsed.errorClass)}&s=created_time:desc`;

  return [
    outcome.results.length > 0 || outcome.notes.length > 0
      ? formatDocResults(outcome)
      : "No official documentation matched this error.",
    `**Android Issue Tracker (open in browser — not fetched):** ${issueTrackerUrl}\n` +
    `> Issue reports are public, user-submitted text. AndroJack links them rather than ` +
    `injecting them into your context; verify any workaround against official docs.`,
  ];
}

/**
 * Core handler for android_debugger tool.
 */
export async function androidDebugger(stacktrace: string): Promise<string> {
  if (!stacktrace || stacktrace.trim().length < 10) {
    return "ERROR: Provide a valid Android stacktrace (at least 10 characters).";
  }

  const truncated = stacktrace.trim().slice(0, 4000); // bound large pastes
  const parsed = parseStacktrace(truncated);

  const header =
    `## AndroJack Error Debugger\n\n` +
    `### Parsed Error\n` +
    `- **Class:** \`${parsed.errorClass}\`\n` +
    `- **Message:** ${parsed.message || "(none)"}\n` +
    `- **Top Frame:** \`${parsed.topFrame || "(not found)"}\`\n` +
    `- **Search Keywords:** ${parsed.keywords.map((k) => `\`${k}\``).join(", ")}\n\n` +
    `---\n\n` +
    `### Official Source Results\n\n`;

  const sources = await searchError(parsed);

  return (
    header +
    sources.join("\n\n---\n\n") +
    `\n\n---\n` +
    `> 🐛 GROUNDING GATE: Only propose fixes that align with the official source results above.`
  );
}
