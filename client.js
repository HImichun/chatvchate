const ipc = require('electron').ipcRenderer

console.log("meow")

window.send = function(text){
	let randomId = user_id + "_" + new Date().getTime() + chat_request_id

	if (text.length > 0) {
		createMessage(1, text, getNowTime(), randomId)

		ChatEngine.chatMessage(current_dialog, text, randomId)
		ChatEngine.typingMessage(current_dialog, false)

		time_last_query_typing = 0
		chat_request_id++
	}

	scrollToLastMessage()
	console.log("sent", text)
}

// admin message
window.s = function(text) {
	if(userState > 0)
		toAll("\<oh\> " + text)
	else
		toOthers("\<oh\> " + text)
}

// user message
window.sendMessage = function(text) {
	ipc.send("message", text, name)
}

window.toAll = function(text) {
	send(text)
	toOthers(text)
}

window.toOthers = function(text) {
	ipc.send("message", text)
}


window.create = function(){
	ipc.send("create-window")
}

window.end = function(){
	ipc.send("end")
}

const FIRST_MESSAGE = `~Вы попали в чат в чате, напишите что-нибудь (НЕ КОМАНДУ), чтобы начать.\n\nЧто это?\n- Групповой чат.\n\nЗачем?\n- Я так хочу.\n\nЭто бот?\n- Боты, объединяющие реальных людей.\n\nЕсли что-то не нравится, не тратьте своё время - выходите.\n\n#help - список команд`

// ipc.on("start", (event) => {
function start(){
	window.onbeforeunload = ()=>{}
	window.nameEl = document.getElementsByClassName("who_chat")[0]

	window.name = null
	window.role = ""
	window.userState = -1
	window.warns = 0

	window.lastMessageTime = new Date().getTime()
	window.lastMessage = ""


	if(true){
		let closeBtn = document.getElementById("closeDialogBtn")
		closeBtn.style.position = "absolute"
		closeBtn.style.right = "8px"
		closeBtn.style.top = "10px"

		let nameLine = document.getElementsByClassName("left_block_hc")[0]
		nameLine.style.overflow  = "hidden"
		nameLine.style.width 	 = "100%"
		nameLine.style.height 	 = "1.1em"
		nameLine.style.wordBreak = "break-all"
	}

	// send
	HandlerMessage["_message.new"] = HandlerMessage["\x6D\x65\x73\x73\x61\x67\x65\x73\x2E\x6E\x65\x77"]
	HandlerMessage["\x6D\x65\x73\x73\x61\x67\x65\x73\x2E\x6E\x65\x77"] = function (data){
		HandlerMessage["_message.new"](data)
		if(data.senderId != user_id){
			let message = data.message
			const messageTime = new Date().getTime()
			const oldWarns = warns
			console.log("recieved", message)

			// drop sibling
			if(message == FIRST_MESSAGE){
				ChatEngine.leaveDialog(current_dialog)
				return
			}

			// spam prevention
			if(messageTime - lastMessageTime < 1000){
				warns++
				send("~Сообщение не отправлено: вы слишком часто пишете сообщения")
			}
			if(message == lastMessage){
				warns++
				send("~Сообщение не отправлено: ваши сообщения повторяются")
			}

			if(warns > oldWarns) {
				if(warns > 6)
					ChatEngine.leaveDialog(current_dialog)
				else
					send("~Осторожней")
				return
			}

			lastMessageTime = messageTime
			lastMessage = message

			// ~ ignore
			if(message[0] === "~")
				return

			// commands
			else if(message[0] === "#") {
				if(message === "#help"){
					let text = "~Команды:\n\n#status - состояние чата\n#name - узнать своё имя\n#me [сообщение] - сообщение от третьего лица"
					if(role == "moderator")
						text += "\n#ids - получить id чатовцев\n#kick [id] - кикнуть человека с данным id"
					send(text)
				}
				//
				else if(message === "#status"){
					if(userState == 1){
						const text = "~Сейчас в чате:"
						const users = ipc.sendSync("get-users")
						for(const {name} of users)
							text += `\n[${name}]`
						send(text)
					}
					else
						send(ipc.sendSync("get-status"))
				}
				//
				else if(message === "#name") {
					if(userState == 1)
						send(`~Ваше имя - ${name}`)
					else
						send("~У вас ещё нет имени")
				}
				//
				else if(message.match(/^#me/)) {
					if(userState == 1) {
						if(message.match(/^#me [\s\S]+/))
							toAll(`*${name} ${message.substring(4)}*`)
						else
							send(`~Использование: \"#me [сообщение]\"`)
					}
					else
						send("~Вы ещё не в чате")
				}
				//
				else if(message == "#ids" && role == "moderator") {
					let text = "id | name"
					const users = ipc.sendSync("get-users")
					for(const {id, name} of users)
						text += `\n${id} | ${name}`
					send(text)
				}
				//
				else if(message.match(/^#kick/) && role == "moderator") {
					if(message.match(/^#kick [\d]+/))
						ipc.send("kick", message.substring(6))
					else
						send(`~Использование: \"#kick [id]\"`)
				}
				//
				else
					send("~Такой комманды нет, или она вам не доступна")
			}

			// name not set
			else if(userState == -1){
				name = ipc.sendSync("get-name", data.senderId)
				if(name){
					userState = 0
					send(`~Введите ваше имя`)
				}
				else{
					userState = 1
					nameEl.innerText = name
					ipc.send("set-status", true, name)
					toAll(`~Добро пожаловать, ${name}`)
				}
			}

			// name is being set
			else if(userState == 0){
				name = message
				nameEl.innerText = name
				userState = 1
				ipc.send("set-name", data.senderId, name)
				ipc.send("set-status", true, name)
				toAll(`~Добро пожаловать, ${name}`)
			}

			// normal message
			else if(userState == 1){
				if(warns > 0)
					warns -= 0.1
				sendMessage(message)
			}

			// this shouldn't ever happen
			else
				send("~Что-то пошло не так")
		}
	}
	// found anon
	HandlerMessage["_dialog.opened"] = HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x6F\x70\x65\x6E\x65\x64"]
	HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x6F\x70\x65\x6E\x65\x64"] = function (data){
		HandlerMessage["_dialog.opened"](data)
		userState = -1
		name = null
		warns = 0
		lastMessage = ""
		send(FIRST_MESSAGE)
	}
	// closed dialog
	HandlerMessage["_dialog.closed"] = HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x63\x6C\x6F\x73\x65\x64"]
	HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x63\x6C\x6F\x73\x65\x64"] = function (data){
		HandlerMessage["_dialog.closed"](data)
		if(userState == 1)
			toOthers(`~${name} больше не с нами`)
		ipc.send("set-status", false, "")

		if(role){
			()=>{
				let i = 0
				const interval = setInterval(()=>{
					playSound()
					if(i++ >= 5)
						clearInterval(interval)
				}, 600)
			}
			role = ""
		}
		ChatEngine.searchCompany({wishSex: null})
	}
	console.log("started")
}
// })

ipc.on("message", (_, text, name, id) => {
	if(userState == 1){
		if(name && id){
			if(role == "moderator")
				send(`[${name} | ${id}] ${text}`)
			else
				send(`[${name}] ${text}`)
		}
		else
			send(text)
	}
})

ipc.on("kick", () => {
	ChatEngine.leaveDialog(current_dialog)
})



setTimeout(start, 5000)