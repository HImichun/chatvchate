const ipc = require('electron').ipcRenderer

const log = console.log
console.log = () => {}

log("meow")

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
	ipc.send("message", text, name, role)
}

window.toAll = function(text) {
	send(text)
	toOthers(text)
}

window.toOthers = function(text) {
	ipc.send("message", text)
}

window.setRole = function(newRole) {
	role = newRole
	ipc.send("set-status", {
		role: newRole
	})
}

window.create = function(){
	ipc.send("create-window")
}

window.end = function(){
	ipc.send("end")
}

window.maxMessage = function(){
	if(rep <= 0)
		return 50
	return 50 + rep*10
}

window.minPeriod = function(){
	if(rep <= 0)
		return 5000
	return (-0.16*rep + 5) * 1000
}

window.addRep = function(){
	if(rep < 25)
		rep++
}

const FIRST_MESSAGE = `~Вы попали в чат в чате, прочитайте правила и список команд, чтобы начать.
\nЧто это?
- Групповой чат.
\nЗачем?
- Я так хочу.
\nЭто бот?
- Боты, объединяющие реальных людей.
\nЕсли вам что-то не нравится, не тратьте своё время - выходите.
\n#rules - правила (ОБЯЗАТЕЛЬНЫ К ПРОЧТЕНИЮ)
#help - список команд (ОБЯЗАТЕЛЕН К ПРОЧТЕНИЮ)`
const FIRST_MESSAGE_RETURNING = `~Вы снова попали в чат в чате, напишите что-нибудь (НЕ КОМАНДУ), чтобы начать.
\n#rules - правила (ОБЯЗАТЕЛЬНЫ К ПРОЧТЕНИЮ)
#help - список команд (ОБЯЗАТЕЛЕН К ПРОЧТЕНИЮ)`
const BAN_MESSAGE = `~Вы попали в чат в чате, но вас в нём забанили. Наверное, вы плохо себя вели.
Извините за неудобства.`

const RULES = `~Правила:
1. Никого не обижать
2. Не спамить/флудить
3. Ничего не рекламировать
4. Не пошлить/интимить
5. Вы не можете молчать дольше 10-и минут

~Ограничения:
Длина сообщений изначально ограничена до 50 символов и с каждым сообщением будет расти на 10 (предел - 300).
Время между сообщениями подобным образом начинается с 5 секунд и опускается до 1.

За нарушение правил вы можете быть кикнуты или забанены.`

const HELP_BASE = `~Команды:
#rules - правила
#status - список чатовцев
#name - узнать/изменить своё имя
#me сообщение - сообщение от третьего лица
#d число_сторон - бросить кубик с указанным числом сторон (#help d - больше информации)`
const HELP_MODERATOR = `\n\n~Команды модератора:
#ids - получить id чатовцев
#rename id новое_имя - переименовать чатовца с данным id
#mute id - замутить чатовца с данным id
#unmute id - размутить чатовца с данным id
#kick id - кикнуть чатовца с данным id
#ban id - забанить чатовца с данным id
\nВ коммандах kick и ban можно указывать несколько id, разделяя их пробелами`

window.COMMON_SETTINGS = {
	wishSex: null
}
window.RARE_SETTINGS = {
	mySex: "F",
	myAge: [26, 35],
	wishSex: "F",
	wishAge: [[26, 35]]
}


