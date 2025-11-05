import { contextBridge, ipcRenderer } from 'electron'

const api = {
  projects: {
    getAll: () => ipcRenderer.invoke('projects:getAll'),
    create: (payload: any) => ipcRenderer.invoke('projects:create', payload)
  },
  members: {
    getAll: () => ipcRenderer.invoke('members:getAll'),
    create: (payload: any) => ipcRenderer.invoke('members:create', payload)
  },
  budget: {
    addExpense: (payload: any) => ipcRenderer.invoke('budget:addExpense', payload),
    getExpenses: (projectId: number) => ipcRenderer.invoke('budget:getExpenses', projectId)
  },
  report: {
    generateBudgetPdf: (projectId: number) => ipcRenderer.invoke('report:generateBudgetPdf', projectId)
  },
  shell: {
    openPath: (filePath: string) => ipcRenderer.invoke('shell:openPath', filePath)
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

// typings: declare in global.d.ts if you want stronger types in renderer
