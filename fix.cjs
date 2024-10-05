console.log('fix.js loaded');

const fs = require('fs')

//copy index.html to sidepanel.html
fs.copyFileSync('./dist/index.html', './dist/sidepanel.html')

console.log('fix.js done');
