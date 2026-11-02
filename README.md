# 仿原神祈愿

一个东方 Project 主题的网页抽奖程序，使用 SvelteKit + Vite 开发。

从角色与村民组成的奖池中随机抽取获奖者，用祈愿动画、角色立绘和主题音乐揭晓结果，支持单抽、连抽和记录查看。

## 怎么用

安装 Node.js（建议 22 或更新版本），在项目目录运行：

```bash
npm install
npm run dev
```

浏览器打开终端显示的地址即可。

1. 在「设置」中调整村民数量，添加并指定本轮奖品。
2. 点击「祈愿一次」或「祈愿多次」开始抽奖。
3. 在「祈愿记录」中查看结果；已抽出的角色不会重复入选，重置记录后可重新参与。

奖品、记录和自定义首页内容保存在当前浏览器中，清理浏览器数据会丢失这些内容。

需要构建和本地预览时，运行 `npm run build`，再运行 `npm run preview`。

## DIY 修改

- **首页内容**
    - 点击右上角铅笔按钮修改文案和图片；
    - 要修改项目默认值，请编辑 `src/lib/data/homeContent.js`。
- **角色奖池**
    - 编辑 `src/lib/data/characters.js`，修改角色名称、称号、种族、立绘路径和主题曲。
    - 立绘放在 `static/chr/`，音乐放在 `static/sfx/`。
- **图片、音效与动画**
    - 替换 `static/img/`、`static/sfx/` 和 `static/videos/` 中的对应素材；
    - 星级素材映射见 `src/lib/helpers/wishAssets.js`。
- **界面与音乐参数**
    - 首页在 `src/routes/+page.svelte`，界面组件在 `src/lib/components/`，音量和渐变时长在 `src/lib/helpers/audio.js`。

开发模式下保存源码即可看到修改效果。页面内的自定义内容可能覆盖源码默认值，可在编辑面板中恢复默认后查看。

## 致谢

本项目的架构来自另一个开源的原神抽奖模拟器项目

感谢该项目的各位开发者！

https://github.com/wibe01204/Genshin-Impact-Wish-Simulator

——————

此外，全部角色立绘（除了Zun和村民）均来自**dairi**老师。感谢老师的创作！

https://www.pixiv.net/users/4920496
