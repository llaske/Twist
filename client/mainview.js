var
	util = require('enyo/utils'),
	kind = require('enyo/kind'),
	platform = require('enyo/platform'),
	Button = require('moonstone/Button'),
	Input = require('moonstone/Input'),
	IconButton = require('moonstone/IconButton'),
	InputDecorator = require('moonstone/InputDecorator'),
	Popup = require('moonstone/Popup'),
	Spotlight = require('spotlight'),
	Dialog = require('./dialog'),
	SmartTextArea = require('./smarttext'),
	Ajax = require('enyo/Ajax'),
	Storage = require('./storage');

module.exports = kind({
	name: 'MainView',
	classes: 'moon enyo-fit',
	components: [
		{content: 'Twist'},
		{name: 'urlDecorator', kind: InputDecorator, spotlight: true, classes: 'twist-url-decorator', components: [
			{name: 'url', kind: Input, classes: 'twist-url', placeholder: 'URL', oninput: 'updateCount', onfocus: 'focused', onchange: 'createTwist'}
		]},
		{name: 'twistButton', kind: IconButton, src: '@./images/twistjs.svg', small: false, spotlight: true, ontap: 'twistButtonTapped'},
		{name: 'count', content: '0', classes: "twist-count"},
		{name: 'textDecorator', kind: InputDecorator, spotlight: true, classes: "twist-text-decorator", components: [
			{name: "text", kind: SmartTextArea, onfocus: 'focused', oninput: 'updateCount', onValidate: 'publishTwist'}
		]},
		{name: 'authorDecorator', kind: InputDecorator, spotlight: true, classes: 'twist-author-decorator', components: [
			{name: 'author', kind: Input, classes: 'twist-author', placeholder: 'Author', oninput: 'updateCount', onfocus: 'focused'}
		]},
		{name: 'authDialog', kind: Dialog},
		{name: 'errorPopup', kind: Popup, content: ''}
	],
	published: {
		token: null
	},

	// Constructor
	create: function() {
		this.inherited(arguments);

		// Set URL if one is provided on query string
		var find = "?url=";
		var index = window.location.href.indexOf(find);
		if (index != -1) {
			var href = window.location.href.substr(index+find.length);
			this.$.url.setValue(decodeURI(href));
		}

		Spotlight.initialize(this);

		this.twist = null;
	},

	// First rendering, initialize
	rendered: function() {
		this.inherited(arguments);

		// Initialize
		this.$.url.focus();
		this.callMethod('getTags');
	},

	// Focus changed, adapt field decoration
	focused: function(ctrl) {
		this.$.urlDecorator.removeClass('twist-focused');
		this.$.textDecorator.removeClass('twist-focused');
		this.$.authorDecorator.removeClass('twist-focused');
		ctrl.parent.addClass('twist-focused');
	},

	// Twist button tapped, publish the Twist
	twistButtonTapped: function() {
		this.$.urlDecorator.removeClass('twist-focused');
		this.$.textDecorator.removeClass('twist-focused');
		this.$.authorDecorator.removeClass('twist-focused');
		this.publishTwist();
	},

	// Update character count for the twist
	updateCount: function() {
		var urlLength = this.$.url.getValue().length;
		var textRaw = this.$.text.getRawtext();
		var textLength = textRaw.length;
		var authorLength = this.$.author.getValue().length;
		var count = urlLength+textLength+authorLength;
		if (textLength > 1) {
			count++; // Whitespace
		}
		if (authorLength > 1) {
			count+=3; // Whitespace + ( + )
		}
		this.$.count.setContent(count);
		return count;
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
				return;
			}

			// Token is valid, call method directly
			method.call(that);
		});
	},

	// Retrieve all existing tags
	getTags: function() {
		var that = this;
		this.sendRequest(
			"tag",
			"GET",
			"getTags",
			{},
			function(sender, response) {
				that.$.text.setTags(response);
			}
		);
	},

	// Create the Twist in database (without publishing it at first)
	createTwist: function() {
		var that = this;
		this.sendRequest(
			"twist",
			"POST",
			"createTwist",
			{
				uid: this.token.uid,
				url: encodeURI(this.$.url.getValue()),
				text: this.$.text.getValue(),
				author: this.$.author.getValue(),
				cleaned: true,
				published: false
			},
			function(sender, response) {
				// Store cleaned URL
				that.twist = response;
				that.$.url.setValue(that.twist.url);

				// Shorten URL
				that.shortenURL();
			}
		);
	},

	// Shorten URL of the twist
	shortenURL: function() {
		var that = this;
		this.sendRequest(
			"twist/"+this.twist._id+"/short",
			"GET",
			"shortenURL",
			{},
			function(sender, response) {
				if (response.urlShortened) {
					that.twist.urlShortened = response.urlShortened;
					that.$.url.setValue(that.twist.urlShortened);
				}
			}
		);
	},

	// Publish the Twist
	publishTwist: function() {
		console.log('Publish the Twist !');
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
		} else {
			this.$.errorPopup.setContent('Error '+inError+' while connecting to server');
			this.$.errorPopup.show();
		}
	}
});
