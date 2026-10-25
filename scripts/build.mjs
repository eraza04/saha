import { copyFile, lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FRONTEND_FILES = Object.freeze([
  'index.html',
  'studio/index.html',
  'app.js',
  'care-state.js',
  'participant-screens.js',
  'research-state.js',
  'style.css',
  'participant.css'
]);

export async function build() {
  const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
  const output = path.resolve(root, 'dist');
  // dist is disposable build output. Never remove a supplied/computed directory
  // outside this exact project location, or follow a substituted dist symlink.
  if (path.relative(root, output) !== 'dist') throw new Error('Unsafe output directory');
  const previous = await lstat(output).catch(error => { if (error.code !== 'ENOENT') throw error; });
  if (previous?.isSymbolicLink()) throw new Error('Refusing to replace a symlink at dist');
  for (const filename of FRONTEND_FILES) {
    const source = path.resolve(root, filename);
    if (!source.startsWith(root + path.sep) || !(await lstat(source)).isFile()) throw new Error('Expected regular frontend file: ' + filename);
  }
  const studioDirectory = await lstat(path.join(root, 'studio'));
  if (!studioDirectory.isDirectory() || studioDirectory.isSymbolicLink()) throw new Error('Expected a regular studio directory');
  await rm(output, {recursive:true, force:true});
  for (const filename of FRONTEND_FILES) {
    const destination = path.join(output, filename);
    await mkdir(path.dirname(destination), {recursive:true});
    if (filename === 'studio/index.html') {
      const source = await readFile(path.join(root, filename), 'utf8');
      const published = source.replace(/<span data-local-documents>[\s\S]*?<\/span>/g, '');
      if (/href=["']\/docs\//.test(published)) throw new Error('Published studio still links to excluded local documents');
      await writeFile(destination, published, 'utf8');
    } else {
      await copyFile(path.join(root, filename), destination);
    }
  }
  console.log('Static frontend built in dist/ (' + FRONTEND_FILES.length + ' files).');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
