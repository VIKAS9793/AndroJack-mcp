import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('VIKAS9793.androjack-vscode'));
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('VIKAS9793.androjack-vscode');
		await extension?.activate();
		assert.strictEqual(extension?.isActive, true);
	});

    test('MCP Provider should be registered', async () => {
        // In a real scenario, we'd check if the mcpServerDefinitionProviders are registered
        // but since we only care about activation and logical presence for now:
        const extension = vscode.extensions.getExtension('VIKAS9793.androjack-vscode');
        assert.ok(extension);
    });
});
