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

		this.initialized = false;
	},

	rendered: function() {
		this.inherited(arguments);

		// Initialize
		if (!this.initialized) {
			this.initialized = true;
			this.$.url.focus();
			this.callMethod('getTags');
			/*if (this.$.url.getValue()) {
				this.callMethod('createTwist');
			}*/
		}
	},

	focused: function(ctrl) {
		this.$.urlDecorator.removeClass('twist-focused');
		this.$.textDecorator.removeClass('twist-focused');
		this.$.authorDecorator.removeClass('twist-focused');
		ctrl.parent.addClass('twist-focused');
	},

	twistButtonTapped: function() {
		this.$.urlDecorator.removeClass('twist-focused');
		this.$.textDecorator.removeClass('twist-focused');
		this.$.authorDecorator.removeClass('twist-focused');
		this.publishTwist();
	},

	updateCount: function() {
		var textRaw = this.$.text.getRawtext();
		var textLength = textRaw.length;
		var count = this.$.url.getValue().length+textLength;
		if (textLength > 1) {
			count++;
		}
		this.$.count.setContent(count);
		return count;
	},

	callMethod: function(methodName) {
		var that = this;
		var method = util.bindSafely(this, methodName);
		Storage.getValue("token", function(token) {
			// Check token first
			that.token = token;
			if (!that.token) {
				that.$.authDialog.setThen(method);
				that.$.authDialog.show();
				return;
			}

			// Call method directly
			method.call(that);
		});
	},

	getTags: function() {
		var ajax = new Ajax({
			url: "http://localhost:8081/api/tag",
			method: "GET",
			handleAs: "json"
		});
		ajax.headers = {
			"x-key": this.token.username,
			"x-access-token": this.token.token,
			"uid": this.token.uid,
			"data-method": "getTags"
		};
		var that = this;
		ajax.response(function(sender, response) {
			that.$.text.setTags(response);
		});
		ajax.error(util.bindSafely(this, 'apiCallFail'));
		ajax.go();
	},

	createTwist: function() {
		console.log("Create/Update Twist URL");
	},

	publishTwist: function() {
		console.log('Publish the Twist !');
		/*var that = this;
		Storage.getValue("token", function(token) {
			if (!token) {
				that.$.authDialog.show();
				return;
			}
			var ajax = new Ajax({
				url: "http://localhost:8081/api/twist",
				method: "POST",
				handleAs: "json",
				postBody: {
					uid: token.uid,
					url: encodeURI(that.$.url.getValue()),
					text: that.$.text.getValue(),
					clean: true,
					published: true
				}
			});
			ajax.headers = {"x-key":token.username, "x-access-token":token.token};
			ajax.response(util.bindSafely(that, 'apiCallResponse'));
			ajax.error(util.bindSafely(that, 'apiCallFail'));
			ajax.go();
		});*/
	},

	/*apiCallResponse: function(inSender, inResponse) {
		this.$.url.setValue('');
		this.$.text.setValue(''); // TODO: A reinit is probably better
	},*/

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
