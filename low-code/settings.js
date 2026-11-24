// Node-RED settings for the Practice 12 low-code app. Local classroom demo only.
module.exports = {
  uiHost: '127.0.0.1', // editor, dashboard and HTTP endpoints are reachable from this machine only
  uiPort: 1880,
  flowFile: 'flows.json',
  flowFilePretty: true, // readable diffs in git
  credentialSecret: false, // the flow has no credentials; nothing to encrypt
  httpNodeRoot: '/',
  httpAdminRoot: '/',
  logging: { console: { level: 'info', metrics: false, audit: false } },
  diagnostics: { enabled: false },
  telemetry: { enabled: false },
  externalModules: { autoInstall: false, palette: { allowInstall: false } }, // no palette installs from the editor
  editorTheme: {
    projects: { enabled: false },
    tours: false,
    palette: { catalogues: [] },
  },
  functionExternalModules: false,
  exportGlobalContextKeys: false,
}
