#!/usr/bin/env node
// PostToolUse: định dạng file TypeScript Claude vừa ghi bằng Prettier của đúng project (`api` hoặc `web`).
// Chỉ định dạng; lint vẫn chạy riêng (`pnpm lint`) để auto-fix không đụng vào file ngoài ý muốn.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIRS = ['api', 'web'];
const GENERATED_FILE_PATTERN = /(routeTree\.gen|[\\/]components[\\/]ui[\\/])/;

function findProjectRoot(filePath) {
  const projectRoot = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  return PROJECT_DIRS.map((dir) => path.join(projectRoot, dir)).find(
    (dir) => filePath.startsWith(dir + path.sep),
  );
}

let rawInput = '';
process.stdin.on('data', (chunk) => (rawInput += chunk));
process.stdin.on('end', () => {
  let filePath = '';
  try {
    filePath = JSON.parse(rawInput).tool_input?.file_path ?? '';
  } catch {
    process.exit(0);
  }

  if (!/\.tsx?$/.test(filePath) || !fs.existsSync(filePath)) process.exit(0);
  if (GENERATED_FILE_PATTERN.test(filePath)) process.exit(0);

  const projectDir = findProjectRoot(filePath);
  if (!projectDir) process.exit(0);

  try {
    execFileSync('npx', ['prettier', '--write', filePath], {
      cwd: projectDir,
      stdio: 'pipe',
    });
  } catch (error) {
    console.error(`prettier failed on ${filePath}:\n${error.stderr ?? error}`);
    process.exit(2);
  }
});
