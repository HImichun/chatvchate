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
		width: 320,
		height: 679+25,
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

	// setTimeout(()=>window.webContents.send("start"), 4000)

	windows.push(window)

	// Emitted when the window is closed.
	window.on('closed', () => {
		windows.splice(windows.indexOf(window), 1)
		window = null
	})

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', ()=>{
	createWindow()
	createWindow()
	createWindow()
	createWindow()
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

ipc.on("get-status", (event) => {
	let active = 0
	for(const window of windows)
		if(window.webContents.isActive)
			active++
	event.returnValue = `~В чате ${active} из ${windows.length} человек`
})

ipc.on("set-status", (event, isActive, name) => {
	event.sender.isActive = isActive
	event.sender.name = name
})

ipc.on("get-users", event => {
	const users = []
	for(const id in windows){
		if(windows[id].webContents.isActive)
			users.push({id, name: windows[id].webContents.name})
	}
	event.returnValue = users
})

ipc.on("kick", (event, id) => {
	if(windows[id])
		windows[id].webContents.send("kick")
})

ipc.on("get-name", (event, uid) => {
	event.returnValue = names[uid] || null
})
ipc.on("set-name", (event, uid, name) => {
	names[uid] = name
})

ipc.on("create-window", () => {
	createWindow()
})

ipc.on("end", () => {
	for(const window of windows)
		window.destroy()
})