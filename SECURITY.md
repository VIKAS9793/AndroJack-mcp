# Security Policy

## Supported Versions

The following versions of androjack-mcp are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.1.x   | :white_check_mark: |
| 2.0.x   | :warning: (critical fixes only — upgrade: redirect allowlist bypass and incomplete content sanitization are fixed in 2.1.0) |
| 1.7.x   | :x:                |
| < 1.7   | :x:                |

## Secure Defaults

- Streamable HTTP binds to loopback (`127.0.0.1`) by default. Remote binding requires explicit opt-in with `serve --allow-remote`.
- **(v2.1.0)** Optional bearer-token authentication (`ANDROJACK_HTTP_TOKEN`, constant-time comparison). `serve` refuses a remote bind when a Google Developer Knowledge API key is configured without a token, and warns on any unauthenticated remote bind.
- Outbound documentation fetches are restricted to the authoritative domain allowlist, must use HTTPS on the default port, and may not carry embedded credentials.
- **(v2.1.0)** Redirects are followed manually and every hop is re-validated against the allowlist (max 3 hops). In 2.0.x and earlier, `fetch()` followed redirects automatically, so an allowlisted host could redirect a fetch to any origin.
- HTTP requests are bounded: request bodies are capped at 1 MiB on every transport, active sessions and concurrent stateless requests are limited, **idle sessions are evicted (v2.1.0)**, and `Origin` / `Host` headers are validated for local transport safety. The remote-bind policy is enforced inside `startHttpServer`, so `--http` and `serve` behave the same.
- All published tools are read-only and annotated `readOnlyHint: true`, `destructiveHint: false`.
- **(v2.1.0)** *All* externally-fetched content passes through one choke point (`src/docs-search.ts`) that normalizes it (NFKC, invisible characters removed), redacts structural injection patterns and spoofed boundary tags, and wraps it in an `<UNTRUSTED_EXTERNAL_CONTENT>` block with escaped attributes. (The 2.0.0 version of this document claimed this for all content; in 2.0.0 only `android_debugger` applied it.)
- **(v2.1.0)** `issuetracker.google.com` (public, user-submitted text) is linked, not fetched.
- **(v2.1.0)** The optional Google Developer Knowledge API key is sent only in the `X-Goog-Api-Key` header — never in URLs, cache keys, logs, or error messages — and credential headers are stripped on any cross-origin redirect.
- **(v2.1.0) Data sent to Google:** when that key is set, documentation search queries go to Google's API. For `android_debugger` this includes the exception class and message words, which can contain file paths or user data. Leave the key unset or use `ANDROJACK_OFFLINE=1` when that is not acceptable.
- **(v2.1.0)** `ANDROJACK_OFFLINE=1` guarantees zero outbound requests (enforced in the fetch layer).

## Known Limitations

- Pattern-based injection filtering cannot detect every semantic injection. The untrusted-content boundary is the primary defence; the filter is defence in depth.
- The validator is a regex rule engine over source text, not a compiler or Lint. A PASS means no known anti-pattern matched.

## Reporting a Vulnerability

We take the security of androjack-mcp seriously. If you believe you have found a security vulnerability, please do **not** open a public issue. Instead, please report it privately.

Please send an email to **vikassahani17@gmail.com**.

When reporting, please include:
- A description of the vulnerability.
- Steps to reproduce (if possible).
- Potential impact.

We will acknowledge your report within 48 hours and provide a timeline for a fix if necessary.

---
*Maintained by [Vikas Sahani](https://github.com/VIKAS9793)*
