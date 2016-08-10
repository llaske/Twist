var
	util = require('enyo/utils'),
	kind = require('enyo/kind'),
	platform = require('enyo/platform'),
	Button = require('moonstone/Button'),
	Input = require('moonstone/Input'),
	TextArea = require('moonstone/RichText'),
	IconButton = require('moonstone/IconButton'),
	InputDecorator = require('moonstone/InputDecorator'),
	Popup = require('moonstone/Popup'),
	Spotlight = require('spotlight'),
	Dialog = require('./dialog'),
	Ajax = require('enyo/Ajax'),
	Storage = require('./storage');

module.exports = kind({
	name: 'MainView',
	classes: 'moon enyo-fit',
	components: [
		{content: 'Twist'},
		{name: 'urlDecorator', kind: InputDecorator, spotlight: true, classes: 'twist-url-decorator', components: [
			{name: 'url', kind: Input, classes: 'twist-url', placeholder: 'URL', oninput: 'updateCount', onfocus: 'focused', onchange: 'createTwist'}
		]},
		{name: 'twistButton', kind: IconButton, src: '@./images/twistjs.svg', small: false, spotlight: true, ontap: 'twistButtonTapped'},
		{name: 'count', content: '0', classes: "twist-count"},
		{name: 'textDecorator', kind: InputDecorator, spotlight: true, classes: "twist-text-decorator", components: [
			{name: "text", kind: TextArea, classes: "twist-text", placeholder: 'Enter Twist here', onkeypress: 'keyPressed', onkeydown: 'keyDown', oninput: 'inputChange', onfocus: 'focused'}
		]},
		{name: 'authDialog', kind: Dialog, onHide: 'createTwist'},
		{name: 'errorPopup', kind: Popup, content: ''}
	],

	create: function() {
		this.inherited(arguments);

		// Set URL if one is provided on query string
		var find = "?url=";
		var index = window.location.href.indexOf(find);
		if (index != -1) {
			var href = window.location.href.substr(index+find.length);
			this.$.url.setValue(decodeURI(href));
		}

		// Initialize
		Spotlight.initialize(this);
		this.replaceMode = false;
		this.replaceValue = "";
	},

	rendered: function() {
		this.inherited(arguments);

		this.$.url.focus();
		appendNode(this.$.text, "twist-in-text", "&nbsp;");
	},

	focused: function(ctrl) {
		console.log(ctrl.name+" focused!");
		var newFocus, oldFocus;
		if (ctrl.name == 'url') {
			newFocus = this.$.urlDecorator;
			oldFocus = this.$.textDecorator;
		} else {
			newFocus = this.$.textDecorator;
			oldFocus = this.$.urlDecorator;
		}
		newFocus.addClass('twist-focused');
		oldFocus.removeClass('twist-focused');
	},

	inputChange: function(ctrl, e) {
		if (!this.updateCount(ctrl)) {
			appendNode(this.$.text, "twist-in-text", "&nbsp;");
		}
	},

	keyDown: function(ctrl, e) {
		// If TAB press in hashtag mode, replace by current selection
		if (e.keyCode == 9 && this.replaceMode) {
			this.$.text.removeSelection();
			e.preventDefault();
		}
	},

	keyPressed: function(ctrl, e){
		// ENTER key validate the twist
		if (e.charCode == 13) {
			e.preventDefault();
			this.publishTwist();
			return;
		}

		// In hashtag mode, wait end character
		var selection = this.$.text.getSelection();
		var hashtagMode = this.replaceMode || isInHashtag(selection);
		var char = String.fromCharCode(e.charCode);
		if (hashtagMode) {
			if (!char.match(/[a-zA-Z_]/i)) {
				// Leave hashtag mode
				if (e.charCode == 32) {
					char = "&nbsp;"
				}
				if (this.replaceMode) {
					selection.deleteFromDocument();
				}
				appendNode(this.$.text, "twist-in-text", char);
				this.replaceMode = false;
				this.replaceValue = '';
				e.preventDefault();
				return;
			} else {
				// Intellisense proposal
				var tags = ["microsoft", "mobile", "android", "dotnet", "facebook", "apple"];
				var current;
				if (this.replaceMode) {
					current = this.replaceValue+char.toLowerCase();
				} else {
				 	current = (getRawSelection(selection)+char).toLowerCase();
				}
				for (var i = 0 ; i < tags.length ; i++) {
console.log("Look for <"+current+"> in <"+tags[i]+">");
					if (tags[i].indexOf(current) == 0) {
						var delta = platform.firefox ? -this.replaceValue.length : 1; // HACK: Firefox handle selection differently
						this.$.text.insertAtCursor(tags[i].substr(current.length-1));
						selection.extend(selection.anchorNode, current.length+delta);
						this.replaceMode = true;
						this.replaceValue = current;
						e.preventDefault();
						break;
					}
				}
			}
		} else {
			// # key enter in hashtag mode
			if (e.charCode == 35) {
				appendNode(this.$.text, "twist-tag-in-text", "#");
				e.preventDefault();
				return;
			}
		}
	},

	twistButtonTapped: function() {
		this.$.urlDecorator.removeClass('twist-focused');
		this.$.textDecorator.removeClass('twist-focused');
		this.publishTwist();
	},

	updateCount: function(ctrl) {
		var textRaw = getRawtext(ctrl);
		var textLength = textRaw.length;
		var count = this.$.url.getValue().length+textLength;
		if (textLength > 1) {
			count++;
		}
		this.$.count.setContent(count);
		return count;
	},

	createTwist: function() {
		console.log("Create/Update Twist URL");
	},

	publishTwist: function() {
		console.log('Publish the Twist !');
		/*var that = this;
		Storage.getValue("token", function(token) {
			if (!token) {
				that.$.authDialog.show();
				return;
			}
			var ajax = new Ajax({
				url: "http://localhost:8081/api/twist",
				method: "POST",
				handleAs: "json",
				postBody: {
					uid: token.uid,
					url: encodeURI(that.$.url.getValue()),
					text: that.$.text.getValue(),
					clean: true,
					published: true
				}
			});
			ajax.headers = {"x-key":token.username, "x-access-token":token.token};
			ajax.response(util.bindSafely(that, 'apiCallResponse'));
			ajax.error(util.bindSafely(that, 'apiCallFail'));
			ajax.go();
		});*/
	},

	apiCallResponse: function(inSender, inResponse) {
		this.$.url.setValue('');
		this.$.text.setValue('');
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

// Private: Convert RichText into a raw text
function getRawtext(richtext) {
	var root = richtext.hasNode();
	if (!root) {
		return '';
	}
	var nodes = root.childNodes;
	var rawtext = '';
	for (var i = 0 ; i < nodes.length ; i++) {
		rawtext += nodes[i].innerText;
	}
	return rawtext;
}

// Private: Detect if the current selection is in hashtag mode
function isInHashtag(selection) {
	if (!selection || !selection.anchorNode || !selection.anchorNode.parentNode) {
		return false;
	}
	if (selection.anchorNode.className == "twist-tag-in-text") {
		return true;
	} else if (selection.anchorNode.parentNode.className == "twist-tag-in-text") {
		return true;
	}
	return false;
}

// Private: Get current selection as raw text
function getRawSelection(selection) {
	if (!selection || !selection.anchorNode || !selection.anchorNode.parentNode) {
		return "";
	}
	if (selection.anchorNode.className == "twist-tag-in-text") {
		return "";
	} else if (selection.anchorNode.parentNode.className == "twist-tag-in-text") {
		var text = '';
		var nodes = selection.anchorNode.parentNode.childNodes;
		for (var i = 0 ; i < nodes.length ; i++) {
			text += nodes[i].nodeValue;
		}
		return text.substr(1);
	}
	return "";
}

// Private: Create a new node into the current selection
function appendNode(ctrl, className, text) {
	var root = ctrl.hasNode();
	if (!root) {
		return;
	}
	var container = document.createElement("div");
	container.className = className;
	container.innerHTML = text;
	root.appendChild(container);
	var range = document.createRange();
	var selection = ctrl.getSelection();
	if (selection) {
		range.selectNode(container);
		selection.removeAllRanges();
		selection.addRange(range);
		selection.collapse(container, 1);
	}
}
