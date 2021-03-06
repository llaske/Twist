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
	SearchView = require('./searchview'),
	SettingsView = require('./settingsview'),
	Login = require('./login'),
	Storage = require('./storage');

var TwistPanel = kind({
	name: 'Twist.Panel',
	classes: 'moon enyo-fit',
	components: [
		{name: 'panels', kind: Panels, classes: 'enyo-fit', pattern: 'activity', hasCloseButton: false, components: [
			{name: 'mainView', kind: MainView},
			{name: 'searchView', kind: SearchView, onInputHeaderInput: 'searchChanged'},
			{name: 'settingsView', kind: SettingsView}
		]},
		{classes: 'twist-menu', kind: Group, components: [
			{name: 'post', kind: IconButton, icon: 'plus', active: true, small: false, ontap: "showPostView"},
			{name: 'search', kind: IconButton, icon: 'search', small: false, ontap: "showSearchView"},
			{name: 'settings', kind: IconButton, icon: 'gear', small: false, ontap: "showSettingsView"},
		]},
	],

	showPostView: function() {
		this.$.panels.setIndex(0);
		this.$.post.setActive(true);
	},

	showSearchView: function() {
		this.$.panels.setIndex(1);
		this.$.search.setActive(true);
	},

	showSettingsView: function() {
		this.$.panels.setIndex(2);
		this.$.settings.setActive(true);
	},

	searchChanged: function(sender, ev) {
		this.$.searchView.searchChanged(sender, ev);
	},
});

var TwistApp;

ready(function () {
	Storage.getValue("token", function(token) {
		TwistApp = kind({
			name: 'Twist.Application',
			kind: Application,
			view: (!token ? Login : TwistPanel)
		});
		new TwistApp({name: 'app'});
	});
});
