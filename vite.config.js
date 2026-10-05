const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

export default {
  // GitHub Pages hosts project sites under /<repository>/; keep local dev at /.
  base: isGitHubActions ? '/Win11-Web/' : '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      clientPort: 443
    },
    allowedHosts: true,
    headers: {
      'X-Frame-Options': 'ALLOWALL'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  }
}
