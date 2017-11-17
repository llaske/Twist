
var twistUrl = "http://localhost:8081/?url=";
var stringDone = "[Done!]";


// Close Twist tab done
function closeTwistDoneTab() {
	// Get all tab
	chrome.tabs.query({active: true}, function(tabs) {
		for (var i = 0 ; i < tabs.length ; i++) {
			// Close if done
			if (tabs[i].title.indexOf(stringDone) != -1) {
				chrome.tabs.remove(tabs[i].id);
			}
		}
	});
}

// Create event to check if Twist sent
chrome.tabs.onUpdated.addListener(closeTwistDoneTab);


// When Twist button clicked
chrome.browserAction.onClicked.addListener(function() {
	// Get the active tab
	chrome.tabs.query({active: true}, function(tabs) {
		// Create a new tab with Twist backend and URL
		chrome.tabs.create({url: twistUrl+encodeURI(tabs[0].url)}, function(tab) {
			// Close init tab
			chrome.tabs.remove(tabs[0].id);
		});
	});
});
