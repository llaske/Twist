#Twist Firefox Add-on

Add a Twist icon the Firefox toolbar to allow to run Twist directly from the browser.

Because it's a Firefox add-on, it should be build and deploy using the jpm command.

To install jpm, launch:

	npm install jpm --global
	
To run the add-on in Firefox, type:

	jpm run

To build the add-on into a .XPI, type:

	jpm xpi
	
See more on Firefox add-on and jpm [here](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm#Installation).