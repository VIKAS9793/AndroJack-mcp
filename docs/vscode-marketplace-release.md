# VS Code Marketplace Release Checklist

Use `feature/vscode-extension` as the source branch for the VS Code extension release flow.

## Local release steps

1. Switch to the extension branch.
   - `git switch feature/vscode-extension`
2. Update `package.json` version and any README changes for the release.
3. Package the VSIX.
   - `npm run package:vsix`
4. Validate that the packaged VSIX exposes the README to Marketplace and VS Code.
   - `npm run verify:vsix`
5. Replace the local install with the packaged VSIX.
   - `code --install-extension ./androjack-vscode-<version>.vsix --force`
6. Open the extension details page in VS Code and confirm the README renders.

## Marketplace publish steps

1. Export a Visual Studio Marketplace personal access token as `VSCE_PAT`.
2. Publish from the extension branch after the VSIX passes validation.
   - `npm run publish:marketplace`
3. Confirm the Marketplace version matches the local package version.
4. Reinstall or update from the Marketplace if VS Code is still pinned to an older local install.

## Expected release artifacts

- `androjack-vscode-<version>.vsix` exists at the repo root.
- The VSIX contains the packaged README asset at `extension/readme.md`.
- `.vsixmanifest` contains `Microsoft.VisualStudio.Services.Content.Details` pointing to the packaged README asset.

## Post-publish verification

1. Check the Marketplace details page for the new version.
2. Install the published extension into a clean VS Code profile.
3. Confirm the installed extension directory includes the packaged README file.
4. Confirm the extension details view does not show `No README available.`
