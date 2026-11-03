# 备考记录本 (exam-records)

一个纯本地的备考目标 / 倒计时记录桌面应用。数据只存在你自己电脑上的一个 JSON 文件里，不联网、不上传。

![tech](https://img.shields.io/badge/Electron-31-47848F) ![license](https://img.shields.io/badge/license-MIT-blue)

## 功能

- 多目标并行管理：每个目标有名称、日期、科目、备注
- 首页倒计时：按剩余天数排序，临近自动靠前
- 进度记录：按目标记录每日完成量，生成时间线
- 一键导出 / 导入 JSON，换机不丢数据

## 运行

```bash
npm install
npm start
```

打包（Windows，生成免安装绿色版）：

```bash
npm run build
```

## 数据存放

程序启动时按以下顺序找数据文件，找到第一个可用目录就用：

1. 环境变量 `RECORDER_DATA_DIR` 指定的目录
2. 便携版（portable）解压出的真实目录
3. exe 所在目录的上一级
4. Electron 默认 `userData` 目录

数据文件名固定为 `records.json`。首次运行若不存在会自动创建空文件。
仓库里的 `records.example.json` 是空结构样例，可直接复制成 `records.json` 使用。

## 目录

```
main.js            主进程：窗口、数据读写、IPC
preload.js         预加载脚本：暴露安全的文件读写接口
page.html          全部界面与业务逻辑（单页）
package.json       依赖与打包配置
records.example.json  空数据结构样例
```
