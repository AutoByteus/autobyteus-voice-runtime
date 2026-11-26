// Stand-in for electron/utils/shellEnv: the probe gives the login-shell PATH the desktop would read.
export function getLoginShellPath(): string | null { return process.env.AB655_LOGIN_PATH || null }
