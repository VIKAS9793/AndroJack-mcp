name: Bug Report
description: File a report to help us improve AndroJack-mcp
title: "[BUG] <Short description of the bug>"
labels: [bug]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report! 🤖
  - type: input
    id: environment
    attributes:
      label: Environment
      description: What IDE (Cursor, Windsurf, etc.) and Node.js version are you using?
      placeholder: e.g., Cursor v0.40, Node v18.1.0
    validations:
      required: true
  - type: textarea
    id: reproduce
    attributes:
      label: Reproduction Steps
      description: How can we reproduce the issue?
      placeholder: |
        1. Ask the AI to build X
        2. Tool call Y fails with error Z
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What did you expect to happen?
    validations:
      required: true
  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots/Logs
      description: If applicable, add screenshots or paste terminal logs.
