var
	utils = require('enyo/utils'),
	kind = require('enyo/kind'),
	Button = require('moonstone/Button'),
	IconButton = require('moonstone/IconButton'),
	Popup = require('moonstone/Popup'),
	Scroller = require('moonstone/Scroller'),
	Spotlight = require('spotlight'),
	Dialog = require('./dialog'),
	SmartTextArea = require('./smarttext'),
	ServiceItem = require('./serviceitem'),
	Img = require('enyo/Image'),
	Ajax = require('enyo/Ajax'),
	Storage = require('./storage'),
	util = require('./util'),
	Panel = require('moonstone/Panel'),
	Repeater = require('enyo/Repeater'),
	ImageItem = require('moonstone/ImageItem'),
	ObjectActionDecorator = require('moonstone/ObjectActionDecorator');

module.exports = kind({
	name: 'SearchView',
	kind: Panel,
	title: 'Search',
	headerType: 'medium',
	autoNumber: true,
	headerOptions: {inputMode: true, dismissOnEnter: true},
	components: [
		{components: [
			{name: "searchresults", kind: Scroller, vertical: "scroll", components: [
				{name: "posts", kind: Repeater, count:0, onSetupItem: 'setupItem', components: [
					{kind: ObjectActionDecorator, orientation: 'horizontal', components: [
						{name: 'itemImg', kind: Img, classes: 'search-item-image'},
						{classes: 'search-item-block', components: [
							{name: 'itemText', allowHtml: true, classes: 'search-item-text'},
							{name: 'itemAuthor', classes: 'search-item-author'},
							{name: 'itemDate', classes: 'search-item-date'}
						]}
					], actionComponents: [
						{kind: IconButton, src: '@./images/linkwhite.svg', ontap: 'seeOriginalLink', name: 'originalLink'},
						{kind: IconButton, icon: 'ellipsis', name: 'edit'},
						{kind: IconButton, icon: 'trash', ontap: 'removeItem', name: 'remove'}
					]}
				]}
			], onScroll: 'scrolled'},
		]},
		{name: 'authDialog', kind: Dialog, onHide: 'authenticated'},
		{name: 'errorPopup', kind: Popup, content: ''},
		{name: 'confirmPopup', kind: Popup, components: [
			{content: 'Are you sure?'},
			{kind: Button, content: 'OK', ontap: 'okConfirmPopup'},
			{kind: Button, content: 'Cancel', ontap: 'cancelConfirmPopup'}
		]}
	],
	published: {
		token: null
	},

	// Constructor
	create: function() {
		this.inherited(arguments);

		this.posts = null;
		this.itemsLimit = 10;
		this.selected = null;

		Spotlight.initialize(this);
	},

	// First rendering, initialize
	rendered: function() {
		this.inherited(arguments);

		this.$.searchresults.hasNode().style.height = (this.getBounds().height-document.getElementById("app_panel_searchView_header").offsetHeight-50)+"px";
		this.callMethod('getLastPosts');
	},

	// Set up content
	setupItem: function(sender, ev) {
		// Add tags if not present
		var post = this.posts[ev.index];
		var text = post.text || "";
		if (post.tags && post.tags.length && text.indexOf('#') == -1) {
			for (var i = 0 ; i < post.tags.length ; i++) {
				text += " #" + post.tags[i];
			}
		}

		// Format tags in text
		var formatted = "";
		var inTag = false;
		for (var i = 0 ; i < text.length ; i++) {
			var char = text[i];
			if (inTag && !char.match(/[a-zA-Z0-9_]/i)) {
				formatted += "</strong>";
			}
			if (char == '#') {
				inTag = true;
				formatted += "<strong class='strong'>#";
				continue;
			}
			formatted += char;
		}
		if (inTag) {
			formatted += "</strong>";
		}

		// Set content
		ev.item.$.itemImg.setSrc(post.image);
		ev.item.$.itemText.setContent(formatted);
		if (post.author) {
			ev.item.$.itemAuthor.setContent(post.author);
		}
		ev.item.$.itemDate.setContent(timestampToElapsedString(post.createdOn));
	},

	// Open a new window with the original link
	seeOriginalLink: function(sender, ev) {
		window.open(this.posts[ev.index].url);
	},

	// Remove the items
	removeItem: function(sender, ev) {
		this.$.confirmPopup.setContent('Are you sure?');
		this.$.confirmPopup.show();
		this.selected = this.posts[ev.index];
	},

	okConfirmPopup: function(sender, ev) {
		if (this.selected) {
			var that = this;
			this.sendRequest(
				"twist/"+this.selected._id,
				"DELETE",
				"removeItem",
				{},
				function(sender, response) {
					that.refreshSearch();
				}
			);
		}
		this.$.confirmPopup.hide();
	},

	cancelConfirmPopup: function(sender, ev) {
		this.$.confirmPopup.hide();
	},

	// Search text changed
	searchChanged: function(sender, ev) {
		this.searchText = ev.originator.getValue();
		this.callMethod('getPostsByText');
	},

	// Load more items when scrolled
	scrolled: function(sender, ev) {
		var scrollBounds = ev.scrollBounds;
		if (scrollBounds.top == scrollBounds.maxTop) {
			this.itemsLimit += 10;
			this.refreshSearch();
		}
	},

	refreshSearch: function() {
		if (this.searchText && this.searchText.length > 1) {
			this.callMethod('getPostsByText');
		} else {
			this.callMethod('getLastPosts');
		}
	},

	// Call an API on the server but first ensure that the token is valid
	callMethod: function(methodName) {
		var that = this;
		var method = utils.bindSafely(this, methodName);
		Storage.getValue("token", function(token) {
			// Check token first
			that.token = token;
			if (!that.token) {
				// Invalid, open auth dialog first
				that.$.authDialog.setThen(method);
				that.$.authDialog.show();
				that.$.authDialog.giveFocus();
				return;
			}

			// Token is valid, call method directly
			method.call(that);
		});
	},

	// Retrieve last posts
	getLastPosts: function() {
		var that = this;
		this.sendRequest(
			"twist?limit="+this.itemsLimit,
			"GET",
			"getLastPosts",
			{},
			function(sender, response) {
				that.posts = response;
				that.$.posts.setCount(that.posts.length);
			}
		);
	},

	// Retrieve post by text
	getPostsByText: function() {
		var that = this;
		this.sendRequest(
			"twist?text="+encodeURIComponent(this.searchText)+"&limit="+this.itemsLimit,
			"GET",
			"getPostsByText",
			{},
			function(sender, response) {
				that.posts = response;
				that.$.posts.setCount(that.posts.length);
			}
		);
	},

	// Generic method to build and send a request to the server with the header already included
	sendRequest: function(apiToCall, apiType, dataMethod, postParams, callbackOk, callbackError) {
		var ajax = new Ajax({
			url: util.getServerUrl()+"api/"+apiToCall,
			method: apiType,
			handleAs: "json"
		});
		if (apiType != "GET") {
			ajax.postBody = postParams;
		}
		ajax.headers = {
			"x-key": this.token.username,
			"x-access-token": this.token.token,
			"uid": this.token.uid,
			"data-method": dataMethod
		};
		ajax.response(function(sender, response) {
			callbackOk(sender, response);
		});
		if (callbackError) {
			ajax.error(callbackError);
		} else {
			ajax.error(utils.bindSafely(this, 'apiCallFail'));
		}
		ajax.go();
	},

	// Generic API error handler: if auth error, open the dialog then relaunch the command
	apiCallFail: function(inSender, inError) {
		if (inError == 401) {
			this.$.authDialog.setThen(utils.bindSafely(this, inSender.headers["data-method"]));
			this.$.authDialog.show();
			this.$.authDialog.giveFocus();
		} else {
			this.$.errorPopup.setContent('Error '+inError+' while connecting to server');
			this.$.errorPopup.show();
		}
	}
});



