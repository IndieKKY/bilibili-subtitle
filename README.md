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

- [chrome商店](https://chrome.google.com/webstore/detail/bciglihaegkdhoogebcdblfhppoilclp)
- [edge商店](https://microsoftedge.microsoft.com/addons/detail/lignnlhlpiefmcjkdkmfjdckhlaiajan)

## 使用说明

安装扩展后，在哔哩哔哩网站观看视频时，视频右侧会显示字幕列表面板。

### 使用本地Ollama模型
如果你使用本地Ollama模型，需要配置环境变量：`OLLAMA_ORIGINS=chrome-extension://bciglihaegkdhoogebcdblfhppoilclp`，否则访问会出现403错误。

然后在插件配置里，apiKey随便填一个，服务器地址填`http://localhost:11434`，模型选自定义，然后填入自定义模型名如`llama2`。

但是测试发现llama2 7b模型比较弱，无法返回需要的json格式，因此总结很可能会无法解析响应而报错(但提问功能不需要解析响应格式，因此没问题)。

## 交流联系

github: [IndieKKY](https://github.com/IndieKKY)

## 问题反馈

如果您在使用过程中遇到任何问题，或者有任何改进建议，请在项目的 **Issue 页面** 中提出。我们欢迎您的反馈，并会尽快回复和处理相关问题。

## 开发指南
node版本：18.15.0
包管理器：pnpm

- 本地调试：`pnpm run dev`，然后浏览器扩展管理页面，开启开发者模式，再加载已解压的扩展程序，选择`dist`目录。
- 打生产包：`pnpm run build`，然后浏览器扩展管理页面，开启开发者模式，再加载已解压的扩展程序，选择`dist`目录。

注：`./push.sh`是作者自用脚本，可以忽略。

提示：最新版浏览器安全方面有更新，开发调试可能有问题，会报csp错误！
暂时的解决办法是`pnpm run dev`运行起来后，手动将`dist/manifest.json`文件里的web_accessible_resources里的use_dynamic_url都修改为false，然后浏览器扩展管理页面点击重载一下，就能正常（是@crxjs/vite-plugin依赖的问题，这个依赖很长时间没更新了，这个bug也没修复，暂时没发现更好的解决办法）。
构建后正常，关键是fix.cjs里将use_dynamic_url设置为false的这个操作。

## 贡献指南

欢迎贡献代码或提出改进建议！如果您希望为该项目做出贡献，请遵循以下步骤：

1. Fork该仓库到您自己的账号。
2. 创建您的分支并进行修改。
3. 提交修改前，请确保您的代码通过了所有的测试，并保持良好的代码风格。
4. 提交 Pull Request，描述清楚您的修改内容和目的。
5. 我们将仔细审查您的贡献，并与您进行讨论和反馈。
6. 一旦您的贡献被接受并合并到主分支，您的修改将成为项目的一部分。

## 许可证

该项目采用 **MIT 许可证**，详情请参阅许可证文件。
