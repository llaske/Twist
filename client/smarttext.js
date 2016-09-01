var
	util = require('enyo/utils'),
	kind = require('enyo/kind'),
	platform = require('enyo/platform'),
	TextArea = require('moonstone/RichText');

module.exports = kind({
	name: "smarttextarea",
	kind: TextArea,
	classes: "twist-text",
	handlers: {
		onkeypress: 'keyPressed',
		onkeydown: 'keyDown',
		oninput: 'inputChange'
	},
	events: {
		onValidate: ''
	},
	published: {
		tags: [],
		tabbed: false
	},

	create: function() {
		this.inherited(arguments);

		this.replaceMode = false;
		this.replaceValue = "";
	},

	rendered: function() {
		this.inherited(arguments);

		appendNode(this, "twist-in-text", "&nbsp;");
	},

	inputChange: function(ctrl, e) {
		var newSize = this.getRawtext().length;
		if (!newSize) {
			// HACK: Remove all dummy text (BR, ...) when text is empty
			this.reset();
		}
	},

	keyDown: function(ctrl, e) {
		// If TAB press in hashtag mode, replace by current selection
		if (e.keyCode == 9) {
			this.tabbed = this.replaceMode;
			if (this.replaceMode) {
				this.removeSelection();
				e.preventDefault();
			}
		}

		// ENTER key validate the twist
		else if (e.keyCode == 13) {
			this.doValidate();
			e.preventDefault();
			return;
		}
	},

	keyPressed: function(ctrl, e){
		// Ignore BACK
		if (e.charCode == 0) {
			return;
		}

		// ENTER key validate the twist
		else if (e.charCode == 13) {
			this.doValidate();
			e.preventDefault();
			return;
		}

		// In hashtag mode, wait end character
		var selection = this.getSelection();
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
				appendNode(this, "twist-in-text", char);
				this.replaceMode = false;
				this.replaceValue = '';
				e.preventDefault();
				return;
			} else {
				// Intellisense proposal
				var tags = this.tags;
				var current;
				if (this.replaceMode) {
					current = this.replaceValue+char.toLowerCase();
				} else {
				 	current = (getRawSelection(selection)+char).toLowerCase();
				}
				for (var i = 0 ; i < tags.length ; i++) {
					if (tags[i].indexOf(current) == 0) {
						var delta = platform.firefox ? -this.replaceValue.length : 1; // HACK: Firefox handle selection differently
						this.insertAtCursor(tags[i].substr(current.length-1));
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
				appendNode(this, "twist-tag-in-text", "#");
				e.preventDefault();
				return;
			}
		}
	},

	getRawtext: function() {
		var root = this.hasNode();
		if (!root) {
			return '';
		}
		var nodes = root.childNodes;
		var rawtext = '';
		for (var i = 0 ; i < nodes.length ; i++) {
			rawtext += nodes[i].innerText;
		}
		rawtext = rawtext.replace('\n', ' ').trim();
		return rawtext;
	},

	reset: function() {
		var root = this.hasNode();
		if (!root) {
			return;
		}
		while (root.firstChild) {
			root.removeChild(root.firstChild);
		}
		appendNode(this, "twist-in-text", "&nbsp;");
	}
});


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
