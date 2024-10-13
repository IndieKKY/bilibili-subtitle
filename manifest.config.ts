import {defineManifest} from '@crxjs/vite-plugin'
// @ts-ignore
import packageJson from './package.json'

const {version} = packageJson

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = '0'] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, '')
  // split into version parts
  .split(/[.-]/)

export default defineManifest(async (env) => ({
  "name": '__MSG_appName__',
  "description": '__MSG_appDescription__',
  "version": `${major}.${minor}.${patch}`,
  "default_locale": "zh_CN",
  "manifest_version": 3,
  "permissions": [
    "sidePanel",
    "storage",
  ],
  "host_permissions": [
    "http://localhost/*",
    "http://127.0.0.1/*"
  ],
  "background": {
    "service_worker": "src/chrome/background.ts",
    "type": "module"
  },
  "options_page": "options.html",
  "content_scripts": [
    {
      "matches": ["https://*.bilibili.com/*"],
      "js": ["src/inject/inject.ts"]
    }
  ],
  "icons": {
    "16": "favicon-16x16.png",
    "32": "favicon-32x32.png",
    "48": "favicon-48x48.png",
    "128": "favicon-128x128.png"
  },
  "action": {
    // "default_popup": "popup.html",
    "default_icon": {
      "16": "favicon-16x16.png",
      "32": "favicon-32x32.png",
      "48": "favicon-48x48.png",
      "128": "favicon-128x128.png"
    }
  },
  "web_accessible_resources": [
    {
      "matches": ["https://*.bilibili.com/*"],
      "resources": [
        "index.html",
      ],
      "use_dynamic_url": true
    }
  ]
}))
