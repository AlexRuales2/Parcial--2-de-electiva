import { app, BrowserWindow, ipcMain, shell } from 'electron'
import * as path from 'path'
import { initDatabase, getProjectsIPC, createProjectIPC, addExpenseIPC, getExpensesIPC, generateBudgetPdf, getMembersIPC, createMemberIPC } from './db/database'

// Deshabilitando la aceleración GPU
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    // Deshabilitando temporalmente la aceleración de hardware
    webPreferences: {
      ...app.isPackaged ? {} : { webSecurity: false },
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (!app.isPackaged) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    win.loadURL(devUrl)
    // optional: win.webContents.openDevTools()
  } else {
    const indexHtml = `file://${path.join(__dirname, '../dist-renderer/index.html+')}`
    win.loadURL(indexHtml)
  }
}

// Configurar opciones de Electron antes de iniciar
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')

app.whenReady().then(async () => {
  try {
    await initDatabase()
    createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (error) {
    console.error('Error durante la inicialización:', error)
    app.quit()
  }
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// IPC handlers
ipcMain.handle('projects:getAll', getProjectsIPC)
ipcMain.handle('projects:create', createProjectIPC)
ipcMain.handle('members:getAll', getMembersIPC)
ipcMain.handle('members:create', createMemberIPC)
ipcMain.handle('budget:addExpense', addExpenseIPC)
ipcMain.handle('budget:getExpenses', getExpensesIPC)
ipcMain.handle('report:generateBudgetPdf', async (event, projectId) => {
  try {
    console.log('IPC Handler: Generando PDF para proyecto:', projectId, 'Tipo:', typeof projectId)
    
    // Asegurar que projectId sea un número válido
    let numericProjectId: number
    
    if (typeof projectId === 'object' && projectId.projectId) {
      numericProjectId = Number(projectId.projectId)
    } else {
      numericProjectId = Number(projectId)
    }
    
    console.log('Proyecto ID numérico:', numericProjectId)
    
    if (isNaN(numericProjectId) || numericProjectId <= 0) {
      throw new Error(`ID de proyecto inválido: ${projectId}`)
    }
    
    const filepath = await generateBudgetPdf(numericProjectId)
    console.log('IPC Handler: PDF generado en:', filepath)
    return filepath
  } catch (error) {
    console.error('IPC Handler Error:', error)
    throw error
  }
})

// helper to open path (optional)
ipcMain.handle('shell:openPath', async (event, filePath: string) => {
  try {
    await shell.openPath(filePath)
    return true
  } catch (err) {
    return false
  }
})
