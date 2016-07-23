var
	util = require('enyo/utils'),
	kind = require('enyo/kind'),
	Button = require('moonstone/Button'),
	Input = require('moonstone/Input'),
	IconButton = require('moonstone/IconButton'),
	InputDecorator = require('moonstone/InputDecorator'),
	Popup = require('moonstone/Popup'),
	Dialog = require('./dialog'),
	Ajax = require('enyo/Ajax'),
	Storage = require('./storage');

module.exports = kind({
	name: 'MainView',
	classes: 'moon enyo-fit',
	components: [
		{content: 'Twist'},
		{kind: InputDecorator, classes: 'twist-url-decorator', components: [
			{name: 'url', kind: Input, classes: 'twist-url', placeholder: 'URL'}
		]},
		{kind: IconButton, src: '@./images/twistjs.svg', small: false, ontap: 'twistButtonTapped'},
		{name: 'authDialog', kind: Dialog, onHide: 'twistButtonTapped'},
		{name: 'errorPopup', kind: Popup, content: ''}
	],

	create: function() {
		this.inherited(arguments);

		var find = "?url=";
		var index = window.location.href.indexOf(find);
		if (index != -1) {
			var href = window.location.href.substr(index+find.length);
			this.$.url.setValue(decodeURI(href));
		}
	},

	twistButtonTapped: function() {
		var that = this;
		Storage.getValue("token", function(token) {
			if (!token) {
				that.$.authDialog.show();
				return;
			}
			var ajax = new Ajax({
				url: "http://localhost:8081/api/twist",
				method: "POST",
				handleAs: "json",
				postBody: {uid: token.uid, url: encodeURI(that.$.url.getValue()), published: true}
			});
			ajax.headers = {"x-key":token.username, "x-access-token":token.token};
			ajax.response(util.bindSafely(that, 'apiCallResponse'));
			ajax.error(util.bindSafely(that, 'apiCallFail'));
			ajax.go();
		});
	},

	apiCallResponse: function(inSender, inResponse) {
		this.$.url.setValue('');
	},

	apiCallFail: function(inSender, inError) {
		if (inError == 401)
			this.$.authDialog.show();
		else {
			this.$.errorPopup.setContent('Error '+inError+' while connecting to server');
			this.$.errorPopup.show();
		}
	}
});
