import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logDir = resolve(root, 'docs');
const logFile = resolve(logDir, 'NPM-VERIFY-LOG.md');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Windows PowerShell/Node 20 can return EINVAL when spawning .cmd files directly.
// Invoke npm.cmd through cmd.exe on Windows for reliable execution.
const npmExecutable = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : npmCmd;
const quoteCmdArg = (arg) => String(arg);
const startedAt = new Date();

mkdirSync(logDir, { recursive: true });

const run = (command, args, options = {}) => {
  const isWindowsNpm = process.platform === 'win32' && command === npmCmd;
  const spawnCommand = isWindowsNpm ? npmExecutable : command;
  const spawnArgs = isWindowsNpm
    ? ['/d', '/s', '/c', [npmCmd, ...args].map(quoteCmdArg).join(' ')]
    : args;
  const result = spawnSync(spawnCommand, spawnArgs, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    timeout: options.timeout ?? 30000,
    killSignal: 'SIGTERM',
    ...options,
  });
  return {
    code: typeof result.status === 'number' ? result.status : 124,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
    error: result.error?.message ?? (result.signal ? `process terminated by ${result.signal}` : ''),
    timedOut: result.signal === 'SIGTERM' || result.error?.code === 'ETIMEDOUT',
  };
};

const firstLine = (text) => text.split(/\r?\n/).find(Boolean) ?? '';
const results = [];

const header = [
  '# NPM Verify Log',
  '',
  `Run started: ${startedAt.toISOString()}`,
  `Node: ${process.version}`,
  '',
  '| Check | Result | Command | Details |',
  '|---|---|---|---|',
  '',
].join('\n');
writeFileSync(logFile, header, 'utf8');

const record = (name, status, command, details = '') => {
  results.push({ name, status });
  appendFileSync(logFile, `| ${name} | ${status} | \`${command}\` | ${details.replace(/\|/g, '\\|')} |\n`, 'utf8');
  console.log(`[${status}] ${name}${details ? ` — ${details}` : ''}`);
};

const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const lockPath = resolve(root, 'package-lock.json');

let npmVersion = run(npmCmd, ['--version'], { timeout: 10000 });
if (npmVersion.code === 0) {
  record('npm available', 'PASS', 'npm --version', npmVersion.stdout);
} else {
  record('npm available', 'FAIL', 'npm --version', npmVersion.stderr || npmVersion.error || 'npm is unavailable');
}

if (existsSync(lockPath)) {
  record('package-lock.json present', 'PASS', 'file check', 'lockfile exists');
} else {
  record('package-lock.json present', 'FAIL', 'file check', 'package-lock.json is missing');
}

const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
const nodeSupported = nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 12) || (nodeMajor === 20 && nodeMinor >= 19);
if (nodeSupported) {
  record('Node runtime supported', 'PASS', `node ${process.version}`, 'Supported by Vite 7: Node 20.19+ or Node 22.12+.');
} else {
  record('Node runtime supported', 'FAIL', `node ${process.version}`, 'Vite 7 requires Node 20.19+ or Node 22.12+.');
}

if (npmVersion.code === 0) {
  const ping = run(npmCmd, ['ping', '--loglevel', 'error'], { timeout: 10000 });
  if (ping.code === 0) {
    record('npm registry reachable', 'PASS', 'npm ping --loglevel error', firstLine(ping.stdout) || 'registry responded');
  } else {
    record('npm registry reachable', 'FAIL', 'npm ping --loglevel error', firstLine(ping.stderr) || firstLine(ping.error) || (ping.timedOut ? 'timed out waiting for registry response' : 'registry did not respond'));
  }
} else {
  record('npm registry reachable', 'SKIP', 'npm ping --loglevel error', 'npm is unavailable');
}

const cache = run(npmCmd, ['cache', 'verify'], { timeout: 30000 });
if (cache.code === 0) {
  record('npm cache verify', 'PASS', 'npm cache verify', firstLine(cache.stdout) || 'cache verified');
} else {
  record('npm cache verify', 'FAIL', 'npm cache verify', firstLine(cache.stderr) || firstLine(cache.error) || 'cache verification failed');
}

let installOk = false;
if (npmVersion.code === 0 && existsSync(lockPath)) {
  const install = run(npmCmd, ['ci', '--no-audit', '--no-fund'], { timeout: 60000 });
  installOk = install.code === 0;
  if (installOk) {
    record('npm ci', 'PASS', 'npm ci --no-audit --no-fund', firstLine(install.stdout) || 'dependencies installed from package-lock.json');
  } else {
    record('npm ci', 'FAIL', 'npm ci --no-audit --no-fund', firstLine(install.stderr) || firstLine(install.error) || (install.timedOut ? 'timed out during dependency installation' : 'dependency installation failed'));
  }
} else {
  record('npm ci', 'SKIP', 'npm ci --no-audit --no-fund', 'npm or package-lock.json is unavailable');
}

const dependentChecks = [
  ['typecheck', ['run', 'typecheck']],
  ['test', ['test']],
  ['build', ['run', 'build']],
];

for (const [name, args] of dependentChecks) {
  if (!installOk) {
    record(name, 'SKIP', `npm ${args.join(' ')}`, 'not executed because npm ci failed; no PASS is recorded without a successful run');
    continue;
  }
  const result = run(npmCmd, args, { timeout: 60000 });
  if (result.code === 0) {
    record(name, 'PASS', `npm ${args.join(' ')}`, firstLine(result.stdout) || 'command completed successfully');
  } else {
    record(name, 'FAIL', `npm ${args.join(' ')}`, firstLine(result.stderr) || firstLine(result.stdout) || firstLine(result.error) || `exit code ${result.code}`);
  }
}

const failed = results.filter((item) => item.status === 'FAIL');
const skipped = results.filter((item) => item.status === 'SKIP');
const finalStatus = failed.length === 0 && skipped.length === 0 && results.every((item) => item.status === 'PASS') ? 'PASS' : 'FAIL';

console.log('');
console.log(`FINAL RESULT: ${finalStatus}`);
console.log(`PASS: ${results.filter((item) => item.status === 'PASS').length} | FAIL: ${failed.length} | SKIP: ${skipped.length}`);
console.log(`Log: ${logFile}`);

appendFileSync(logFile, [
  '',
  `## Final result: **${finalStatus}**`,
  '',
  `- PASS: ${results.filter((item) => item.status === 'PASS').length}`,
  `- FAIL: ${failed.length}`,
  `- SKIP: ${skipped.length}`,
  '',
  '> This log is generated by `npm run verify`. A check is marked PASS only when its command exits with code 0. A failed prerequisite causes dependent checks to be SKIP, and the overall verification remains FAIL.',
  '',
  '---',
  '',
].join('\n'), 'utf8');


if (finalStatus !== 'PASS') {
  process.exitCode = 1;
}
