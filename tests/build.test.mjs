import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, FRONTEND_FILES } from '../scripts/build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
async function files(directory, prefix='') {
  const entries = await readdir(directory, {withFileTypes:true});
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(directory,entry.name),prefix+entry.name+'/') : [prefix+entry.name]));
  return nested.flat().sort();
}

test('deployment output is an exact allowlist, removes stale files and preserves frontend modules', async () => {
  await mkdir(path.join(root,'dist'), {recursive:true});
  await writeFile(path.join(root,'dist','private-export-canary.csv'), 'TEST CANARY ONLY');
  await build();
  assert.deepEqual(await files(path.join(root,'dist')), [...FRONTEND_FILES].sort());
  for (const file of FRONTEND_FILES.filter(f=>f!=='studio/index.html')) {
    assert.deepEqual(await readFile(path.join(root,'dist',file)),await readFile(path.join(root,file)));
  }
  const source = await readFile(path.join(root,'studio/index.html'),'utf8');
  const published = await readFile(path.join(root,'dist/studio/index.html'),'utf8');
  assert.match(source, /data-local-documents/);
  assert.doesNotMatch(published, /\/docs\//);
  assert.match(published, /data-mode="studio"/);
  assert.match(published, /src="\/app.js"/);
});

test('Vercel serves only dist with directory URLs and no catch-all participant rewrite', async () => {
  const config=JSON.parse(await readFile(path.join(root,'vercel.json'),'utf8'));
  assert.equal(config.framework,null);
  assert.equal(config.outputDirectory,'dist');
  assert.equal(config.buildCommand,'npm run build');
  assert.equal(config.trailingSlash,true);
  assert.equal(config.rewrites,undefined);
  assert.equal(config.functions,undefined);
});
