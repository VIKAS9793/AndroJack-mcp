"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
function activate(context) {
    console.log('AndroJack MCP extension is now active!');
    // In 2026, the standard for MCP integrations is the registerMcpServerDefinitionProvider API
    // This allows the AI tool (Copilot/Claude etc) to dynamically discover and spin up the MCP server
    const mcpProvider = vscode.lm.registerMcpServerDefinitionProvider('androjack', {
        provideMcpServerDefinitions() {
            // Provide a static definition referencing our single configured server
            return [{
                    command: 'npx',
                    args: ['-y', 'androjack-mcp'],
                    env: { ...process.env },
                    stderr: 'inherit',
                    label: 'AndroJack MCP: Verified Android Docs'
                }];
        },
        async resolveMcpServerDefinition() {
            // but for performance, directly running the compiled JS is preferred.
            // VS Code typings require Record<string, string | number | null>, but process.env allows undefined
            const safeEnv = {};
            for (const [key, value] of Object.entries(process.env)) {
                if (value !== undefined) {
                    safeEnv[key] = value;
                }
            }
            return {
                command: 'npx',
                args: ['-y', 'androjack-mcp'],
                env: safeEnv,
                // Allow standard error tracking
                stderr: 'inherit',
                label: 'AndroJack MCP: Verified Android Docs'
            };
        }
    });
    context.subscriptions.push(mcpProvider);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map