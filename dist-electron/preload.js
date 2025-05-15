const { contextBridge, ipcRenderer } = require('electron');
console.log('Preload script is running');
// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electron', {
    showSaveDialog: (options) => {
        console.log('showSaveDialog called with options:', options);
        return ipcRenderer.invoke('show-save-dialog', options);
    }
});
console.log('Preload script finished');
//# sourceMappingURL=preload.js.map