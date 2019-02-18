const electron = require('electron')
const ipc = electron.ipcMain
const session = electron.session
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

const names = []

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = []
let partition = 1

function createWindow () {
	// Create the browser window.
	let  window = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: false,
			session: new session.fromPartition("uhm"+partition++),
			preload: path.join(__dirname, "./client.js")
		}
	})

	// and load the index.html of the app.
	window.loadURL(url.format({
		pathname: "nekto.me/chat",
		protocol: 'https:',
		slashes: true
	}))

	// Open the DevTools.
	if(!windows.length)
		window.webContents.openDevTools()

	// Emitted when the window is closed.
	window.on('closed', () => {
		window = null
	})

	windows.push(window)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', ()=>{
	createWindow()
	createWindow()
	createWindow()
	createWindow()

	setTimeout(()=>{
		for(const id in windows)
			windows[id].webContents.send("start", +id+1)
	},3000)
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (windows[0] === null) {
		createWindow()
	}
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipc.on("message", (event, text) => {
	for(const window of windows)
		if(window.webContents != event.sender)
			window.webContents.send("message", text)
})

ipc.on("get-name", (event, uid) => {
	event.returnValue = names[uid] || 0
})
ipc.on("set-name", (event, uid, name) => {
	names[uid] = name
})

ipc.on("end", () => {
	for(const window of windows)
		window.destroy()
})