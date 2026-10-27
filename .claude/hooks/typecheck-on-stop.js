#!/usr/bin/env node
// Stop: chạy `pnpm typecheck` ở project (`api`, `web`) có file TypeScript thay đổi theo git của project đó.
// Exit 2 trả lỗi về cho Claude để sửa. Project chưa `git init` thì bỏ qua.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIRS = ['api', 'web'];
const MAX_OUTPUT_LENGTH = 4000;

function hasChangedTypeScript(projectDir) {
  if (!fs.existsSync(path.join(projectDir, '.git'))) return false;
  const gitStatus = execSync('git status --porcelain', {
    cwd: projectDir,
    encoding: 'utf8',
  });
  return gitStatus.split('\n').some((line) => /\.tsx?$/.test(line.trim()));
}

let rawInput = '';
process.stdin.on('data', (chunk) => (rawInput += chunk));
process.stdin.on('end', () => {
  try {
    // Đang tiếp tục vì chính hook này: không lặp vô hạn.
    if (JSON.parse(rawInput).stop_hook_active) process.exit(0);
  } catch {
    // stdin không có JSON; chạy tiếp
  }

  const projectRoot = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const failures = [];

  for (const dir of PROJECT_DIRS) {
    const projectDir = path.join(projectRoot, dir);
    if (!fs.existsSync(projectDir) || !hasChangedTypeScript(projectDir)) continue;
    try {
      execSync('pnpm typecheck', { cwd: projectDir, encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
      const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
      failures.push(`[${dir}] pnpm typecheck failed:\n${output.slice(0, MAX_OUTPUT_LENGTH)}`);
    }
  }

  if (failures.length > 0) {
    console.error(failures.join('\n\n'));
    process.exit(2);
  }
});
