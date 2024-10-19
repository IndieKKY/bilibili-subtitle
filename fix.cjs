console.log('fix.js loaded');

const fs = require('fs')

//copy index.html to sidepanel.html
fs.copyFileSync('./dist/index.html', './dist/sidepanel.html')

//set all use_dynamic_url to false
const manifest = require('./dist/manifest.json')
manifest.web_accessible_resources.forEach(resource => {
  resource.use_dynamic_url = false
})
fs.writeFileSync('./dist/manifest.json', JSON.stringify(manifest, null, 2))

console.log('fix.js done');
