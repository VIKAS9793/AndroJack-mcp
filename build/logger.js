/**
 * AndroJack MCP — Production Logger
 *
 * All output goes to stderr. stdout is reserved exclusively for the MCP
 * JSON-RPC protocol — writing anything else there corrupts the transport.
 *
 * Log levels follow the standard severity ladder. In production (NODE_ENV=production)
 * only WARN and above are emitted to reduce noise; in development all levels print.
 */
const LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
const ENV_LEVEL = (process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "warn" : "debug"));
const MIN_LEVEL = LEVELS[ENV_LEVEL] ?? LEVELS.debug;
function emit(level, message, meta) {
    if (LEVELS[level] < MIN_LEVEL)
        return;
    const entry = {
        ts: new Date().toISOString(),
        level,
        msg: message,
    };
    if (meta && Object.keys(meta).length > 0) {
        entry.meta = meta;
    }
    // JSON lines format — easy to parse with any log aggregator (Datadog, Loki, CloudWatch)
    process.stderr.write(JSON.stringify(entry) + "\n");
}
export const logger = {
    debug: (msg, meta) => emit("debug", msg, meta),
    info: (msg, meta) => emit("info", msg, meta),
    warn: (msg, meta) => emit("warn", msg, meta),
    error: (msg, meta) => emit("error", msg, meta),
    /**
     * Wraps an async tool handler with timing + error telemetry.
     * Usage: const result = await logger.timed("tool_name", () => myTool(args))
     */
    async timed(toolName, fn) {
        const start = Date.now();
        try {
            const result = await fn();
            emit("info", "tool_call_ok", { tool: toolName, ms: Date.now() - start });
            return result;
        }
        catch (err) {
            emit("error", "tool_call_error", {
                tool: toolName,
                ms: Date.now() - start,
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }
    },
};
