
var twistUrl = "http://localhost:8081/?url=";
var stringDone = "[Done!]";


// Close Twist tab done
function closeTwistDoneTab() {
	// Get all tab
	browser.tabs.query({active: true}).then(function(tabs) {
		for (var i = 0 ; i < tabs.length ; i++) {
			// Close if done
			if (tabs[i].title.indexOf(stringDone) != -1) {
				browser.tabs.remove(tabs[i].id);
			}
		}
	});
}

// Create event to check if Twist sent
browser.tabs.onUpdated.addListener(closeTwistDoneTab);


// When Twist button clicked
browser.browserAction.onClicked.addListener(function() {
	// Get the active tab
	browser.tabs.query({active: true}).then(function(tabs) {
		// Create a new tab with Twist backend and URL
		browser.tabs.create({url: twistUrl+encodeURI(tabs[0].url)}).then(function(tab) {
			// Close init tab
			browser.tabs.remove(tabs[0].id);
		});
	});
});
