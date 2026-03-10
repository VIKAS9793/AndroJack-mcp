import * as path from 'path';
import * as fs from 'fs';
import { runTests } from '@vscode/test-electron';

function resolveVsCodeExecutablePath(): string | undefined {
	const explicitPath = process.env.VSCODE_EXECUTABLE_PATH;
	if (explicitPath) {
		return explicitPath;
	}

	if (process.platform === 'win32') {
		const localAppData = process.env.LOCALAPPDATA;
		if (localAppData) {
			const installedPath = path.join(localAppData, 'Programs', 'Microsoft VS Code', 'Code.exe');
			if (fs.existsSync(installedPath)) {
				return installedPath;
			}
		}
	}

	return undefined;
}

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Prefer an explicit executable path. On Windows, fall back to the locally
		// installed VS Code to avoid archive launch issues during local test runs.
		const vscodeExecutablePath = resolveVsCodeExecutablePath();
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			...(vscodeExecutablePath ? { vscodeExecutablePath } : {})
		});
	} catch (err) {
		console.error('Test error:', err);
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
