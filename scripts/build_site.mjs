import fs from 'node:fs';

fs.mkdirSync('_site/docs', { recursive: true });
fs.cpSync('src/site', '_site', { recursive: true });
if (fs.existsSync('docs/deck')) fs.cpSync('docs/deck', '_site/docs/deck', { recursive: true });
if (fs.existsSync('docs/deck-images')) fs.cpSync('docs/deck-images', '_site/docs/deck-images', { recursive: true });
if (fs.existsSync('docs/demo')) fs.cpSync('docs/demo', '_site/docs/demo', { recursive: true });

console.log('Site assembled successfully in _site/');