function start(){
	window.onbeforeunload = ()=>{}
	window.setHeiHeight = function(){
		let h = window.innerHeight-140
		document.getElementById("scrollbox3").style.height = h + "px"
	}
	window.setHeight = window.setHeiHeight
	window.onresize = window.setHeiHeight

	window.nameEl = document.getElementsByClassName("who_chat")[0]
	window.chatBlockEl = document.getElementsByClassName("window_chat_block")[0]

	window.settings = COMMON_SETTINGS

	window.userState = -1
	window.userId = 0
	window.name = ""
	window.role = ""
	window.warns = 0
	window.rep = 0
	window.mute = false
	window.readRules = false
	window.readHelp = false

	window.lastMessageTime = new Date().getTime()
	window.lastMessage = ""
	window.afkTimer = null


	if(true){
		let nameLine = document.getElementsByClassName("left_block_hc")[0]
		nameLine.style.overflow  = "hidden"
		nameLine.style.width 	 = "100%"
		nameLine.style.height 	 = "1.1em"
		nameLine.style.wordBreak = "break-all"
		while(nameLine.firstChild != nameEl)
			nameLine.firstChild.remove()

		let closeBtn = document.getElementById("closeDialogBtn")
		closeBtn.style.position = "absolute"
		closeBtn.style.top = "10px"
		closeBtn.style.right = "8px"
		closeBtn.style.width = "48px"
		closeBtn.innerText = "kick"

		let banBtn = document.createElement("button")
		banBtn.style.position = "absolute"
		banBtn.style.top = "10px"
		banBtn.style.right = "64px"
		banBtn.style.width = "48px"
		banBtn.innerText = "ban"
		banBtn.onclick = () => ipc.send("ban", "self")
		closeBtn.insertAdjacentElement("beforebegin", banBtn)

		document.querySelector(".container.chat_container").style.marginTop = "0"
		document.getElementById("chat_box").style.height = ""
		document.getElementById("scrollbox3").style.height = ""
		document.querySelector(".a.navbar.navbar-inverse.navbar-fixed-top").remove()
		document.getElementsByClassName("advMobileBlock")[0].remove()
	}

	// send
	HandlerMessage["_message.new"] = HandlerMessage["\x6D\x65\x73\x73\x61\x67\x65\x73\x2E\x6E\x65\x77"]
	HandlerMessage["\x6D\x65\x73\x73\x61\x67\x65\x73\x2E\x6E\x65\x77"] = function (data){
		HandlerMessage["_message.new"](data)

		while(chatBlockEl.childElementCount > 30)
			chatBlockEl.firstChild.remove()

		// userId is the person
		// user_id is the bot
		if(data.senderId == user_id)
			return

		let message = data.message
		const messageTime = new Date().getTime()
		// const oldWarns = warns

		// drop sibling
		if(message == FIRST_MESSAGE){
			ChatEngine.leaveDialog(current_dialog)
			return
		}

		// spam prevention
		if(role != "moderator") {
			const oldRep = rep
			if(messageTime - lastMessageTime < minPeriod()){
				warns++
				rep -= 2
				send(`~Сообщение не отправлено: вы слишком часто пишете сообщения. Сейчас вы можете писать сообщения раз в ${Math.round(minPeriod()*10)/10000} секунд`)
			}

			if(message == lastMessage){
				rep -= 2
				send("~Сообщение не отправлено, ваши сообщения повторяются.")
			}

			if(message.length > maxMessage()){
				rep -= 2
				send(`~Сообщение не отправлено. Сейчас вам доступно ${maxMessage()} символов на сообщение`)
			}

			if(warns > 6)
				ChatEngine.leaveDialog(current_dialog)

			if(rep < oldRep){
				if(rep <= -30)
					ChatEngine.leaveDialog(current_dialog)
				return
			}
		}

		lastMessageTime = messageTime
		lastMessage = message

		// ~ ignore
		if(message[0] === "~")
			return

		// commands
		else if(message[0] === "#") {
			const args = message.match(/\S+/g)
			const command = args.shift().substring(1)
			const argsText = args.join(" ")

			// base commands
			if(command == "help"){
				if(args.length == 0){
					let text = HELP_BASE
					if(role == "moderator")
						text += HELP_MODERATOR
					send(text)

					if(!readHelp && readRules){
						send("~Следующим сообщением отправьте имя, которое хотите использовать в чате")
						userState = 0
					}
					readHelp = true
				}
				else if(args[0] == "d")
					send("~Команда #d число_сторон:\nбросить кубик с указанным числом сторон;\nможно бросить несколько кубиков, если разделить пробелами их стороны;\nесли не указывать стороны, то будет брошен один кубик с 6 сторонами")
				else
					send("~Данная команда не существует или по ней нет дополнительной информации")
			}

			else if(command == "rules"){
				send(RULES)
				if(!readRules && readHelp){
					send("~Следующим сообщением отправьте имя, которое хотите использовать в чате")
					userState = 0
				}
				readRules = true
			}

			else if(command == "status"){
				const {slots, users} = ipc.sendSync("get-users")
				if(userState == 1){
					let text = `~Сейчас в чате:`
					for(const {name} of users)
						text += `\n[${name}]`
					text += `\nвсего ${users.length}/${slots} человек`
					send(text)
				}
				else
					send(`~Сейчас в чате ${users.length}/${slots} человек`)
			}

			else if(command == "name") {
				if(rejectNotInChat()) return
				if(argsText)
					changeName(argsText)
				else
					send(`~Ваше имя - ${name}\nДля смены имени исползуйте #name новое_имя`)
			}

			else if(command == "me") {
				if(rejectNotInChat()) return
				if(argsText){
					addRep()
					resetAfkTimer(10)
					toAll(`*${name} ${argsText}*`)
				}
				else
					send(`~Использование: \"#me сообщение\"`)
			}

			else if(command == "d") {
				if(rejectNotInChat()) return
				const dice = args
				if(dice.length == 0)
					dice.push("6")
				if(dice.some(die => isNaN(die))) // there are NaNs
					send("~Все аргументы должны быть числами")
				else if(dice.length > 6)
					send("~Максимум - 6 кубиков")
				else if(dice.some(die => Number(die) > 100 || Number(die) < 2))
					send("~Сторон должно быть не меньше 2 и не больше 100")
				else{
					let text = `~${name} бросил `
					if(dice.length == 1)
						text += `кубик с ${dice} сторонами:\n`
					else if(dice.length % 10 == 1 && dice.length != 11)
						text += `${dice.length} кубик со сторонами ${dice.join(" ")}:\n`
					else if(dice.length % 10 == 2 && dice.length != 12
					|| dice.length % 10 == 3 && dice.length != 13
					|| dice.length % 10 == 4 && dice.length != 14)
						text += `${dice.length} кубика со сторонами ${dice.join(" ")}:\n`
					else
						text += `${dice.length} кубиков со сторонами ${dice.join(" ")}:\n`
					for(const die of dice) {
						text += Math.ceil(Math.random() * die) + " "
					}
					toAll(text)
				}
			}

			else if(command == "log" && argsText){
				const [newName, password] = argsText.split(/\s*:\s*/)
				const {role, err} = ipc.sendSync("get-account", newName, password)
				if(err)
					send("~Аккаунт с такими данными не найден")
				else {
					changeName(newName)
					setRole(role)
				}
			}

			// moderator's commands
			else if(role == "moderator") {
				if(command == "ids") {
					let text = "id | name"
					const {slots, users} = ipc.sendSync("get-users")
					for(const {id, name} of users)
						text += `\n${id} | ${name}`
					text += `\nвсего ${users.length}/${slots} человек`
					send(text)
				}

				else if(command == "rename") {
					const id = args.shift()
					const name = args.join(" ")
					if(id && name)
						ipc.send("rename", id, name)
					else
						send(`~Использование: \"#rename id новое_имя\"`)
				}

				else if(["mute", "unmute", "kick", "ban"].includes(command)) {
					const ids = args
					if(ids.length)
						ipc.send(command, ids)
					else
						send(`~Использование: \"#${command} id\"`)
				}
			}
			else
				send("~Такой комманды нет, или она вам не доступна")
		}

		// name not set
		else if(userState == -1){
			if(readHelp && readRules){
				userState = 0
				send("~Введите ваше имя")
			}
			else {
				warns++
				if(readRules)
					send("~Не пишите обычные сообщения пока не попадёте в чат.\nСначала ознакомьтесь cо списком команд.\nДля этого используйте команду #help")
				else if(readHelp)
					send("~Не пишите обычные сообщения пока не попадёте в чат.\nСначала ознакомьтесь c правилами.\nДля этого используйте команду #rules")
				else
					send("~Не пишите обычные сообщения пока не попадёте в чат.\nСначала ознакомьтесь c правилами и списком команд.\nДля этого используйте команды:\n#rules\n#help")
			}
		}

		// name is being set
		else if(userState == 0){
			resetAfkTimer(10)
			const newName = message
			changeName(newName)
		}

		// mute
		else if(mute){
			send("~Вы замьючены и не можете отправлять сообщения")
		}

		// normal message
		else if(userState == 1){
			addRep()
			resetAfkTimer(10)
			if(warns > 0)
				warns -= 0.1

			sendMessage(message)
		}

		// this shouldn't ever happen
		else
			send("~Что-то пошло не так")
	}
	// found anon
	HandlerMessage["_dialog.opened"] = HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x6F\x70\x65\x6E\x65\x64"]
	HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x6F\x70\x65\x6E\x65\x64"] = function (data){
		HandlerMessage["_dialog.opened"](data)

		userId = data.interlocutors[0] == user_id
			? data.interlocutors[1]
			: data.interlocutors[0]
		log(userId)
		userState = -1
		name = ""
		role = ""
		warns = 0
		rep = 0
		mute = false
		lastMessage = ""
		readRules = false
		readHelp = false
		resetAfkTimer(3)

		if(ipc.sendSync("is-banned", userId)){
			send(BAN_MESSAGE)
			ChatEngine.leaveDialog(current_dialog)
			return
		}
		const rememberedName = ipc.sendSync("get-name", userId)
		if(rememberedName){
			send(FIRST_MESSAGE_RETURNING)
			changeName(rememberedName)
		}
		else
			send(FIRST_MESSAGE)
	}
	// closed dialog
	HandlerMessage["_dialog.closed"] = HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x63\x6C\x6F\x73\x65\x64"]
	HandlerMessage["\x64\x69\x61\x6C\x6F\x67\x2E\x63\x6C\x6F\x73\x65\x64"] = function (data){
		HandlerMessage["_dialog.closed"](data)
		if(userState == 1)
			toOthers(`~${name} больше не с нами`)

		ipc.send("set-status", {
			isActive: false,
			name: "",
			role: ""
		})
		ChatEngine.searchCompany(settings)
	}
	log("started")
}

