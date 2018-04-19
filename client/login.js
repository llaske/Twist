var
	kind = require('enyo/kind'),
	utils = require('enyo/utils'),
	Storage = require('./storage'),
	util = require('./util'),
	Button = require('moonstone/Button'),
	Icon = require('moonstone/Icon'),
	Input = require('moonstone/Input'),
	Img = require('enyo/Image'),
	Ajax = require('enyo/Ajax'),
	Tooltip = require('moonstone/Tooltip'),
	TooltipDecorator = require('moonstone/TooltipDecorator'),
	InputDecorator = require('moonstone/InputDecorator');


module.exports = kind({
	name: 'Login',
	classes: 'moon',
	components: [
		{content: "TWIST", classes: "twist-title"},
		{classes: "twist-image"},
		{content: "", classes: "twist-login-text"},
		{components: [
			{kind: InputDecorator, classes: "twist-login", components: [
				{name: 'l_login', kind: Input, placeholder: 'login', onkeydown: 'tabHandling'}
			]},
			{name: "twist_login_error", showing: false, kind: TooltipDecorator, components: [
				{kind: Icon, src: '@./images/warning.svg', classes: 'twist-login-warning', onmouseover: 'showTooltip'},
				{name: 'twist_login_tooltip', kind: Tooltip, uppercase: false, content: 'Floating tooltip for an IconButton.'}
			]}
		]},
		{components: [
			{kind: InputDecorator, classes: "twist-password", components: [
				{name: 'l_password', kind: Input, type:'password', placeholder: 'password', onkeydown: 'tabHandling'}
			]},
		]},
		{name: 'l_ok', kind: Button, content: 'LOG IN', ontap: 'loginButton', classes: "twist-loginbutton"},
		{classes: "twist-newuser-box", components: [
			{content: "If you don't have an account, create a new user:", classes: "twist-login-text"},
			{components: [
				{kind: InputDecorator, classes: "twist-login", components: [
					{name: 's_login', kind: Input, placeholder: 'e-mail', classes: "twist-login", onkeydown: 'tabHandling'}
				]},
			]},
			{components: [
				{kind: InputDecorator, classes: "twist-password", components: [
					{name: 's_password', kind: Input, type:'password', placeholder: 'password', onkeydown: 'tabHandling'}
				]},
			]},
			{name: 's_ok', kind: Button, content: 'SIGN UP', ontap: 'okButton', classes: "twist-loginbutton"},
		]},
	],

	// Constructor
	create: function() {
		this.inherited(arguments);

		this.tabOrder = [this.$.l_login, this.$.l_password, this.$.s_login, this.$.s_password];
	},

	// First rendering, initialize
	rendered: function() {
		this.inherited(arguments);
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
		else if (e.keyCode == 13) {
			if (ctrl == this.$.l_password) {
				this.loginButton();
				e.preventDefault();
				return;
			} else if (ctrl == this.$.s_password) {
				this.signUpButton();
				e.preventDefault();
				return;
			}
		}
	},

	// Handle login
	loginButton: function() {
		var login = this.$.l_login.getValue();
		var password = this.$.l_password.getValue();
		if (login.length == 0 || password.length == 0)
			return;

		var ajax = new Ajax({
			url: util.getServerUrl()+"login",
			method: "POST",
			handleAs: "json",
			postBody: {username: login, password: password}
		});
		ajax.response(utils.bindSafely(this, 'loginResponse'));
		ajax.error(utils.bindSafely(this, 'loginFail'));
		ajax.go();
	},

  	loginResponse: function(inSender, inResponse) {
		this.$.twist_login_error.setShowing(false);
		inResponse.username = this.$.l_login.getValue();
		var that = this;
		Storage.setValue('token', inResponse, function() {
			// Redirect to Twist page
			location.href = util.getServerUrl();
		});
	},

	loginFail: function(inSender, inError) {
		if (inError != 401) {
			this.$.twist_login_tooltip.setContent('Error '+inError+' while connecting to server');
		} else {
			this.$.twist_login_tooltip.setContent("Wrong user or password, type your login and password again");
		}
		this.$.twist_login_error.setShowing(true);
	}
});
