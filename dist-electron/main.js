const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false // 开发环境下禁用 web 安全策略
        }
    });
    // 加载应用
    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:5173');
        // 打开开发者工具
        win.webContents.openDevTools();
    }
    else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    // 打印预加载脚本路径，用于调试
    console.log('Preload script path:', path.join(__dirname, 'preload.js'));
}
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
// 处理保存对话框
ipcMain.handle('show-save-dialog', async (event, options) => {
    try {
        const result = await dialog.showSaveDialog(options);
        return result;
    }
    catch (error) {
        console.error('Error showing save dialog:', error);
        throw error;
    }
});
//# sourceMappingURL=main.js.map