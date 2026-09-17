import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Retired atlases stay in the source archive, but are not downloaded by players.
const retired = new Set([
  'people-atlas.png',
  'memories/memory-years.png',
  'memories/memory-youth.png',
]);
export async function writeResourceManifest(root, offlineShell = false) {
  const resources = [];
  const hash = createHash('sha256');
  async function walk(folder) {
    for (const item of (await readdir(folder, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      const file = resolve(folder, item.name);
      if (item.isDirectory()) {
        await walk(file);
        continue;
      }
      const path = relative(root, file).replaceAll('\\', '/');
      if (
        retired.has(path) ||
        !/\.(png|jpg|jpeg|webp|svg|woff2?|mp3|ogg|wav|css|js|html)$/.test(
          path,
        ) ||
        path === 'resource-worker.js'
      )
        continue;
      const data = await readFile(file);
      hash.update(path).update(data);
      resources.push({ path, bytes: data.length });
    }
  }
  await walk(root);
  const version = hash.digest('hex').slice(0, 16);
  const manifest = {
    version,
    offlineShell,
    totalBytes: resources.reduce((n, r) => n + r.bytes, 0),
    resources,
  };
  await writeFile(
    resolve(root, 'resource-manifest.json'),
    JSON.stringify(manifest),
  );
  const worker = await readFile(
    resolve(project, 'scripts/resource-worker.template.js'),
    'utf8',
  );
  await writeFile(
    resolve(root, 'resource-worker.js'),
    worker
      .replace('__VERSION__', version)
      .replace('__PATHS__', JSON.stringify(resources.map((r) => r.path))),
  );
  console.log(
    `Resources: ${resources.length}, ${(manifest.totalBytes / 1048576).toFixed(1)} MB, ${version}`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await writeResourceManifest(resolve(project, 'public'));
