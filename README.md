## ⚠️维护说明
🙏感谢大家的支持，此开源版本将不再更新，仅进行bug修复！
新的扩展进行升级后，改名为vCaptions，支持任意网站视频添加字幕列表，应用商店链接不变。

## 简介

哔哩哔哩字幕列表是一个浏览器扩展，旨在提供更高效和可控的视频信息获取方式。

该扩展会显示视频的字幕列表，让用户能够快速浏览字幕内容，并通过点击跳转到相应的视频位置。同时，用户还可以方便地下载字幕文件。

除此之外，该扩展还提供了视频字幕总结功能，帮助用户快速掌握视频的要点。

该扩展主要面向知识学习类的视频，帮助用户更好地理解和总结视频内容。

## 功能特点

- 🎬 显示视频的字幕列表
- 🔗 点击字幕跳转视频对应位置
- 📥 多种格式复制与下载字幕
- 📝 多种方式总结字幕
- 🌍 翻译字幕
- 🌑 深色主题

## 下载扩展

- [Chrome商店](https://chrome.google.com/webstore/detail/bciglihaegkdhoogebcdblfhppoilclp)
- [Edge商店](https://microsoftedge.microsoft.com/addons/detail/lignnlhlpiefmcjkdkmfjdckhlaiajan)
- [Firefox商店](https://addons.mozilla.org/zh-CN/firefox/addon/bilibili-subtitle/)

## 使用说明

安装扩展后，在哔哩哔哩网站观看视频时，视频右侧会显示字幕列表面板。

### 使用本地Ollama模型
如果你使用本地Ollama模型，需要配置环境变量：`OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*,safari-web-extension://*`，否则访问会出现403错误。

然后在插件配置里，apiKey随便填一个，服务器地址填`http://localhost:11434`，模型选自定义，然后填入自定义模型名如`llama2`。

但是测试发现llama2 7b模型比较弱，无法返回需要的json格式，因此总结很可能会无法解析响应而报错(但提问功能不需要解析响应格式，因此没问题)。

## 开发指南
node版本：18.15.0
包管理器：pnpm

- 本地调试：`pnpm run dev`，然后浏览器扩展管理页面，开启开发者模式，再加载已解压的扩展程序，选择`dist`目录。
- 打生产包：`pnpm run build`，然后浏览器扩展管理页面，开启开发者模式，再加载已解压的扩展程序，选择`dist`目录。

注：`./push.sh`是作者自用脚本，可以忽略。

提示：最新版浏览器安全方面有更新，开发调试可能有问题，会报csp错误！
暂时的解决办法是`pnpm run dev`运行起来后，手动将`dist/manifest.json`文件里的web_accessible_resources里的use_dynamic_url都修改为false，然后浏览器扩展管理页面点击重载一下，就能正常（是@crxjs/vite-plugin依赖的问题，这个依赖很长时间没更新了，这个bug也没修复，暂时没发现更好的解决办法）。
构建后正常（关键是fix.cjs里将use_dynamic_url设置为false的这个操作）。

## 许可证

该项目采用 **MIT 许可证**，详情请参阅许可证文件。
