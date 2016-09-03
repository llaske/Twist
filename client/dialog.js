var
	util = require('enyo/utils'),
	kind = require('enyo/kind'),
	Button = require('moonstone/Button'),
	Input = require('moonstone/Input'),
	InputDecorator = require('moonstone/InputDecorator'),
	Dialog = require('moonstone/Dialog'),
	Popup = require('moonstone/Popup'),
	Ajax = require('enyo/Ajax'),
	Storage = require('./storage');

module.exports = kind({
	name: 'dialog',
	kind: Dialog,
	title: 'Authentication required',
	subTitle: 'Please type your login and password below',
	modal: true,
	autoDismiss: false,
	components: [
		{kind: InputDecorator, components: [
			{name: 'login', kind: Input, placeholder: 'login', onkeydown: 'tabHandling'}
		]},
		{kind: InputDecorator, components: [
			{name: 'password', kind: Input, type:'password', placeholder: 'password', onkeydown: 'tabHandling'}
		]},
		{name: 'ok', kind: Button, content: 'OK', ontap: 'okButton'},
		{name: 'errorPopup', kind: Popup, content: ''}
	],
	published: {
		then: null
	},

	// Constructor
	create: function() {
		this.inherited(arguments);

		this.tabOrder = [this.$.login, this.$.password];
	},

	// Handle TAB key, switch to next control
	tabHandling: function(ctrl, e) {
		// If TAB press
		if (e.keyCode == 9) {
			// Find the next controls and focus it
			var next = null;
			for (var i = 0 ; i < this.tabOrder.length ; i++) {
				if (this.tabOrder[i] == ctrl) {
					if (ctrl == this.$.text && this.$.text.tabbed) {
						// Already processed
						return;
					}
					if (!e.shiftKey) {
						// Just TAB key, next control
						if (i == this.tabOrder.length-1) {
							next = this.tabOrder[0];
						} else {
							next = this.tabOrder[i+1];
						}
					} else {
						// TAB+SHIFT, previous control
						if (i == 0) {
							next = this.tabOrder[this.tabOrder.length-1];
						} else {
							next = this.tabOrder[i-1];
						}
					}
					next.focus();
					return;
				}
			}
		}

		// ENTER key validate the twist
		else if (e.keyCode == 13 && ctrl == this.$.password) {
			this.okButton();
			e.preventDefault();
			return;
		}
	},

	okButton: function() {
		var login = this.$.login.getValue();
		var password = this.$.password.getValue();
		if (login.length == 0 || password.length == 0)
			return;

		var ajax = new Ajax({
			url: "http://localhost:8081/login",
			method: "POST",
			handleAs: "json",
			postBody: {username: login, password: password}
		});
		ajax.response(util.bindSafely(this, 'loginResponse'));
		ajax.error(util.bindSafely(this, 'loginFail'));
		ajax.go();
	},

  	loginResponse: function(inSender, inResponse) {
		inResponse.username = this.$.login.getValue();
		var that = this;
		Storage.setValue('token', inResponse, function() {
			that.parent.setToken(inResponse);
			if (that.then) {
				that.then.call(that.parent);
			}
		});
		this.hide();
	},

	loginFail: function(inSender, inError) {
		if (inError != 401) {
			this.hide();
			this.$.errorPopup.setContent('Error '+inError+' while connecting to server');
			this.$.errorPopup.show();
		} else {
			this.setSubTitle("Wrong user or password, type your login and password again");
		}
	}
});
