console.log('fixFirefox.js loaded');

const fs = require('fs')

const manifest = require('./dist/manifest.json')
manifest.web_accessible_resources[0].resources.push('index.html')
manifest.action.default_popup = 'popup.html'
//browser_specific_settings
manifest.browser_specific_settings = {
  "gecko": {
    "id": "bilibili-subtitle@indiekky"
  }
}
//background
manifest.background = {
  type: "module",
  scripts: [manifest.background.service_worker]
}
//写回文件
fs.writeFileSync('./dist/manifest.json', JSON.stringify(manifest, null, 2))

console.log('fixFirefox.js done');
