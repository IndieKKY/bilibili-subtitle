## 消息通信库封装

### 消息端
一共分3个端：
1. 扩展端（`background.ts`）：扩展后台服务，整个浏览器最多一个实例。
2. 注入端（`inject.ts`）：会注入到网页中运行，可以访问网页元素，每个网页可能n个实例（看注入的次数），但多个实例一般是不必要的，所以尽量控制。
3. 应用端（`App.tsx`）：会放入iframe中，然后iframe元素添加到网页上，每个iframe一个实例；或者options.html选项页面也是应用实例。

### 消息通信
通信分为6个方向：
1. 扩展端 --> 注入端: 
    1. 监听：`chrome.runtime.onMessage.addListener`
    2. 发送：`chrome.tabs.sendMessage`
2. 扩展端 --> 应用端: 
    1. 监听：`chrome.runtime.onMessage.addListener`
    2. 发送：`chrome.tabs.sendMessage`
3. 注入端 --> 扩展端
    1. 监听：`chrome.runtime.onMessage.addListener`
    2. 发送：`chrome.runtime.sendMessage`
4. 注入端 --> 应用端
    1. 监听：`postmessage-promise`库
    2. 发送：`postmessage-promise`库
5. 应用端 --> 注入端
    1. 监听：`postmessage-promise`库
    2. 发送：`postmessage-promise`库
6. 应用端 --> 扩展端
    1. 监听：`chrome.runtime.onMessage.addListener`
    2. 发送：`chrome.runtime.sendMessage`

### 通信实现方式
1. 浏览器扩展接口：对于注入端与应用端，可以用这种方式与扩展端互相通信。
    1. `chrome.runtime.onMessage.addListener`
    2. `chrome.runtime.sendMessage`
    3. `chrome.tabs.sendMessage`
2. `postmessage-promise`库：应用端跟注入端双向通信用这个第三方库。

### 说明
1. `chrome.tabs.sendMessage`这个方法是向标签页发送信息，标签页内的所有`注入端`与`应用端`都会收到信息。
2. `chrome.runtime.sendMessage`这个方法是向扩展端发送信息
3. `chrome.runtime.onMessage.addListener`这个监听器三个端都能放。