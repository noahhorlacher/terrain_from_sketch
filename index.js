'use strict';

const {
  app,
  BrowserWindow
} = require('electron')
const locals = {
  /* ...*/ }
const setupPug = require('electron-pug')

app.on('ready', async () => {
  try {
    let pug = await setupPug({
      pretty: true
    }, locals)
    pug.on('error', err => console.error('electron-pug error', err))
  } catch (err) {
    console.log(err)
  }

  let win = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.menuBarVisible = false
  win.webContents.openDevTools()

  win.loadURL(`file://${__dirname}/public/index.pug`)
})