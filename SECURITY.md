# Security Policy

## Supported Versions

The following versions of androjack-mcp are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.6.x   | :white_check_mark: |
| < 1.6   | :x:                |

## Secure Defaults

- Streamable HTTP binds to loopback (`127.0.0.1`) by default. Remote binding requires explicit opt-in with `serve --allow-remote`.
- Outbound documentation fetches are restricted to the authoritative domain allowlist and must use HTTPS.
- HTTP requests are bounded: request bodies are capped, active sessions are limited, and `Origin` / `Host` headers are validated for local transport safety.
- All published tools are read-only and do not require user credentials for documentation access.

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
