const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('appfs', {
  native: true,
  pathname: 'records.json（与程序目录同级）',
  read: () => ipcRenderer.invoke('read-data'),
  write: (text) => ipcRenderer.invoke('write-data', text),
  backupRaw: () => ipcRenderer.invoke('backup-raw'),
  saveBackup: (payload) => ipcRenderer.invoke('save-backup', typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)),
  openBackup: () => ipcRenderer.invoke('open-backup'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openPath: (p) => ipcRenderer.invoke('open-path', p)
});
