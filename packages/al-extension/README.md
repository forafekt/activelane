# `@activelane/extension`

Framework-neutral lifecycle SDK for ActiveLane extensions. Use `defineExtension` for the runtime entry module and `context.workbench.openView()` to reveal or create isolated views by logical resource identity.

UI code inside an isolated view imports the separately bundled browser client from
`@activelane/extension/view`.
