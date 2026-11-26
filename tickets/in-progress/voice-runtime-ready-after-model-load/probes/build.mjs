import * as esbuild from '/Users/normy/autobyteus_org/autobyteus-workspace-superrepo/node_modules/.pnpm/esbuild@0.27.3/node_modules/esbuild/lib/main.js'
await esbuild.build({
  entryPoints: ['/Users/normy/autobyteus_org/autobyteus-workspace-superrepo/autobyteus-web/electron/extensions/voice-input/voiceInputRuntimeService.ts'],
  bundle: true, platform: 'node', format: 'esm', outfile: '/tmp/ab655-api/caller/caller.mjs', logLevel: 'warning',
  nodePaths: ['/Users/normy/autobyteus_org/autobyteus-workspace-superrepo/autobyteus-web/node_modules', '/Users/normy/autobyteus_org/autobyteus-workspace-superrepo/node_modules'],
  plugins: [{ name: 'stub-shell-env', setup(b) { b.onResolve({ filter: /utils\/shellEnv$/ }, () => ({ path: '/tmp/ab655-api/caller/shellEnvStub.ts' })) } }],
  banner: { js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);" },
})
console.log('built')
