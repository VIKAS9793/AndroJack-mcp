/**
 * AndroJack MCP — per-session output memo (token budgeting).
 *
 * Within one MCP session, documentation the agent already received is not
 * resent: a repeated identical tool result, or a documentation page already
 * excerpted earlier, is replaced by a short pointer. Passing `refresh: true`
 * on the tool call forces the full text (for clients that compacted their
 * context). Stateless HTTP requests get a fresh memo each time, so nothing
 * is suppressed there.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";

const DEFAULT_CAPACITY = 500;

export class SessionMemo {
  private readonly outputs = new Map<string, string>();
  private readonly urls = new Set<string>();

  constructor(private readonly capacity: number = DEFAULT_CAPACITY) {}

  static digest(text: string): string {
    return createHash("sha256").update(text, "utf8").digest("hex");
  }

  /** Tool that produced this exact output earlier in the session, if any. */
  previousOutput(digest: string): string | undefined {
    return this.outputs.get(digest);
  }

  recordOutput(digest: string, tool: string): void {
    this.outputs.delete(digest);
    this.outputs.set(digest, tool);
    if (this.outputs.size > this.capacity) {
      const oldest = this.outputs.keys().next().value;
      if (oldest !== undefined) this.outputs.delete(oldest);
    }
  }

  hasUrl(url: string): boolean {
    return this.urls.has(url);
  }

  recordUrl(url: string): void {
    this.urls.delete(url);
    this.urls.add(url);
    if (this.urls.size > this.capacity) {
      const oldest = this.urls.values().next().value;
      if (oldest !== undefined) this.urls.delete(oldest);
    }
  }
}

export interface CallContext {
  memo: SessionMemo;
  refresh: boolean;
}

export const callContext = new AsyncLocalStorage<CallContext>();