window.resetAfkTimer = function(minutes){
	if(afkTimer)
		clearTimeout(afkTimer)
	afkTimer = setTimeout(function(){
		afkTimer = null
		if(role != "moderator")
			ChatEngine.leaveDialog(current_dialog)
	}, minutes*60000)
}

window.rejectNotInChat = function(){
	if (userState == 1)
		return false
	else if (userState == 0)
		send("~Вы ещё не в чате, отправьте своё имя, чтобы войти")
	else
		send("~Вы ещё не в чате\nСначала ознакомьтесь c правилами и списком команд.\nДля этого используйте команды #rules и #help")
	return true
}

window.changeName = (newName) => {
	newName = newName
		.replace(/^\s+|\s+$/g, "")
		.replace(/\s+/g, " ")

	let errors = []
	if(newName.length >= 40)
		errors.push("Максимальная длина имени - 40 символов.")

	if((/[A-zА-я]/g).test(newName) == false)
		errors.push("В имени должна быть хотя бы одна буква из латиницы или кириллицы")

	if(ipc.sendSync("is-name-used", newName))
		errors.push("Имя уже используется.")

	if((/[☆\[\]\<\>:]/).test(newName))
		errors.push("Вы не можете импользовать в имени следующие символы: ☆[]<>:")

	if(errors.length){
		send("~Ошибка:\n"+errors.join("\n"))
		return
	}

	userState = 1
	nameEl.innerText = newName
	ipc.send("set-status", {
		uid: userId,
		isActive: true,
		name: newName
	})

	if(name)
		toAll(`~${name} теперь ${newName}`)
	else
		toAll(`~Добро пожаловать, ${newName}`)

	name = newName
}


ipc.on("message", (_, text, name, role, id) => {
	if(userState == 1){
		if(name && id !== undefined){
			let prefix// = role == "moderator" ? "☆" : ""
			switch (role) {
				case "moderator": prefix = "☆"; break;
				case "heart"    : prefix = "♡"; break;
				default: prefix = ""
			}
			if(window.role == "moderator")
				send(`${prefix}[${name} | ${id}] ${text}`)
			else
				send(`${prefix}[${name}] ${text}`)
		}
		else
			send(text)
	}
})

ipc.on("rename", (event, newName) => {
	changeName(newName)
})

ipc.on("mute", () => {
	mute = true
	send("~Вы замьючены и не можете отправлять сообщения")
})
ipc.on("unmute", () => {
	mute = false
	send("~Вы размьючены и снова можете отправлять сообщения")
})
ipc.on("kick", () => {
	ChatEngine.leaveDialog(current_dialog)
})



setTimeout(start, 5000)