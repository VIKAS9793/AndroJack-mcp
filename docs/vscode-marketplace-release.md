# VS Code Marketplace Release Checklist

Use `feature/vscode-extension` as the source branch for the VS Code extension release flow.

For the `1.6.4` release, keep the VS Code wrapper version, the pinned MCP package version, and the Marketplace release notes aligned to `1.6.4`.

## Local release steps

1. Publish the MCP server to npm first.
   - Confirm `androjack-mcp@<version>` is live before touching the wrapper pin.
2. Switch to the extension branch or its dedicated worktree.
   - `git switch feature/vscode-extension`
3. Update `package.json`, `src/extension.ts`, and `README.md` for the exact pinned MCP version.
4. Package the VSIX.
   - `npm run package:vsix`
5. Validate that the packaged VSIX exposes the README to Marketplace and VS Code.
   - `npm run verify:vsix`
6. Confirm the top section of `CHANGELOG.md` matches the version being packaged.
   - For this release: `## 1.6.4`
6. Replace the local install with the packaged VSIX.
   - `code --install-extension ./androjack-vscode-<version>.vsix --force`
7. Open the extension details page in VS Code and confirm the README renders and the icon is visible.

## Marketplace upload steps

1. Keep the wrapper version aligned with the pinned MCP version for the release.
2. Build and validate the release archive.
   - `npm run release:manual`
3. Copy the top `CHANGELOG.md` entry into the Marketplace release notes field.
4. Upload the generated `androjack-vscode-<version>.vsix` to the Marketplace using your manual publisher flow.
5. Confirm the Marketplace version matches the local package version and the listing no longer shows the default puzzle-piece icon.
6. Reinstall or update from the Marketplace if VS Code is still pinned to an older local install.

## Optional token-based publish

If you later switch back to CLI publishing:

1. Export a Visual Studio Marketplace personal access token as `VSCE_PAT`.
2. Run `npm run publish:marketplace`.
3. If using GitHub tags, use the namespaced workflow trigger format: `vscode-v<version>`.

## Expected release artifacts

- `androjack-vscode-<version>.vsix` exists at the repo root.
- The VSIX contains the packaged README asset at `extension/readme.md`.
- The VSIX contains `extension/assets/marketplace-icon.png`.
- `.vsixmanifest` contains `Microsoft.VisualStudio.Services.Content.Details` pointing to the packaged README asset.

## Post-publish verification

1. Check the Marketplace details page for the new version.
2. Install the published extension into a clean VS Code profile.
3. Confirm the installed extension directory includes the packaged README file.
4. Confirm the extension details view does not show `No README available.`
5. Confirm the extension list/details view shows the packaged icon instead of the default puzzle-piece glyph.
