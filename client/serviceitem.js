var
	kind = require('enyo/kind'),
	Icon = require('moonstone/Icon'),
	Item = require('moonstone/Item');

module.exports = kind({
	name: "serviceitem",
	kind: Item,
	classes: "moon-hspacing twist-service",
	published: {
		provider: '',
		account: '',
		active: false
	},
	handlers: {
		ontap: 'reverseSelection'
	},
	events: {
		onStateChanged: ''
	},
	components: [
		{name: "iconProvider", kind: Icon},
		{name: "accountName"},
		{name: "iconActive", kind: Icon, icon: 'check'}
	],

	create: function() {
		this.inherited(arguments);

		this.providerChanged();
		this.accountChanged();
		this.activeChanged();
	},

	providerChanged: function() {
		this.$.iconProvider.setSrc("@./images/"+this.provider+".svg");
	},

	accountChanged: function() {
		this.$.accountName.setContent(this.account);
	},

	activeChanged: function() {
		this.$.iconActive.setShowing(this.active);
	},

	reverseSelection: function(sender) {
		this.$.iconActive.setShowing(!this.$.iconActive.getShowing());
		this.doStateChanged();
	}
});