function timestampToElapsedString(timestamp) {
	var l10n = {
		SecondsAgo: 'Seconds ago',
		Ago: ' ago',
		Minutes_one: 'minute',
		Minutes_other: 'minutes',
		Hours_one: 'hour',
		Hours_other: 'hours',
		Days_one: 'day',
		Days_other: 'days',
		Weeks_one: 'week',
		Weeks_other: 'weeks',
		Months_one: 'month',
		Months_other: 'months',
		Years_one: 'year',
		Years_other: 'years'
	};
	var units = [{name:'Years', factor:356 * 24 * 60 * 60},
				 {name:'Months', factor:30 * 24 * 60 * 60},
				 {name:'Weeks', factor:7 * 24 * 60 * 60},
				 {name:'Days', factor:24 * 60 * 60},
				 {name:'Hours', factor:60 * 60},
				 {name:'Minutes', factor:60}];
	var maxlevel = 1;
	var levels = 0;
	var time_period = '';
	var time_stamp = (new Date(timestamp).getTime());
	var elapsed_seconds = ((new Date().getTime()) - time_stamp)/1000;
	for (var i = 0; i < units.length ; i++) {
		var factor = units[i].factor;

		var elapsed_units = Math.floor(elapsed_seconds / factor);
		if (elapsed_units > 0) {
			if (levels > 0)
				time_period += ',';

			time_period += ' '+elapsed_units+" "+(elapsed_units==1?l10n[units[i].name+"_one"]:l10n[units[i].name+"_other"]);

			elapsed_seconds -= elapsed_units * factor;
		}

		if (time_period != '')
			levels += 1;

		if (levels == maxlevel)
			break;
	}

	if (levels == 0) {
		return l10n["SecondsAgo"];
	}

	return time_period+l10n["Ago"];
}
