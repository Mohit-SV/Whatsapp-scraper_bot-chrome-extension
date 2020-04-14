(function() {
	//
	// GLOBAL VARS AND CONFIGS
	//
	var lastMessageOnChat = false;
	var ignoreLastMsg = {};
	var elementConfig = {
		"chats": [0, 0, 5, 2, 0, 3, 0, 0, 0],
		"chat_icons": [0, 0, 1, 1, 1, 0],
		"chat_title": [0, 0, 1, 0, 0, 0, 0],
		"chat_lastmsg": [0, 0, 1, 1, 0, 0],
		"chat_active": [0, 0],
		"selected_title": [0, 0, 5, 3, 0, 1, 1, 0, 0, 0, 0]
	};
	
	questions = {
			 'name': "Thank you for your interest! We need just a few details from you to complete your application. \nPlease tell us your full name.",
			 'email': 'Please tell us your email id (example: abc@xyz.com).',
			 'ph_no': 'Please tell us your 10 digit mobile number.',
			 'city': 'Please tell us which city you currently reside in.',
			 'pincode': 'What is the pin code of your locality?',
			 'dob': 'What is your date of birth? Please enter in this format: DD/MM/YYYY',
			 'sex': "Please select your gender.\n 1. Male\n 2. Female\n 3. Other",
			 'done': "Great!!!\nThank you for the details. Your application is successfully completed.",
			 'finished':'Your application has been submitted! For any further information you reach us at help@go-xxx.com.'
	}

	contexts = [
			'name',
			'email',
			'city',
			'pincode',
			'dob',
			'sex',
			'done',
			'finished'
	]
	
	// valid number of options for the context
	num_valid = {
	'sex': 3,
	}

	loan_query = {
		'name': "Please tell us your full name (as mentioned in your application form).",
		'ph_no': 'Kindly share your registered 10-digit mobile number.',
		'query': 'Please tell us your query.',
		'thank_him': 'Please tell us anything else if you would like to add.',
		'msged_again': "Thank you for sharing your details! Our customer service representatives will be in touch with you soon. Thank you for your patience and understanding."
	}

	status_contexts = ['name', 'ph_no', 'query', 'thank_him', 'msged_again', 'stop']


	gen_query = "Thank you for your interest in XXXX! Please select any one of the following options to proceed ahead.\nHow does XXX works? \n https://help.xxx.in/ \n Question \n Ans_link"
	
	
	var index = {};
	var status_index = {};
	var primary_trigger = {};
	var start_trigger = {};
	var sent_msg = {};
	
	var alpha = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
	var digitss = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];


	//
	// FUNCTIONS
	//

	// Get random value between a range
	function rand(high, low = 0) {
		return Math.floor(Math.random() * (high - low + 1) + low);
	}

	function getElement(id, parent){
		if (!elementConfig[id]){
			return false;
		}
		var elem = !parent ? document.body : parent;
		var elementArr = elementConfig[id];
		elementArr.forEach(function(pos) {
			if (!elem.childNodes[pos]){
				return false;
			}
			elem = elem.childNodes[pos];
		});
		return elem;
	}

	function getLastMsg(){
		var messages = document.querySelectorAll('.msg');
		var pos = messages.length-1;
		// console.log(messages)
		// console.log(messages[pos]);

		while (messages[pos] && (messages[pos].classList.contains('msg-system') || messages[pos].querySelector('.message-in'))){
			pos--;
			if (pos <= -1){
				return false;
			}
		}
		if (messages[pos] && messages[pos].querySelector('.selectable-text')){
			return messages[pos].querySelector('.selectable-text').innerText.trim();
		} else {
			return false;
		}
	}

	function getUnreadChats(){
		var unreadchats = [];
		var chats = getElement("chats");
		if (chats){
			chats = chats.childNodes;
			for (var i in chats){
				if (!(chats[i] instanceof Element)){
					continue;
				}
				var icons = getElement("chat_icons", chats[i]).childNodes;
				if (!icons){
					continue;
				}
				for (var j in icons){
					if (icons[j] instanceof Element){
						if (!(icons[j].childNodes[0].getAttribute('data-icon') == 'muted' || icons[j].childNodes[0].getAttribute('data-icon') == 'pinned')){
							unreadchats.push(chats[i]);
							break;
						}
					}
				}
			}
		}
		return unreadchats;
	}

	function didYouSendLastMsg(){
		var messages = document.querySelectorAll('.msg');
		if (messages.length <= 0){
			return false;
		}
		var pos = messages.length-1;

		while (messages[pos] && messages[pos].classList.contains('msg-system')){
			pos--;
			if (pos <= -1){
				return -1;
			}
		}
		if (messages[pos].querySelector('.message-out')){
			return true;
		}
		return false;
	}

	// Call the main function again
	const goAgain = (fn, sec) => {
		// const chat = document.querySelector('div.chat:not(.unread)')
		// selectChat(chat)
		setTimeout(fn, sec * 1000)
	}

	// Dispath an event (of click, por instance)
	const eventFire = (el, etype) => {
		var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent(etype, true, true, window,0, 0, 0, 0, 0, false, false, false, false, 0, null);
		el.dispatchEvent(evt);
	}

	// Select a chat to show the main box
	const selectChat = (chat, cb) => {
		const title = getElement("chat_title",chat).title;
		eventFire(chat.firstChild.firstChild, 'mousedown');
		if (!cb) return;
		const loopFewTimes = () => {
			setTimeout(() => {
				const titleMain = getElement("selected_title").title;
				if (titleMain !== undefined && titleMain != title){
					// console.log('not yet');
					return loopFewTimes();
				}
				return cb();
			}, 300);
		}

		loopFewTimes();
	}

	// Send a message
	const sendMessage = (chat, message, cb) => {
		//avoid duplicate sending
		var title;

		if (chat){
			title = getElement("chat_title",chat).title;
		} else {
			title = getElement("selected_title").title;
		}
		ignoreLastMsg[title] = message;

		messageBox = document.querySelectorAll("[contenteditable='true']")[0];

		//add text into input field
		messageBox.innerHTML = message.replace(/  /gm,'');

		//Force refresh
		event = document.createEvent("UIEvents");
		event.initUIEvent("input", true, true, window, 1);
		messageBox.dispatchEvent(event);

		//Click at Send Button
		eventFire(document.querySelector('span[data-icon="send"]'), 'click');

		cb();
	}

	//
	// MAIN LOGIC
	//
	const start = (_chats, cnt = 0) => {
		// get next unread chat
		const chats = _chats || getUnreadChats();
		const chat = chats[cnt];

		var processLastMsgOnChat = false;
		var lastMsg;

		if (!lastMessageOnChat){
			if (false === (lastMessageOnChat = getLastMsg())){
				lastMessageOnChat = true; //to prevent the first "if" to go true everytime
			} else {
				lastMsg = lastMessageOnChat;
			}
		} else if (lastMessageOnChat != getLastMsg() && getLastMsg() !== false && !didYouSendLastMsg()){
			lastMessageOnChat = lastMsg = getLastMsg();
			processLastMsgOnChat = true;
		}

		if (!processLastMsgOnChat && (chats.length == 0 || !chat)) {
			//console.log(new Date(), 'nothing to do now... (1)', chats.length, chat);
			return goAgain(start, 3);
		}

		// get infos
		var title;
		if (!processLastMsgOnChat){
			title = getElement("chat_title",chat).title + '';
			lastMsg = (getElement("chat_lastmsg", chat) || { innerText: '' }).title.replace(/[\u2000-\u206F]/g, ""); //.last-msg returns null when some user is typing a message to me
		} else {
			title = getElement("selected_title").title;
		}
		//avoid sending duplicate messaegs
		if (ignoreLastMsg[title] && (ignoreLastMsg[title]) == lastMsg) {
			//console.log(new Date(), 'nothing to do now... (2)', title, lastMsg);
			return goAgain(() => { start(chats, cnt + 1) }, 0.1);
		}

		
		// what to answer back?---------------------------------------
		
		function validate_email(email) {
			//Check minimum valid length of an Email.
			if (email.length <= 2) {
				return false;
			}
			//If whether email has @ character.
			if (email.indexOf("@") == -1) {
				return false;
			}
	 
			var parts = email.split("@");
			var dot = parts[1].indexOf(".");
			var len = parts[1].length;
			var dotSplits = parts[1].split(".");
			var dotCount = dotSplits.length - 1;
	 
			//Check whether Dot is present, and that too minimum 1 character after @.
			if (dot == -1 || dot < 2 || dotCount > 2) {
				return false;
			}
	 
			//Check whether Dot is not the last character and dots are not repeated.
			for (var i = 0; i < dotSplits.length; i++) {
				if (dotSplits[i].length == 0) {
					return false;
				}
			}
	 
			return true;
		}
		
		function validate_pincode(input) {
			if (input.length != 6) {
				return false;
			}
			var chars = input.split('');
			for (i = 0; i <= 5; i++) { 
			  if (!(digitss.includes(chars[i]))){
				  return false;
			  }
			}
			return true;
		}
		
		function validate_dob(input) {
			console.log((input.length != 10),(!(input[2] === '/' && input[5] === '/')),(parseInt(input.slice(0,1))>31 && parseInt(input.slice(0,1))===0),(parseInt(input.slice(3,4))>12 && parseInt(input.slice(0,1))===0),(parseInt(input.slice(6,9))>2009 && parseInt(input.slice(6,9))<1999));
			if (input.length != 10) {
				return false;
			}
			if (!(input[2] === '/' && input[5] === '/')) {
				return false;
			}
			if (parseInt(input.slice(0,2))>31 || parseInt(input.slice(0,2))===0){
				return false;
			}
			if (parseInt(input.slice(3,5))>12 || parseInt(input.slice(3,5))===0){
				return false;
			}
			if (parseInt(input.slice(6))>2009 || parseInt(input.slice(6))<1909){
				return false;
			}
			return true;
		}
		
		function all_ok(title,lastMsg){
			var to_api = {"ph_no": title, "context": contexts[index[title]-1], "last_msg": lastMsg};			
			var id = "ejhocjnlfjdiclmhlgncjlanbplcopne";
			chrome.runtime.sendMessage(id, to_api);
			index[title] = index[title] +1;
		}
		
		let sendText;
		
		console.log(lastMsg, sent_msg[title]);
		
		if(lastMsg !== sent_msg[title]){
			if(title !== "undefined"){
			// if(title === "Tom Cruise"){
				if (!(title in index)){
					index[title] = 0;
				}
				
				if (!(title in start_trigger)){
					start_trigger[title] = false;
				}
				
				if (lastMsg !== "typing"){
					function triggered_new_app(){
						if (contexts[index[title]] !== "finished"){
							var prev_context = contexts[index[title]-1];
							// console.log(contexts[index[title]], prev_context);
							
							if (prev_context === 'email'){
								if (validate_email(lastMsg)){
									sendText = questions[contexts[index[title]]];
									all_ok(title,lastMsg);
								}
								else{
									sendText ="Please enter a valid email address";
								}
							}
							else if (prev_context in num_valid){
								try {
									if (parseInt(lastMsg)>= 1 && parseInt(lastMsg) <= num_valid[prev_context]){
										sendText = questions[contexts[index[title]]];
										all_ok(title,lastMsg);
									}
									else{
										sendText = 'Please select an option from the above by typing its corresponding number.';
									}
								}
								catch(err) {
									sendText = 'Please select an option from the above by typing its corresponding number.';
								}
								
							} 
							else if (prev_context === 'pincode'){
								if (validate_pincode(lastMsg)){
									sendText = questions[contexts[index[title]]];
									all_ok(title,lastMsg);
								}
								else {
									sendText = 'Please enter a valid pincode';
								}
							}
							else if (prev_context === 'dob'){
								if (validate_dob(lastMsg)){
									sendText = questions[contexts[index[title]]];
									all_ok(title,lastMsg);
								}
								else {
									sendText = "Please enter a valid date in the specified format. Example: '12/02/1955'";
								}
							}
							else{
								sendText = questions[contexts[index[title]]];
								all_ok(title,lastMsg);
							}
						}
						else{
							sendText = questions["finished"];
						}
					}
					
					function triggered_status(){
						if (status_contexts[status_index[title]] != "stop"){
							sendText = loan_query[status_contexts[status_index[title]]];
							status_index[title] = status_index[title] + 1;
						}
						else{
							sendText = "";
						}
					}
					
					if (lastMsg.toLowerCase() === "get started"){
						start_trigger[title] = true;
						console.log(start_trigger);
						primary_trigger[title] = "";
						sendText = 'Hi! Welcome to XXXX.We ....\nPlease select an option from the following:\n 1. New Application\n 2. My Application status\n 3. More information'
					}
					else if (start_trigger[title] === true){
						console.log(primary_trigger, lastMsg);
						if (primary_trigger[title] === 'new_app'){
							triggered_new_app();
						}
						else if (primary_trigger[title] === 'status'){
							triggered_status();
						}
						else if (primary_trigger[title] === 'more_info'){
							sendText = "";
						}
						else{
							if (lastMsg === "1"){
								primary_trigger[title] = 'new_app';
								sendText = questions[contexts[0]];
								index[title] = 1;
							}
							else if (lastMsg === "2"){
								primary_trigger[title] = 'status';
								sendText = loan_query[status_contexts[0]];
								status_index[title] = 1;
							}
							else if (lastMsg === "3"){
								primary_trigger[title] = 'more_info';
								sendText = gen_query;
							}
							else{
								sendText = "Please select one of the given options only by entering number corresponding to your option.\n 1. New Application\n 2. My Application status\n 3. More information";
							}
						}
					}
					else{
						sendText = "Please type 'Get started' to continue";
					}
				}
			}
		}
		
		sent_msg[title] = sendText;
		
		if (!sendText) {
		ignoreLastMsg[title] = lastMsg;
		// 	console.log(new Date(), 'new message ignored -> ', title, lastMsg);
		return goAgain(() => { start(chats, cnt + 1) }, 0.1);
		}

		// select chat and send message------------------------------------------------
		if (!processLastMsgOnChat){
			selectChat(chat, () => {
				sendMessage(chat, sendText.trim(), () => {
					goAgain(() => { start(chats, cnt + 1) }, 1);
				});
			})
		} else {
			sendMessage(null, sendText.trim(), () => {
				goAgain(() => { start(chats, cnt + 1) }, 1);
			});
		}
	}
	start();
})();