const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const apiDir = path.resolve(__dirname, '../prism-guard-api');
const webDir = path.resolve(__dirname, '../prism-guard-web');
const mobileDir = path.resolve(__dirname, '.');

// Validate directory paths
const dirs = {
  API: apiDir,
  WEB: webDir,
  MOBILE: mobileDir,
};

for (const [name, dir] of Object.entries(dirs)) {
  if (!fs.existsSync(dir)) {
    console.error(`${colors.red}[Error] Directory for ${name} not found at: ${dir}${colors.reset}`);
    process.exit(1);
  }
}

const services = [
  {
    name: 'API',
    color: colors.cyan,
    dir: apiDir,
    cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
  },
  {
    name: 'WEB',
    color: colors.green,
    dir: webDir,
    cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
  },
  {
    name: 'MOBILE',
    color: colors.magenta,
    dir: mobileDir,
    cmd: process.platform === 'win32' ? 'npx.cmd' : 'npx',
    args: ['expo', 'start', '--dev-client'],
    interactive: true, // We will pipe stdin to this service
  }
];

console.log(`${colors.bright}${colors.blue}=============================================`);
console.log('    Prism Guard Unified Dev Environment     ');
console.log(`=============================================${colors.reset}\n`);

const children = [];
let isCleaningUp = false;

function cleanupAndExit() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log(`\n${colors.yellow}[System] Shutting down all services...${colors.reset}`);
  
  children.forEach(({ proc, name }) => {
    if (proc && !proc.killed) {
      console.log(`${colors.dim}[System] Stopping ${name}...${colors.reset}`);
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', proc.pid, '/f', '/t'], { stdio: 'ignore' });
      } else {
        proc.kill('SIGINT');
      }
    }
  });
  
  setTimeout(() => {
    process.exit(0);
  }, 800);
}

// Intercept exit signals
process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);
process.on('SIGHUP', cleanupAndExit);

// Start each service
services.forEach((service) => {
  console.log(`${service.color}[System] Booting ${service.name}...${colors.reset}`);
  
  const child = spawn(service.cmd, service.args, {
    cwd: service.dir,
    shell: true,
    stdio: service.interactive ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe']
  });

  children.push({ proc: child, name: service.name });

  // Stream output with prefixes
  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${service.color}[${service.name}]${colors.reset} ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`${colors.red}[${service.name} ERROR]${colors.reset} ${line}`);
      }
    });
  });

  if (service.interactive) {
    // Pipe standard input so keyboard inputs are forwarded directly to the Expo CLI
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (key) => {
      if (child && !child.killed) {
        child.stdin.write(key);
      }
    });
  }

  child.on('close', (code) => {
    if (!isCleaningUp) {
      console.log(`${service.color}[System] ${service.name} exited with code ${code}${colors.reset}`);
      cleanupAndExit();
    }
  });
});
