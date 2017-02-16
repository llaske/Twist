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
		this.allowHtml = true;
	},

	rendered: function() {
		this.inherited(arguments);
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

		// Get char
		var char = String.fromCharCode(e.charCode);

		// Compute selection
		var currentValue = unformatValue(this.getValue());
		var selection = this.getRawSelection();

		// Hashtag mode handling
		var hashtagSelection = isInHashtag(currentValue, selection);
		var hashtagMode = hashtagSelection;
		if (hashtagMode) {
			// Cut string before and after the current tag
			var before = currentValue.substr(0, hashtagSelection.start);
			var after = currentValue.substr(hashtagSelection.end+1);
			var tag = currentValue.substr(hashtagSelection.start+1, hashtagSelection.end-hashtagSelection.start);
			var beforeCursorInTag = tag.substr(0, selection.start-hashtagSelection.start-1);
			var afterCursorInTag = tag.substr(selection.start-hashtagSelection.start-1);
			var newSelection = {start: selection.start+1, end: selection.start+1};
			var beforeAndTag = before+"#";
			var newValue = beforeAndTag+beforeCursorInTag+char+afterCursorInTag+after;

			// Intellisense proposal
			var tags = this.tags;
			var toFind = beforeCursorInTag+char;
			var found = false;
			for (var i = 0 ; i < tags.length ; i++) {
				if (tags[i].indexOf(toFind) == 0) {
					newValue = beforeAndTag+tags[i]+after;
					newSelection.start = beforeAndTag.length+beforeCursorInTag.length+1;
					newSelection.end = beforeAndTag.length+tags[i].length;
					this.replaceMode = true;
					found = true;
					break;
				}
			}

			// New tag
			if (!found && this.replaceMode) {
				newValue = beforeAndTag+beforeCursorInTag+char+after;
			}

			// Replace text
			this.setValue(formatValue(newValue));
			this.setRawSelection(newSelection.start, newSelection.end);
		} else {
			// Set new value
			var newValue;
			if (selection.start == currentValue.length) {
				newValue = currentValue + char;
			} else {
				newValue = currentValue.substr(0, selection.start)+char+currentValue.substr(selection.end);
			}
			this.setValue(formatValue(newValue));
			this.setRawSelection(selection.start+1, selection.start+1);
			this.replaceMode = false;
		}

		e.preventDefault();
	},

	getRawtext: function() {
		return unformatValue(this.getValue());
	},

	getRawSelection: function() {
		var root = this.hasNode();
		if (!root) {
			return {start:-1, end: -1};
		}
		var selection = this.getSelection();
		var anchorNode = selection.anchorNode;
		var focusNode = selection.focusNode;
		var nodes = root.childNodes;
		var start = 0;
		var end = 0;
		var current = 0;
		for (var i = 0 ; i < nodes.length ; i++) {
			var node = nodes[i];
			var child = node.childNodes.length >= 1 ? node.childNodes[0] : null;
			if (node == anchorNode || child == anchorNode) {
				start = current + selection.anchorOffset;
			}
			if (node == focusNode || child == focusNode) {
				end = current + selection.focusOffset;
			}
			current += node.innerText ? node.innerText.length : node.length;
		}
		return {start: start, end: end};
	},

	setRawSelection: function(start, end) {
		var root = this.hasNode();
		if (!root) {
			return;
		}
		var selection = this.getSelection();
		var anchorNode;
		var focusNode;
		var nodes = root.childNodes;
		var range = document.createRange();
		var current = 0;
		for (var i = 0 ; i < nodes.length ; i++) {
			var node = nodes[i];
			if (node.childNodes.length >= 1) {
				node = node.childNodes[0];
			}
			var length = node.innerText ? node.innerText.length : node.length;
			if (start >= current && start <= current+length) {
				range.setStart(node, start-current);
			}
			if (end >= current && end <= current+length) {
				range.setEnd(node, end-current);
			}
			current += length;
		}
		selection.removeAllRanges();
		selection.addRange(range);
	},

	reset: function() {
		var root = this.hasNode();
		if (!root) {
			return;
		}
		while (root.firstChild) {
			root.removeChild(root.firstChild);
		}
	}
});


// Private: Detect if the current selection is in hashtag mode
function isInHashtag(value, selection) {
	var start = -1;
	for (var i = selection.start-1 ; i >= 0 && i < value.length ; i--) {
		var char = value[i];
		if (char == '#') {
			start = i;
			break;
		} else if (!char.match(/[a-zA-Z_]/i)) {
			return null;
		}
	}

	var end = -1;
	for (var i = start+1 ; i < value.length ; i++) {
		var char = value[i];
		if (!char.match(/[a-zA-Z_]/i)) {
			break;
		}
		end = i;
	}

	if (start == -1) {
		return null;
	}

	return {start: start, end: (end==-1?start:end)};
}

// Private: Format/unformat field value
function formatValue(value) {
	var formated = value.replace(/#[a-zA-Z_]+/gi,
		function formatTag(tag) {
			return "<div class='twist-tag-in-text'>"+tag+"</div>";
	});
	return formated;
}
function unformatValue(value) {
	var unformated = value.replace(/<div class="twist-tag-in-text">/gi, "");
	unformated = unformated.replace(/<div class='twist-tag-in-text'>/gi, "")
	unformated = unformated.replace(/<\/div>/gi, "");
	unformated = unformated.replace('<br>', '');
	return unformated;
}
