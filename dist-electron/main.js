"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const database_1 = require("./db/database");
// Deshabilitando la aceleración GPU
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        // Deshabilitando temporalmente la aceleración de hardware
        webPreferences: {
            ...electron_1.app.isPackaged ? {} : { webSecurity: false },
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    if (!electron_1.app.isPackaged) {
        const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
        win.loadURL(devUrl);
        // optional: win.webContents.openDevTools()
    }
    else {
        const indexHtml = `file://${path.join(__dirname, '../dist-renderer/index.html+')}`;
        win.loadURL(indexHtml);
    }
}
// Configurar opciones de Electron antes de iniciar
electron_1.app.commandLine.appendSwitch('disable-gpu');
electron_1.app.commandLine.appendSwitch('disable-software-rasterizer');
electron_1.app.whenReady().then(async () => {
    try {
        await (0, database_1.initDatabase)();
        createWindow();
        electron_1.app.on('activate', function () {
            if (electron_1.BrowserWindow.getAllWindows().length === 0)
                createWindow();
        });
    }
    catch (error) {
        console.error('Error durante la inicialización:', error);
        electron_1.app.quit();
    }
});
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// IPC handlers
electron_1.ipcMain.handle('projects:getAll', database_1.getProjectsIPC);
electron_1.ipcMain.handle('projects:create', database_1.createProjectIPC);
electron_1.ipcMain.handle('members:getAll', database_1.getMembersIPC);
electron_1.ipcMain.handle('members:create', database_1.createMemberIPC);
electron_1.ipcMain.handle('budget:addExpense', database_1.addExpenseIPC);
electron_1.ipcMain.handle('budget:getExpenses', database_1.getExpensesIPC);
electron_1.ipcMain.handle('report:generateBudgetPdf', async (event, projectId) => {
    try {
        console.log('IPC Handler: Generando PDF para proyecto:', projectId, 'Tipo:', typeof projectId);
        // Asegurar que projectId sea un número válido
        let numericProjectId;
        if (typeof projectId === 'object' && projectId.projectId) {
            numericProjectId = Number(projectId.projectId);
        }
        else {
            numericProjectId = Number(projectId);
        }
        console.log('Proyecto ID numérico:', numericProjectId);
        if (isNaN(numericProjectId) || numericProjectId <= 0) {
            throw new Error(`ID de proyecto inválido: ${projectId}`);
        }
        const filepath = await (0, database_1.generateBudgetPdf)(numericProjectId);
        console.log('IPC Handler: PDF generado en:', filepath);
        return filepath;
    }
    catch (error) {
        console.error('IPC Handler Error:', error);
        throw error;
    }
});
// helper to open path (optional)
electron_1.ipcMain.handle('shell:openPath', async (event, filePath) => {
    try {
        await electron_1.shell.openPath(filePath);
        return true;
    }
    catch (err) {
        return false;
    }
});
