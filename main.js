const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const fs = require('fs');
const path = require('path');

// 纯 2D 界面，关掉硬件加速更稳（个别机器显卡驱动会让 Electron 起不来）
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');

// 数据文件放在「项目根」：打包后取 exe 上一级，开发时取源码上一级，不再写死盘符
function resolveDataPath() {
  const cands = [];
  if (process.env.RECORDER_DATA_DIR) cands.push(process.env.RECORDER_DATA_DIR);
  cands.push(app.isPackaged ? path.resolve(path.dirname(app.getPath('exe')), '..') : path.resolve(__dirname, '..'));
  cands.push(app.getPath('userData'));
  for (const dir of cands) {
    try { fs.mkdirSync(dir, { recursive: true }); fs.accessSync(dir, fs.constants.W_OK); return path.join(dir, 'records.json'); } catch (e) { /* 换下一个候选目录 */ }
  }
  return path.join(app.getPath('userData'), 'records.json');
}
const DATA_PATH = resolveDataPath();

function createWindow() {
  const win = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 940,
    minHeight: 640,
    title: '备考目标 · 倒计时记录本',
    backgroundColor: '#f1f4fa',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  win.loadFile('page.html');
  win.on('page-title-updated', e => e.preventDefault());
}

ipcMain.handle('read-data', async () => {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    return fs.readFileSync(DATA_PATH, 'utf8');
  } catch (e) { return null; }
});

ipcMain.handle('write-data', async (e, text) => {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    // 先写临时文件再替换，避免写一半断电导致数据文件损坏
    const tmp = DATA_PATH + '.tmp';
    fs.writeFileSync(tmp, text, 'utf8');
    fs.renameSync(tmp, DATA_PATH);
    return true;
  } catch (err) { return false; }
});

// 迁移前把老数据原样留一份，出问题能找回
ipcMain.handle('backup-raw', async () => {
  try {
    if (!fs.existsSync(DATA_PATH)) return null;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const target = path.join(path.dirname(DATA_PATH), `records.旧版备份-${stamp}.json`);
    fs.copyFileSync(DATA_PATH, target);
    return target;
  } catch (e) { return null; }
});

ipcMain.handle('save-backup', async (e, text) => {
  const r = await dialog.showSaveDialog({
    title: '导出备份',
    defaultPath: '备考目标备份-' + new Date().toISOString().slice(0, 10) + '.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (r.canceled || !r.filePath) return null;
  try { fs.writeFileSync(r.filePath, text, 'utf8'); return r.filePath; } catch (err) { return null; }
});

ipcMain.handle('open-external', async (e, url) => {
  if (!url) return false;
  try { await shell.openExternal(url); return true; } catch (err) { return false; }
});

ipcMain.handle('open-path', async (e, p) => {
  if (!p) return false;
  try { const err = await shell.openPath(p); return !err; } catch (err) { return false; }
});

ipcMain.handle('open-backup', async () => {
  const r = await dialog.showOpenDialog({
    title: '恢复备份', properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (r.canceled || !r.filePaths || !r.filePaths[0]) return null;
  const fp = r.filePaths[0];
  try { return { name: path.basename(fp), text: fs.readFileSync(fp, 'utf8') }; } catch (e) { return null; }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { app.quit(); });
