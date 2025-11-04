"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    projects: {
        getAll: () => electron_1.ipcRenderer.invoke('projects:getAll'),
        create: (payload) => electron_1.ipcRenderer.invoke('projects:create', payload)
    },
    members: {
        getAll: () => electron_1.ipcRenderer.invoke('members:getAll'),
        create: (payload) => electron_1.ipcRenderer.invoke('members:create', payload)
    },
    budget: {
        addExpense: (payload) => electron_1.ipcRenderer.invoke('budget:addExpense', payload),
        getExpenses: (projectId) => electron_1.ipcRenderer.invoke('budget:getExpenses', projectId)
    },
    report: {
        generateBudgetPdf: (projectId) => electron_1.ipcRenderer.invoke('report:generateBudgetPdf', projectId)
    },
    shell: {
        openPath: (filePath) => electron_1.ipcRenderer.invoke('shell:openPath', filePath)
    }
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', api);
// typings: declare in global.d.ts if you want stronger types in renderer
