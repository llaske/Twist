var
	kind = require('enyo/kind'),
	Icon = require('moonstone/Icon'),
	Item = require('moonstone/Item'),
	Tooltip = require('moonstone/Tooltip'),
	TooltipDecorator = require('moonstone/TooltipDecorator');

module.exports = kind({
	name: "serviceitem",
	kind: Item,
	classes: "moon-hspacing twist-service",
	published: {
		provider: '',
		account: '',
		active: false,
		service: null,
		error: ''
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
		{name: "iconActive", kind: Icon, icon: 'check'},
		{name: "warning", kind: TooltipDecorator, components: [
			{kind: Icon, src: '@./images/warning.svg', classes: 'twist-service-warning', onmouseover: 'showTooltip'},
			{name: 'tooltip', kind: Tooltip, uppercase: false, content: 'Floating tooltip for an IconButton.'}
		]},
	],

	create: function() {
		this.inherited(arguments);

		this.providerChanged();
		this.accountChanged();
		this.activeChanged();
		this.errorChanged();
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
	},

	errorChanged: function() {
		if (this.error) {
			this.$.tooltip.setContent(this.error);
			this.$.warning.setShowing(true);
		} else {
			this.$.warning.setShowing(false);
		}
	},

	showTooltip: function(sender, e) {
		sender.parent.children[1].position = 'below';
		sender.parent.children[1].activator = sender.parent;
		sender.parent.children[1].show();	// HACK: Force Tooltip
	}
});
