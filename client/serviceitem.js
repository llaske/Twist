var
	kind = require('enyo/kind'),
	Icon = require('moonstone/Icon'),
	Icon = require('moonstone/Icon'),
	IconButton = require('moonstone/IconButton'),
	Item = require('moonstone/Item'),
	Tooltip = require('moonstone/Tooltip'),
	TooltipDecorator = require('moonstone/TooltipDecorator'),
	ObjectActionDecorator = require('moonstone/ObjectActionDecorator');

module.exports = kind({
	name: "serviceitem",
	kind: Item,
	classes: "moon-hspacing twist-service",
	published: {
		aid: null,
		provider: '',
		account: '',
		active: false,
		service: null,
		error: '',
		actions: false,
		allowCheck: false,
	},
	handlers: {
		ontap: 'handleClick'
	},
	events: {
		onStateChanged: '',
		onClicked: '',
		onActionAddClicked: '',
		onActionEditClicked: '',
		onActionRemoveClicked: '',
		onmouseover: 'showTooltip'
	},
	components: [
		{kind: ObjectActionDecorator, classes: 'twist-service-item', orientation: 'horizontal', components: [
			{name: "iconProvider", kind: Icon},
			{name: "accountName", classes: 'twist-service-name'},
			{name: "iconActive", kind: Icon, icon: 'check'},
			{name: "warning", kind: TooltipDecorator, components: [
				{kind: Icon, src: '@./images/warning.svg', classes: 'twist-service-warning', onmouseover: 'showTooltip'},
				{name: 'tooltip', kind: Tooltip, uppercase: false, content: 'Floating tooltip for an IconButton.'}
			]},
		], actionComponents: [
			{kind: IconButton, showing: false, icon: 'plus', small: true, classes: 'service-author-addbutton', ontap: 'handleAddAction', name: 'addService'},
			{kind: IconButton, showing: false, icon: 'ellipsis', small: true, classes: 'service-author-addbutton', ontap: 'handleEditAction', name: 'editService'},
			{kind: IconButton, showing: false, icon: 'trash', small: true, classes: 'service-author-removebutton', ontap: 'handleRemoveAction', name: 'removeService'}
		]}
	],

	create: function() {
		this.inherited(arguments);

		this.providerChanged();
		this.accountChanged();
		this.activeChanged();
		this.errorChanged();
		this.actionsChanged();
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

	actionsChanged: function() {
		this.$.addService.setShowing(this.actions);
		this.$.editService.setShowing(this.actions);
		this.$.removeService.setShowing(this.actions);
	},

	handleClick: function(sender) {
		if (this.allowCheck) {
			// In check mode, reverse selection
			this.$.iconActive.setShowing(!this.$.iconActive.getShowing());
			this.doStateChanged();
		} else {
			// Else just process click
			this.doClicked();
		}
	},

	handleAddAction: function(sender) {
		this.doActionAddClicked();
	},

	handleEditAction: function(sender) {
		this.doActionEditClicked();
	},

	handleRemoveAction: function(sender) {
		this.doActionRemoveClicked();
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
		if (this.error) {
			sender.parent.children[1].position = 'below';
			sender.parent.children[1].activator = sender.parent;
			sender.parent.children[1].show();	// HACK: Force Tooltip
		}
	}
});
