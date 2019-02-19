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

	console.log("sent", text)
}

window.s = function(text) {
	emit("\<oh\> " + text)
}

window.emit = function(text) {
	send(text)
	ipc.send("message", text)
}

window.create = function(){
	ipc.send("create-window")
}

window.end = function(){
	ipc.send("end")
}

ipc.on("start", (event) => {
	window.name = -1
	// send
	HandlerMessage["_message.new"] = HandlerMessage["\x6D\x65\x73\x73\x61\x67\x65\x73\x2E\x6E\x65\x77"]
	HandlerMessage["\x6D\x65\x73\x73\x61\x67\x65\x73\x2E\x6E\x65\x77"] = function (data){
		HandlerMessage["_message.new"](data)
		if(data.senderId != user_id){
			const message = data.message
			console.log("recieved", message)

			// ~ ignore
			if(data.message[0] === "~")
				return

			// command
			else if(data.message[0] === "#") {
				if(data.message === "#help")
					send("~Комманды:\n\n#status - состояние чата\n#name - узнать своё имя\n#me - сообщение от третьего лица")
				else if(data.message === "#status")
					send(ipc.send("get-status"))
				else if(data.message === "#name" && isNaN(name-0))
					send(`~Ваше имя - ${name}`)
				else if(data.message.match(/^#me /) && isNaN(name-0))
					emit(`*${name} ${data.message.substring(4)}*`)
				else
					send("~Такой комманды нет, или она вам не доступна")
			}

			// name not set
			else if(name-0 === -1){
				name = ipc.sendSync("get-name", data.senderId) // sets name to 0 if not found
				if(name-0 === 0)
					send(`~Введите ваше имя`)
				else
					emit(`~Добро пожаловать, ${name}`)
			}

			// name is being set
			else if(name-0 === 0){
				name = message
				ipc.send("set-name", data.senderId, name)
				emit(`~Добро пожаловать, ${name}`)
			}

			// normal message
			else if(isNaN(name-0))
				ipc.send("message", `[${name}] ${message}`)

			// this shouldn't ever happen
			else
				send("~Что-то пошло не так")
		}
	}
	// found anon
	HandlerMessage["_dialog.opened"] = HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x6F\x70\x65\x6E\x65\x64"]
	HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x6F\x70\x65\x6E\x65\x64"] = function (data){
		HandlerMessage["_dialog.opened"](data)
		name = -1
		send(`~Вы попали в чат в чате, напишите что-нибудь, чтобы начать.\n\nЧто это?\n- Групповой чат.\n\nЗачем?\n- Я так хочу.\n\nЭто бот?\n- Боты, объединяющие реальных людей.\n\nЕсли что-то не нравится, не тратьте своё время - выходите.`)
		ipc.send("active", true)
	}
	// closed dialog
	HandlerMessage["_dialog.closed"] = HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x63\x6C\x6F\x73\x65\x64"]
	HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x63\x6C\x6F\x73\x65\x64"] = function (data){
		HandlerMessage["_dialog.closed"](data)
		if(isNaN(name-0))
			ipc.send("message", `~${name} больше не с нами`)
		ipc.send("active", false)
	}
	console.log("started")
})

ipc.on("message", (event,text) => {
	if(isNaN(name-0))
		send(text)
})

console.log(window)







// postData("http://localhost:3000", {hmm: "hmmm"})
//   .then(data => console.log(JSON.stringify(data)))
//   .catch(error => console.error(error));

function postData(url = "", data = {}) {
// Default options are marked with *
	return fetch(url, {
		method: "POST", // *GET, POST, PUT, DELETE, etc.
		mode: "no-cors", // no-cors, cors, *same-origin
		cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
		credentials: "same-origin", // include, *same-origin, omit
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			// "Content-Type": "application/x-www-form-urlencoded",
		},
		redirect: "follow", // manual, *follow, error
		referrer: "no-referrer", // no-referrer, *client
		body: JSON.stringify(data), // body data type must match "Content-Type" header
	})
	.then(response => response.json()) // parses response to JSON
}