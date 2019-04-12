// import electron
const electron = require('electron')
const ipc = electron.ipcMain
const session = electron.session
const app = electron.app
const BrowserWindow = electron.BrowserWindow

// constants
const path = require("path")
const url = require("url")
const fs = require("fs")

//
const names = []
const bannedIds = []
const accounts = fs.readFileSync("./accounts.txt")
	.toString("utf-8")
	.split("\n")
	.map(line => {
		const [name, role, password] = line.split(/\s*:\s*/)
		return {name, role, password}
	})
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

	// Emitted when the window is closed.
	window.on('closed', () => {
		windows.splice(windows.indexOf(window), 1)
		window = null
		for(const i in windows)
			windows[i].webContents.wId = i
	})

	// add to windows list
	window.webContents.wId = windows.push(window) - 1 // .push returns the new length
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
	app.quit()
})


// const server = require("./server")

function addListener(type, func) {
	ipc.on(type, func)
}

// messages
addListener("message", (event, text, name, role) => {
	let id
	if (role == "moderator")
		id = "m"
	else
		id = event.sender.wId

	for(const window of windows){
		if(window.webContents != event.sender){
			if(name)
				window.webContents.send("message", text, name, role, id)
			else
				window.webContents.send("message", text)
		}
	}
})

addListener("set-status", (event, {isActive, uid, name, role}) => {
	if(isActive !== undefined)
		event.sender.isActive = isActive
	if(uid !== undefined)
		event.sender.uid = uid
	if(name !== undefined)
		event.sender.name = name
	if(uid !== undefined && name !== undefined)
		names[uid] = name
	if(role !== undefined)
		event.sender.role = role
})

addListener("get-users", event => {
	const users = []
	for(const i in windows){
		const wc = windows[i].webContents
		if(!wc.isActive) continue

		const id = wc.role == "moderator"
			? "m"
			: i
		users.push({id, name: wc.name})
	}
	event.returnValue = {slots: windows.length, users}
})

simpleCommand("mute")
simpleCommand("unmute")
simpleCommand("kick")
function simpleCommand(command){
	addListener(command, (event, affectedIds) => {
		for(const affectedId of affectedIds)
			if(windows[affectedId])
				windows[affectedId].webContents.send(command)
	})
}

addListener("ban", (event, ids) => {
	if(ids == "self")
		ids = [event.sender.wId]
	for(const id of ids)
		if(windows[id]){
			bannedIds.push(windows[id].webContents.uid)
			windows[id].webContents.send("kick")
		}
})
addListener("is-banned", (event, uid) => {
	event.returnValue = bannedIds.includes(uid)
})

addListener("is-name-used", (event, name) => {
	const reg = /[^A-zА-я]/g
	for(const {webContents: wc} of windows)
		if(wc.isActive && wc.name
			&& wc != event.sender
			&& wc.name.replace(reg, "").toLowerCase() == name.replace(reg, "").toLowerCase()
		){
			event.returnValue = true
			return
		}
	event.returnValue = ""
})
addListener("get-name", (event, uid) => {
	event.returnValue = names[uid] || ""
})
addListener("rename", (event, id, name) => {
	const window = windows[id]
	const uid = window.webContents.uid

	names[uid] = name
	window.webContents.name = name
	window.webContents.send("rename", name)
})

addListener("get-account", (event, name, password) => {
	const account = accounts.find(acc => acc.name === name && acc.password === password)
	event.returnValue = account || {err: 1}
})

addListener("create-window", () => {
	createWindow()
})

addListener("end", () => {
	for(const window of windows)
		window.destroy()
})