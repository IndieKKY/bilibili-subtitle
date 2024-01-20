// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { crx } from "@crxjs/vite-plugin";

// manifest.json
var manifest_default = {
  name: "\u54D4\u54E9\u54D4\u54E9\u5B57\u5E55\u5217\u8868",
  description: "\u663E\u793AB\u7AD9\u89C6\u9891\u7684\u5B57\u5E55\u5217\u8868,\u53EF\u70B9\u51FB\u8DF3\u8F6C\u4E0E\u4E0B\u8F7D\u5B57\u5E55,\u5E76\u652F\u6301\u7FFB\u8BD1\u548C\u603B\u7ED3\u5B57\u5E55!",
  version: "1.7.11",
  manifest_version: 3,
  permissions: [
    "storage"
  ],
  background: {
    service_worker: "src/chrome/background.ts"
  },
  content_scripts: [
    {
      matches: ["https://www.bilibili.com/video/*", "https://www.bilibili.com/list/*"],
      js: ["src/chrome/content-script.cjs"]
    }
  ],
  icons: {
    "16": "favicon-16x16.png",
    "32": "favicon-32x32.png",
    "48": "favicon-48x48.png",
    "128": "favicon-128x128.png"
  },
  action: {
    default_popup: "index.html",
    default_icon: {
      "16": "favicon-16x16.png",
      "32": "favicon-32x32.png",
      "48": "favicon-48x48.png",
      "128": "favicon-128x128.png"
    }
  }
};

// vite.config.ts
var vite_config_default = ({ mode }) => {
  const plugins = [
    react(),
    visualizer()
  ];
  if (mode === "production_chrome") {
    plugins.push(crx({
      manifest: manifest_default
    }));
  }
  return defineConfig({
    base: "/",
    plugins,
    css: {
      modules: {
        localsConvention: "camelCase"
      }
    }
  });
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZmVuZ3l1ZXhpYW5nL2RhdGEvcHJvamVjdC9iaWxpYmlsaS1zdWJ0aXRsZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2Zlbmd5dWV4aWFuZy9kYXRhL3Byb2plY3QvYmlsaWJpbGktc3VidGl0bGUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2Zlbmd5dWV4aWFuZy9kYXRhL3Byb2plY3QvYmlsaWJpbGktc3VidGl0bGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQge2RlZmluZUNvbmZpZywgUGx1Z2luT3B0aW9ufSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHt2aXN1YWxpemVyfSBmcm9tIFwicm9sbHVwLXBsdWdpbi12aXN1YWxpemVyXCI7XG5pbXBvcnQge2NyeH0gZnJvbSAnQGNyeGpzL3ZpdGUtcGx1Z2luJ1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IG1hbmlmZXN0IGZyb20gJy4vbWFuaWZlc3QuanNvbidcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0ICh7bW9kZX0pID0+IHtcbiAgY29uc3QgcGx1Z2lucyA9IFtcbiAgICByZWFjdCgpLFxuICAgIHZpc3VhbGl6ZXIoKSBhcyBQbHVnaW5PcHRpb24sXG4gIF1cbiAgLy8gQHRzLWlnbm9yZVxuICBpZiAobW9kZSA9PT0gJ3Byb2R1Y3Rpb25fY2hyb21lJykge1xuICAgIHBsdWdpbnMucHVzaChjcngoe1xuICAgICAgbWFuaWZlc3QsXG4gICAgfSkpXG4gIH1cbiAgcmV0dXJuIGRlZmluZUNvbmZpZyh7XG4gICAgYmFzZTogJy8nLFxuICAgIHBsdWdpbnMsXG4gICAgY3NzOiB7XG4gICAgICBtb2R1bGVzOiB7XG4gICAgICAgIGxvY2Fsc0NvbnZlbnRpb246IFwiY2FtZWxDYXNlXCJcbiAgICAgIH1cbiAgICB9XG4gIH0pXG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdVLFNBQVEsb0JBQWlDO0FBQ2pYLE9BQU8sV0FBVztBQUNsQixTQUFRLGtCQUFpQjtBQUN6QixTQUFRLFdBQVU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS2xCLElBQU8sc0JBQVEsQ0FBQyxFQUFDLEtBQUksTUFBTTtBQUN6QixRQUFNLFVBQVU7QUFBQSxJQUNkLE1BQU07QUFBQSxJQUNOLFdBQVc7QUFBQSxFQUNiO0FBRUEsTUFBSSxTQUFTLHFCQUFxQjtBQUNoQyxZQUFRLEtBQUssSUFBSTtBQUFBLE1BQ2Y7QUFBQSxJQUNGLENBQUMsQ0FBQztBQUFBLEVBQ0o7QUFDQSxTQUFPLGFBQWE7QUFBQSxJQUNsQixNQUFNO0FBQUEsSUFDTjtBQUFBLElBQ0EsS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLFFBQ1Asa0JBQWtCO0FBQUEsTUFDcEI7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBQ0g7IiwKICAibmFtZXMiOiBbXQp9Cg==
