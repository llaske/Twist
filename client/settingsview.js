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
	name: 'SettingsView',
	kind: Panel,
	title: 'Settings',
	headerType: 'small',
	autoNumber: true,
	components: [
		{components: [
		]},
		{classes: 'twist-block twist-settings', components: [
			{name: 'services', kind: Scroller, classes: 'twist-settings-scrolledit', components: [
			]}
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

		this.services = [];
		this.callMethod("getServices");
	},

	// First rendering, initialize
	rendered: function() {
		this.inherited(arguments);

		this.$.services.applyStyle("height", -200+this.hasNode().offsetHeight+"px");
	},


	// Retrieve all services for user
	getServices: function() {
		var that = this;
		this.sendRequest(
			"service",
			"GET",
			"getServices",
			{},
			function(sender, response) {
				response = response.sort(function(s1, s2) {
					return s1.provider > s2.provider;
				});
				for (var i = 0 ; i < response.length ; i++) {
					var service = response[i];
					var component = that.$.services.createComponent(
						{
							kind: ServiceItem,
							provider: service.provider,
							aid: service._id,
							account: service.name,
							active: false,
							service: service,
							onClicked: "serviceDetail"
						},
						{owner: that}
					);
					that.services.push(component);
					component.render();
				}
			}
		);
	},

	// Show service detail
	serviceDetail: function(sender) {
		var service = sender.service;
		console.log(service);
	},

	// Call an API on the server but first ensure that the token is valid
	callMethod: function(methodName) {
		var that = this;
		var method = util.bindSafely(this, methodName);
		Storage.getValue("token", function(token) {
			// Check token first
			that.token = token;
			if (!that.token) {
				// Invalid, open auth dialog first
				that.$.authDialog.setThen(method);
				that.$.authDialog.show();
				that.$.authDialog.giveFocus();
				return;
			}

			// Token is valid, call method directly
			method.call(that);
		});
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
