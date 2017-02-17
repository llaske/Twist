
var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var timers = require("sdk/timers");
var twistUrl = "http://localhost:8081/?url=";

// Create the Twist button in the toolbar
var button = buttons.ActionButton({
	id: "twist",
	label: "Twist URL",
	icon: {
		"16": "./icon-16.png",
		"32": "./icon-32.png",
		"64": "./icon-64.png"
	},
	onClick: handleClick
});

// Close Twist tab done
function closeTwistDoneTab() {
	for (let tab of tabs) {
		if (tab.url.indexOf(twistUrl) == 0) {
			if (tab.title.indexOf("[Done!]") != -1) {
				tab.close();
			}
		}
	}
}

// Handle click on the Twist button
function handleClick(state) {
	tabs.open(twistUrl+encodeURI(tabs.activeTab.url));
	timers.setInterval(closeTwistDoneTab, 500);
	tabs.activeTab.close();
}
