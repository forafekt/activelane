# Workbench Browser

The Workbench browser is registered as the `browser` tab kind by the built-in
`activelane.workbench-browser` extension.

Extensions should integrate through existing Workbench contribution points:

- Open URLs by executing `workbench.browser.openUrl`, `workbench.browser.openLocalhost`, or by calling `openWorkbenchBrowser(runtime, { url, ownerExtensionId })` from trusted built-in code.
- Add browser commands with normal `commands` and `commandPalette` contributions.
- Add browser toolbar actions with `tabToolbarActions` using `when: "browser"`.
- Add browser tab context menu actions with `tabContextMenu` and `contexts: { tabKinds: ["browser"] }`.
- Customize defaults through settings: `workbench.browser.homeUrl`, `workbench.browser.searchProviderUrl`, `workbench.browser.defaultEngine`, and `workbench.browser.defaultStorageMode`.

Desktop hosts use Electron `webview` when available. Web and extension hosts
fall back to the iframe engine, which is intentionally limited by browser CSP
and frame policy enforcement.
