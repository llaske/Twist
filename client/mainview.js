var
	util = require('enyo/utils'),
	kind = require('enyo/kind'),
	Popup = require('moonstone/Popup'),
	Dialog = require('./dialog'),
	Ajax = require('enyo/Ajax'),
	Storage = require('./storage');

module.exports = kind({
	name: 'MainView',
	classes: 'moon enyo-fit',
	components: [
		{content: 'Twist'},
		{name: 'message', content: ''},
		{name: 'authDialog', kind: Dialog, onHide: 'hello'},
		{name: 'errorPopup', kind: Popup, content: ''}
	],

	rendered: function() {
		this.hello();
	},

	hello: function() {
		var that = this;
		Storage.getValue("token", function(token) {
			if (!token) {
				that.$.authDialog.show();
				return;
			}
			var ajax = new Ajax({
				url: "http://localhost:8081/api/hello",
				method: "GET",
				handleAs: "json"
			});
			ajax.headers = {"x-key":token.username,"x-access-token":token.token};
			ajax.response(util.bindSafely(that, 'apiCallResponse'));
			ajax.error(util.bindSafely(that, 'apiCallFail'));
			ajax.go();
		});
	},

	apiCallResponse: function(inSender, inResponse) {
		this.$.message.setContent(inResponse);
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
