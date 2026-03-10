import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Let @vscode/test-electron download a platform-appropriate VS Code build
		// unless the environment explicitly provides one.
		const vscodeExecutablePath = process.env.VSCODE_EXECUTABLE_PATH;
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
