import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await build({absWorkingDir:root,entryPoints:['src/recognition-worker.js'],outfile:'public/vendor/recognition-worker-0.5.0.js',bundle:true,minify:true,platform:'browser',target:'es2020',format:'iife',legalComments:'eof',banner:{js:'/*! Based on MindAR 1.2.5 (MIT). See MINDAR-LICENSE in this directory. */'}});
console.log('Comparador de reconocimiento compilado.');
