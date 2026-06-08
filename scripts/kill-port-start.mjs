/**
 * kill-port-start.mjs <port> [next-args...]
 *
 * Kills whatever process is holding <port>, waits for the socket to release,
 * then spawns `next <next-args>` with PORT=<port> in the environment.
 *
 * Usage (package.json):
 *   "dev":   "node ../../scripts/kill-port-start.mjs 3000 dev  --port 3000"
 *   "start": "node ../../scripts/kill-port-start.mjs 3000 start --port 3000"
 */

import { exec }  from 'node:child_process';
import { spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const port    = parseInt(process.argv[2], 10);
const cmdArgs = process.argv.slice(3); // e.g. ['dev', '--port', '3000']

if (!port) {
  console.error('Usage: kill-port-start.mjs <port> [next-args...]');
  process.exit(1);
}

async function killPort(p) {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync(`netstat -ano | findstr :${p}`);
      const pids = new Set();
      for (const line of stdout.trim().split('\n')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
      }
      await Promise.all([...pids].map(pid =>
        execAsync(`taskkill /PID ${pid} /F`).catch(() => {}),
      ));
      if (pids.size) console.log(`Killed ${pids.size} process(es) on port ${p}`);
    } else {
      const { stdout } = await execAsync(`lsof -ti:${p}`).catch(() => ({ stdout: '' }));
      const pids = stdout.trim().split('\n').filter(Boolean);
      if (pids.length) {
        await execAsync(`kill -9 ${pids.join(' ')}`).catch(() => {});
        console.log(`Killed ${pids.length} process(es) on port ${p}`);
      }
    }
  } catch {
    // port is already free
  }
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

await killPort(port);
await wait(700);

const child = spawn('next', cmdArgs, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: String(port) },
});

child.on('exit', code => process.exit(code ?? 0));
