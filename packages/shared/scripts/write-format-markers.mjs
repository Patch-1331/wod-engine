// tsc emits .js into both dist/cjs and dist/esm, but nothing in the file
// extension says which format each one is. Node decides that from the
// nearest package.json `type`, and ours has no `type` (so: commonjs) --
// which would make the ESM output be read as CommonJS and fail.
//
// Dropping a one-line package.json into each output dir scopes the answer
// to that subtree. Written at build time rather than committed because
// dist/ is generated and gitignored.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
for (const [dir, type] of [['cjs', 'commonjs'], ['esm', 'module']]) {
  mkdirSync(join(dist, dir), { recursive: true });
  writeFileSync(join(dist, dir, 'package.json'), `{ "type": "${type}" }\n`);
}
