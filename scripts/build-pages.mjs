import './build.mjs';
import fs from 'node:fs/promises';
await fs.mkdir(new URL('../docs/',import.meta.url),{recursive:true});
await fs.cp(new URL('../dist/',import.meta.url),new URL('../docs/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../docs/.nojekyll',import.meta.url),'');
console.log('GitHub Pages preparado en docs/.');
