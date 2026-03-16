import * as path from 'path';
import { runTests } from '@vscode/test-electron';

const VSCODE_TEST_VERSION = '1.90.0';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			version: VSCODE_TEST_VERSION,
			...(process.env.VSCODE_EXECUTABLE_PATH
				? { vscodeExecutablePath: process.env.VSCODE_EXECUTABLE_PATH }
				: {})
		});
	} catch (err) {
		console.error('Test error:', err);
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
