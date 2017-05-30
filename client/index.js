var
	kind = require('enyo/kind'),
	ready = require('enyo/ready');

var
	Application = require('enyo/Application');

var
	Panels = require('moonstone/Panels'),
	IconButton = require('moonstone/IconButton'),
	Group = require('enyo/Group');

var
	MainView = require('./mainview'),
	SearchView = require('./searchview');

var TwistPanel = kind({
	name: 'Twist.Panel',
	classes: 'moon enyo-fit',
	components: [
		{name: 'panels', kind: Panels, classes: 'enyo-fit', pattern: 'activity', hasCloseButton: false, components: [
			{kind: MainView},
			{kind: SearchView}
		]},
		{classes: 'twist-menu', kind: Group, components: [
			{name: 'post', kind: IconButton, icon: 'plus', active: true, small: false, ontap: "showPostView"},
			{name: 'search', kind: IconButton, icon: 'search', small: false, ontap: "showSearchView"},
			{name: 'settings', kind: IconButton, icon: 'gear', small: false},
		]},
	],

	showPostView: function() {
		this.$.panels.setIndex(0);
		this.$.post.setActive(true);
	},

	showSearchView: function() {
		this.$.panels.setIndex(1);
		this.$.search.setActive(true);
	}
});

var TwistApp = module.exports = kind({
	name: 'Twist.Application',
	kind: Application,
	view: TwistPanel
});

ready(function () {
	new TwistApp({name: 'app'});
});
