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
	Repeater = require('enyo/Repeater'),
	SmartTextArea = require('./smarttext'),
	ServiceItem = require('./serviceitem'),
	Ajax = require('enyo/Ajax'),
	Storage = require('./storage'),
	Panel = require('moonstone/Panel'),
	ObjectActionDecorator = require('moonstone/ObjectActionDecorator');

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
		{name: 'serviceDetail', classes: 'twist-block twist-service-detail', showing: false, components: [
			{name: 'nameDecorator', kind: InputDecorator, spotlight: true, classes: 'twist-servicename-decorator', components: [
				{name: 'name', kind: Input, classes: 'twist-servicename', placeholder: 'name'}
			]},
			{kind: IconButton, icon: 'check', name: 'save', small: true, classes: 'twist-service-save', ontap: 'saveService'},
			{kind: IconButton, icon: 'closex', name: 'remove', small: true, classes: 'twist-service-cancel', ontap: 'cancelService'},
			{name: 'authorsuggest', classes: 'twist-service-authorsuggest', show: false, components: [
				{name: "authorsresults", kind: Scroller, vertical: "scroll", components: [
					{name: "authors", kind: Repeater, count:0, onSetupItem: 'setupAuthor', components: [
						{kind: ObjectActionDecorator, classes: 'service-author-item', orientation: 'horizontal', components: [
							{name: 'itemPrefix', classes: 'service-author-item-prefix'},
							{name: 'itemAuthor', classes: 'service-author-item-author'},
						], actionComponents: [
							{kind: IconButton, icon: 'plus', small: true, classes: 'service-author-addbutton', ontap: 'addAuthor', name: 'addAuthor'},
							{kind: IconButton, icon: 'ellipsis', small: true, classes: 'service-author-addbutton', ontap: 'editAuthor', name: 'EditAuthor'},
							{kind: IconButton, icon: 'trash', small: true, classes: 'service-author-removebutton', ontap: 'removeAuthor', name: 'removeAuthor'}
						]}
					]}
				]},
			]},
		]},
		{name: 'authDialog', kind: Dialog, onHide: 'authenticated'},
		{name: 'errorPopup', kind: Popup, content: ''},
		{name: 'confirmPopup', kind: Popup, components: [
			{content: 'Are you sure?'},
			{kind: Button, content: 'OK', ontap: 'okConfirmPopup'},
			{kind: Button, content: 'Cancel', ontap: 'cancelConfirmPopup'}
		]},
		{name: 'dialogPopup', kind: Popup, components: [
			{name: 'dialogPopupMessage', showing: false, content: 'Are you sure?'},
			{name: 'dialogPopupPrefix', kind: InputDecorator, components: [
				{name: 'inputPrefix', kind: Input, placeholder: 'http://...'}
			]},
			{name: 'dialogPopupAuthor', kind: InputDecorator, components: [
				{name: 'inputAuthor', kind: Input, placeholder: '@someone'}
			]},
			{kind: Button, content: 'OK', ontap: 'okAuthorButton'},
			{kind: Button, content: 'Cancel', ontap: 'cancelAuthorButton'}
		]}
	],
	published: {
		token: null
	},

	// Constructor
	create: function() {
		this.inherited(arguments);

		Spotlight.initialize(this);

		this.services = [];
		this.currentService = null;
		this.currentMode = '';
		this.callMethod("getServices");
	},

	// First rendering, initialize
	rendered: function() {
		this.inherited(arguments);

		this.$.services.applyStyle("height", -200+this.hasNode().offsetHeight+"px");
		this.$.authorsresults.hasNode().style.height = (this.getBounds().height-document.getElementById("app_panel_settingsView_header").offsetHeight-120)+"px";
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
							allowCheck: false,
							actions: true,
							service: service,
							onActionAddClicked: "",
							onActionEditClicked: "editService",
							onActionRemoveClicked: "removeService",
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
	editService: function(sender) {
		var service = this.currentService = sender.service;
		this.$.name.setValue(service.name);
		this.$.serviceDetail.setShowing(true);
		this.$.authorsuggest.setShowing(service.provider == 'authorsuggest');
		if (service.provider == 'authorsuggest') {
			this.$.authors.setCount(service.keys.authors.length);
		}
	},

	cancelService: function(sender) {
		this.$.serviceDetail.setShowing(false);
		this.$.authorsuggest.setShowing(false);
	},

	// Update service change
	saveService: function() {
		var that = this;
		this.sendRequest(
			"service/"+this.currentService._id,
			"PUT",
			"updateService",
			{keys: JSON.stringify(this.currentService.keys)},
			function(sender, response) {
				that.$.serviceDetail.setShowing(false);
				that.$.authorsuggest.setShowing(false);
			}
		);
	},

	// Remove service
	removeService: function() {
		this.$.dialogPopupMessage.setShowing(true);
		this.$.dialogPopupAuthor.setShowing(false);
		this.$.dialogPopupPrefix.setShowing(false);
		this.currentMode = 'removeService';
		this.$.dialogPopup.show();
	},

	// Author suggest type handling
	setupAuthor: function(sender, ev) {
		var author = this.currentService.keys.authors[ev.index];
		var prefix = this.currentService.keys.prefix[ev.index];
		ev.item.$.itemAuthor.setContent(author);
		ev.item.$.itemPrefix.setContent(prefix);
	},

	addAuthor: function(sender, ev) {
		this.$.dialogPopupMessage.setShowing(false);
		this.$.dialogPopupAuthor.setShowing(true);
		this.$.dialogPopupPrefix.setShowing(true);
		this.$.inputPrefix.setValue("");
		this.$.inputAuthor.setValue("");
		this.currentMode = 'addAuthor';
		this.currentIndex = ev.index;
		this.$.dialogPopup.show();
	},

	editAuthor: function(sender, ev) {
		this.$.dialogPopupMessage.setShowing(false);
		this.$.dialogPopupAuthor.setShowing(true);
		this.$.dialogPopupPrefix.setShowing(true);
		this.$.inputPrefix.setValue(this.currentService.keys.prefix[ev.index]);
		this.$.inputAuthor.setValue(this.currentService.keys.authors[ev.index]);
		this.currentMode = 'editAuthor';
		this.currentIndex = ev.index;
		this.$.dialogPopup.show();
	},

	removeAuthor: function(sender, ev) {
		this.$.dialogPopupMessage.setShowing(true);
		this.$.dialogPopupAuthor.setShowing(false);
		this.$.dialogPopupPrefix.setShowing(false);
		this.currentMode = 'removeAuthor';
		this.currentIndex = ev.index;
		this.$.dialogPopup.show();
	},

	okAuthorButton: function() {
		if (this.currentMode == 'removeService') {
			// Call delete service
		} else if (this.currentMode == 'addAuthor') {
			this.currentService.keys.authors.push(this.$.inputAuthor.getValue());
			this.currentService.keys.prefix.push(this.$.inputPrefix.getValue());
			this.$.authors.setCount(this.currentService.keys.authors.length);
		} else if (this.currentMode == 'editAuthor') {
			this.currentService.keys.authors[this.currentIndex] = this.$.inputAuthor.getValue();
			this.currentService.keys.prefix[this.currentIndex] = this.$.inputPrefix.getValue();
			this.$.authors.setCount(this.currentService.keys.authors.length);
		} else if (this.currentMode == 'removeAuthor') {
			this.currentService.keys.authors.splice(this.currentIndex, 1);
			this.currentService.keys.prefix.splice(this.currentIndex, 1);
			this.$.authors.setCount(this.currentService.keys.authors.length);
		}
		this.$.dialogPopup.hide();
	},

	cancelAuthorButton: function() {
		this.$.dialogPopup.hide();
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
