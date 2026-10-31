import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function run(command, args, cwd = root, capture = false) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}.`);
  return result.stdout?.trim() ?? '';
}

const origin = new URL(run('git', ['remote', 'get-url', 'origin'], root, true));
if (origin.protocol !== 'https:' || origin.hostname !== 'github.com')
  throw new Error('This deploy command requires an HTTPS GitHub origin.');
const repository = origin.pathname.replace(/^\//, '').replace(/\.git$/, '');
if (repository !== 'SUPERAWESOMEMEGAKOOL/vibe-coding')
  throw new Error('Refusing to deploy to an unexpected repository.');
const remote = `https://github.com/${repository}.git`;
const authorName =
  spawnSync('git', ['config', 'user.name'], { cwd: root, encoding: 'utf8' }).stdout?.trim() ||
  'Codex';
const authorEmail =
  spawnSync('git', ['config', 'user.email'], { cwd: root, encoding: 'utf8' }).stdout?.trim() ||
  'codex@openai.com';

run('npm', ['run', 'build']);
if (!existsSync(join(root, 'dist', 'index.html')) || !existsSync(join(root, 'dist', '.nojekyll')))
  throw new Error('The static build is incomplete.');
const directory = mkdtempSync(join(tmpdir(), 'folio-pages-'));
try {
  run('git', ['init', '--quiet', '--initial-branch=gh-pages'], directory);
  run('git', ['remote', 'add', 'origin', remote], directory);
  const existing = run('git', ['ls-remote', '--heads', 'origin', 'gh-pages'], directory, true);
  if (existing) {
    run('git', ['fetch', '--quiet', '--depth=1', 'origin', 'gh-pages'], directory);
    run('git', ['checkout', '--quiet', '-B', 'gh-pages', 'FETCH_HEAD'], directory);
    // Only remove the disposable staging copy of the old static output.
    for (const file of readdirSync(directory))
      if (file !== '.git') rmSync(join(directory, file), { recursive: true, force: true });
  }
  cpSync(join(root, 'dist'), directory, { recursive: true });
  run('git', ['add', '--all'], directory);
  const changes = run('git', ['diff', '--cached', '--name-only'], directory, true);
  if (!changes) {
    console.log('The gh-pages branch already contains this build.');
  } else {
    run(
      'git',
      [
        '-c',
        `user.name=${authorName}`,
        '-c',
        `user.email=${authorEmail}`,
        'commit',
        '--quiet',
        '-m',
        'Deploy Folio study app',
      ],
      directory,
    );
    // A normal push preserves remote history and rejects concurrent changes.
    run('git', ['push', 'origin', 'HEAD:refs/heads/gh-pages'], directory);
    console.log('Static app uploaded to gh-pages.');
  }
  console.log('GitHub Pages must serve the gh-pages branch at / (root).');
  console.log(
    'Expected site address after Pages is enabled: https://superawesomemegakool.github.io/vibe-coding/',
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
