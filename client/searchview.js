var
	util = require('enyo/utils'),
	kind = require('enyo/kind'),
	IconButton = require('moonstone/IconButton'),
	Popup = require('moonstone/Popup'),
	Scroller = require('moonstone/Scroller'),
	Spotlight = require('spotlight'),
	Dialog = require('./dialog'),
	SmartTextArea = require('./smarttext'),
	ServiceItem = require('./serviceitem'),
	Ajax = require('enyo/Ajax'),
	Storage = require('./storage'),
	Panel = require('moonstone/Panel'),
	Repeater = require('enyo/Repeater'),
	ImageItem = require('moonstone/ImageItem'),
	ObjectActionDecorator = require('moonstone/ObjectActionDecorator');

module.exports = kind({
	name: 'SearchView',
	kind: Panel,
	title: 'Search',
	headerType: 'medium',
	autoNumber: true,
	headerOptions: {inputMode: true, dismissOnEnter: true},
	components: [
		{components: [
			{name: "searchresults", kind: Scroller, vertical: "scroll", components: [
				{name: "posts", kind: Repeater, count:0, onSetupItem: 'setupItem', components: [
					{kind: ObjectActionDecorator, orientation: 'horizontal', components: [
						{kind: ImageItem}
					], actionComponents: [
						{kind: IconButton, icon: 'ellipsis', name: 'edit'},
						{kind: IconButton, icon: 'trash', name: 'remove'}
					]}
				]}
			]},
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

		this.posts = null;

		Spotlight.initialize(this);
	},

	// First rendering, initialize
	rendered: function() {
		this.inherited(arguments);

		this.$.searchresults.hasNode().style.height = (this.getBounds().height-document.getElementById("app_panel_searchView_header").offsetHeight-50)+"px";
		this.callMethod('getLastPosts');
	},

	// Set up content
	setupItem: function (sender, ev) {
		var post = this.posts[ev.index];
		ev.item.$.imageItem.setSource(post.image);
		//ev.item.$.imageItem.setLabel('label ' + ev.index);
		ev.item.$.imageItem.setLabel(post.text);
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

	// Retrieve last posts
	getLastPosts: function() {
		var that = this;
		this.sendRequest(
			"twist",
			"GET",
			"getLastPosts",
			{},
			function(sender, response) {
				that.posts = response;
				that.$.posts.setCount(that.posts.length);
			}
		);
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
