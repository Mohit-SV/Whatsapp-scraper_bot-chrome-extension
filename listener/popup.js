(function(){
	// var request = null;
    chrome.runtime.onMessageExternal.addListener(
	  function(request, sender, sendResponse) {
		// console.log(request, sender);
		var user_msg = request;
		console.log(user_msg);
		var xhr = new XMLHttpRequest();
		var url = "***"; # edit - api url to which you can send data recieved
		xhr.open("POST", url, true);	
		
		var data = JSON.stringify(user_msg);
		xhr.send(data);
		
	  });
})();