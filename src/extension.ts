import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('AndroJack MCP extension is now active!');

    // In 2026, the standard for MCP integrations is the registerMcpServerDefinitionProvider API
    // This allows the AI tool (Copilot/Claude etc) to dynamically discover and spin up the MCP server
    const registerProvider = (vscode as any)?.lm?.registerMcpServerDefinitionProvider as
        | undefined
        | ((id: string, provider: unknown) => vscode.Disposable);

    if (!registerProvider) {
        console.warn('VS Code MCP API not available; skipping MCP provider registration.');
        return;
    }

    const mcpProvider = registerProvider('androjack', {
        provideMcpServerDefinitions() {
            // Provide a static definition referencing our single configured server
            return [{
                command: 'npx',
                args: ['-y', 'androjack-mcp@1.6.4'],
                env: { ...process.env } as Record<string, string>,
                stderr: 'inherit',
                label: 'AndroJack MCP: Verified Android Docs'
            }];
        },

        async resolveMcpServerDefinition() {
            // but for performance, directly running the compiled JS is preferred.
            
            // VS Code typings require Record<string, string | number | null>, but process.env allows undefined
            const safeEnv: Record<string, string> = {};
            for (const [key, value] of Object.entries(process.env)) {
                if (value !== undefined) {
                    safeEnv[key] = value;
                }
            }

            return {
                command: 'npx',
                args: ['-y', 'androjack-mcp@1.6.4'],
                env: safeEnv,
                // Allow standard error tracking
                stderr: 'inherit',
                label: 'AndroJack MCP: Verified Android Docs'
            };
        }
    });

    context.subscriptions.push(mcpProvider);
}

export function deactivate() {}
