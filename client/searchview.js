var
	util = require('enyo/utils'),
	kind = require('enyo/kind'),
	platform = require('enyo/platform'),
	Button = require('moonstone/Button'),
	Input = require('moonstone/Input'),
	Group = require('enyo/Group'),
	Icon = require('moonstone/Icon'),
	IconButton = require('moonstone/IconButton'),
	InputDecorator = require('moonstone/InputDecorator'),
	Popup = require('moonstone/Popup'),
	Item = require('moonstone/Item'),
	Img = require('enyo/Image'),
	GridListImageItem = require('moonstone/GridListImageItem'),
	Overlay = require('moonstone/Overlay'),
	Scroller = require('moonstone/Scroller'),
	Spotlight = require('spotlight'),
	Dialog = require('./dialog'),
	SmartTextArea = require('./smarttext'),
	ServiceItem = require('./serviceitem'),
	Ajax = require('enyo/Ajax'),
	Storage = require('./storage'),
	Panel = require('moonstone/Panel');

module.exports = kind({
	name: 'SearchView',
	kind: Panel,
	title: 'Search',
	headerType: 'medium',
	autoNumber: true,
	headerOptions: {inputMode: true, dismissOnEnter: true},
	components: [
		{components: [
		]},
		{name: 'authDialog', kind: Dialog, onHide: 'authenticated'},
		{name: 'errorPopup', kind: Popup, content: ''}
	],
	published: {
		token: null
	},

	// Constructor
	create: function() {
		this.inherited(arguments);

		Spotlight.initialize(this);
	},

	// First rendering, initialize
	rendered: function() {
		this.inherited(arguments);
	},

	// Display the main view window
	showMainView: function() {
		/*this.app.resetView = true;
		this.app.view = new MainView();
		this.app.start();*/
	},

	// Generic method to build and send a request to the server with the header already included
	sendRequest: function(apiToCall, apiType, dataMethod, postParams, callbackOk, callbackError) {
		var ajax = new Ajax({
			url: "http://localhost:8081/api/"+apiToCall,
			method: apiType,
			handleAs: "json"
		});
		if (apiType != "GET") {
			ajax.postBody = postParams;
		}
		ajax.headers = {
			"x-key": this.token.username,
			"x-access-token": this.token.token,
			"uid": this.token.uid,
			"data-method": dataMethod
		};
		ajax.response(function(sender, response) {
			callbackOk(sender, response);
		});
		if (callbackError) {
			ajax.error(callbackError);
		} else {
			ajax.error(util.bindSafely(this, 'apiCallFail'));
		}
		ajax.go();
	},

	// Generic API error handler: if auth error, open the dialog then relaunch the command
	apiCallFail: function(inSender, inError) {
		if (inError == 401) {
			this.$.authDialog.setThen(util.bindSafely(this, inSender.headers["data-method"]));
			this.$.authDialog.show();
			this.$.authDialog.giveFocus();
		} else {
			this.$.errorPopup.setContent('Error '+inError+' while connecting to server');
			this.$.errorPopup.show();
		}
	}
});
