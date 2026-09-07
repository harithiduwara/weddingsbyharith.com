#!/usr/bin/env node
/**
 * Publish dist/ to the gh-pages branch (ADR-0002).
 *
 *   npm run deploy            # preview build — refuses if placeholders remain
 *   npm run deploy -- --force # publish anyway, e.g. to show a client
 *
 * The built site is force-pushed to an orphan-style branch that holds only
 * output, so `main` never carries generated files. Uses a temporary worktree,
 * which means it never touches your working tree or current branch.
 */
import { execFileSync } from 'node:child_process';
import { rm, access, readFile, cp, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const WORKTREE = join(ROOT, '.deploy-worktree');
const BRANCH = 'gh-pages';

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
const gitIn = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();
const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

if (!(await exists(join(DIST, 'index.html')))) {
  console.error('✗ dist/ is empty. Run `npm run build` first.');
  process.exit(1);
}

// The preview ribbon is baked into the HTML, so publishing a preview build is
// a deliberate act, not an accident.
const home = await readFile(join(DIST, 'index.html'), 'utf8');
if (home.includes('preview-ribbon') && !FORCE) {
  console.error(
    '✗ This build still contains placeholder content and carries a preview ribbon.\n' +
      '  Fill in site.config.mjs and content/, then `npm run build -- --production`.\n' +
      '  To publish it anyway (e.g. to show the client), re-run with: npm run deploy -- --force',
  );
  process.exit(1);
}

const sha = git('rev-parse', '--short', 'HEAD');
const dirty = git('status', '--porcelain') !== '';

console.log(`▸ Publishing dist/ → ${BRANCH} (source ${sha}${dirty ? ', dirty tree' : ''})`);

await rm(WORKTREE, { recursive: true, force: true });
try {
  git('worktree', 'prune');
} catch {
  /* nothing to prune */
}

// Create or check out the publish branch inside a throwaway worktree.
const hasBranch = (() => {
  try {
    git('show-ref', '--verify', `refs/heads/${BRANCH}`);
    return true;
  } catch {
    return false;
  }
})();

git('worktree', 'add', ...(hasBranch ? [WORKTREE, BRANCH] : ['-b', BRANCH, WORKTREE]));

try {
  // Clear everything except .git, then copy the fresh build in.
  for (const entry of await readdir(WORKTREE)) {
    if (entry !== '.git') await rm(join(WORKTREE, entry), { recursive: true, force: true });
  }
  await cp(DIST, WORKTREE, { recursive: true });

  gitIn(WORKTREE, 'add', '--all');
  const changed = (() => {
    try {
      gitIn(WORKTREE, 'diff', '--cached', '--quiet');
      return false;
    } catch {
      return true;
    }
  })();

  if (!changed) {
    console.log('✓ Published site already matches this build. Nothing to do.');
  } else {
    gitIn(WORKTREE, 'commit', '-m', `Deploy ${sha}${dirty ? ' (uncommitted changes)' : ''}`);
    gitIn(WORKTREE, 'push', '--force', 'origin', BRANCH);
    console.log(`✓ Pushed ${BRANCH}. GitHub Pages will update within a minute or two.`);
  }
} finally {
  git('worktree', 'remove', '--force', WORKTREE);
}
