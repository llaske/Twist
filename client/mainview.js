var
	util = require('enyo/utils'),
	kind = require('enyo/kind'),
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
			{name: "text", kind: TextArea, classes: "twist-text", placeholder: 'Enter Twist here', onkeypress: 'keyPressed', onkeydown: 'keyDown', oninput: 'updateCount', onfocus: 'focused'}
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
	},

	rendered: function() {
		this.inherited(arguments);

		this.$.url.focus();
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

	keyDown: function(ctrl, e) {
		// If TAB press in hashtag mode, replace by current selection
		if (e.keyCode == 9 && isInHashtag(ctrl.getSelection())) {
			ctrl.getSelection().anchorNode.nodeValue = "#XXX";
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
		var textValue = this.$.text.getValue();
		var selection = this.$.text.getSelection();
		var hashtagMode = isInHashtag(selection);
		if (hashtagMode) {
			var char = String.fromCharCode(e.charCode);
			if (!char.match(/[a-zA-Z_]/i)) {
				// Leave hashtag mode
				if (e.charCode == 32) {
					char = "&nbsp;"
				}
				textValue = textValue.replace(new RegExp('<br>','g'), '');
				if (isLastElement(selection)) {
					this.$.text.setValue(textValue+char);
				} else {
					this.$.text.setValue(textValue);
					this.$.text.insertAtCursor(char);
				}
				e.preventDefault();
				return;
			}
		} else {
			// # key enter in hashtag mode
			if (e.charCode == 35) {
				var char = '<div class="twist-tag-in-text">#</div>';
				if (isLastElement(this.$.text.getSelection())) {
					this.$.text.setValue(textValue+char);
				} else {
					this.$.text.setValue(textValue);
					this.$.text.insertAtCursor(char);
				}
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

	updateCount: function(ctrl, e) {
		var textRaw = getRawtext(ctrl.value);
		var textLength = textRaw.length;
		var count = this.$.url.getValue().length+textLength;
		if (textLength > 1) {
			count++;
		}
		this.$.count.setContent(count);
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
	var textRaw = richtext;
	textRaw = textRaw.replace(new RegExp('<div class="twist-tag-in-text">','g'), '');
	textRaw = textRaw.replace(new RegExp('</div>','g'), '');
	textRaw = textRaw.replace(new RegExp('<br>','g'), '');
	textRaw = textRaw.replace(new RegExp('&nbsp;','g'), ' ');
	return textRaw;
}

// Private: Detect if the current selection is in hashtag mode
function isInHashtag(selection) {
	if (selection.focusOffset == 0) {
		return false;
	}
	var nodeValue = selection.anchorNode.nodeValue;
	if (nodeValue[0] == '#') {
		var inHashtag = false;
		for (var i = nodeValue.length-1 ; i >= 0 ; i--) {
			var current = nodeValue[i];
			if (current.match(/[a-zA-Z_]/i)) {
				continue;
			}
			if (current == '#') {
				inHashtag = true;
				break;
			}
			break;
		}
		return inHashtag;
	}
	return false;
}

// Private: Test if selection is on the last element of the text
function isLastElement(selection) {
	// TODO: Not clear how for the moment
	return true;
}
