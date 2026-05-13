const { app, BrowserWindow, protocol } = require('electron')
const path = require('path')
const fs = require('fs')

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } },
])

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    title: 'CandyPixel',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  win.loadURL('app://./index.html')
}

app.whenReady().then(() => {
  const outDir = path.join(__dirname, '..', 'out')

  protocol.registerFileProtocol('app', (request, callback) => {
    let urlPath = request.url.replace('app://./', '')
    urlPath = urlPath.split('?')[0].split('#')[0]

    if (!urlPath || urlPath === '/') urlPath = 'index.html'

    let filePath = path.join(outDir, urlPath)

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      callback(filePath)
    } else {
      const indexPath = path.join(filePath, 'index.html')
      if (fs.existsSync(indexPath)) {
        callback(indexPath)
      } else {
        callback({ error: -6 })
      }
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
