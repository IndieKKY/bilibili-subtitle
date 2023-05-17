console.log('fixChrome.js loaded');

const fs = require('fs')

const manifest = require('./dist/manifest.json')
manifest.web_accessible_resources[0].resources.push('index.html')
manifest.action.default_popup = 'popup.html'
//写回文件
fs.writeFileSync('./dist/manifest.json', JSON.stringify(manifest, null, 2))

console.log('fixChrome.js done');
