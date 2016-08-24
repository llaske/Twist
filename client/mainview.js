var
	util = require('enyo/utils'),
	kind = require('enyo/kind'),
	platform = require('enyo/platform'),
	Button = require('moonstone/Button'),
	Input = require('moonstone/Input'),
	IconButton = require('moonstone/IconButton'),
	InputDecorator = require('moonstone/InputDecorator'),
	Popup = require('moonstone/Popup'),
	Img = require('enyo/Image'),
	GridListImageItem = require('moonstone/GridListImageItem'),
	Overlay = require('moonstone/Overlay'),
	Spotlight = require('spotlight'),
	Dialog = require('./dialog'),
	SmartTextArea = require('./smarttext'),
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
			{name: "text", kind: SmartTextArea, onfocus: 'focused', oninput: 'updateCount', onValidate: 'publishTwist'}
		]},
		{name: 'authorDecorator', kind: InputDecorator, spotlight: true, classes: 'twist-author-decorator', components: [
			{name: 'author', kind: Input, classes: 'twist-author', placeholder: 'Author', oninput: 'updateCount', onfocus: 'focused'}
		]},
		{name: 'images', classes: 'twist-images selection-enabled', components: [
		]},
		{name: 'authDialog', kind: Dialog},
		{name: 'errorPopup', kind: Popup, content: ''}
	],
	published: {
		token: null
	},

	// Constructor
	create: function() {
		this.inherited(arguments);

		// Set URL if one is provided on query string
		var find = "?url=";
		var index = window.location.href.indexOf(find);
		if (index != -1) {
			var href = window.location.href.substr(index+find.length);
			this.$.url.setValue(decodeURI(href));
		}

		Spotlight.initialize(this);

		this.twist = null;
	},

	// First rendering, initialize
	rendered: function() {
		this.inherited(arguments);

		// Initialize
		this.$.url.focus();
		this.callMethod('getTags');
	},

	// Focus changed, adapt field decoration
	focused: function(ctrl) {
		this.$.urlDecorator.removeClass('twist-focused');
		this.$.textDecorator.removeClass('twist-focused');
		this.$.authorDecorator.removeClass('twist-focused');
		ctrl.parent.addClass('twist-focused');
	},

	// Reset Content-type
	resetContent: function() {
		this.$.text.reset('');
		this.$.author.setValue('');
		var images = [];
		for (var i = 0 ; i < this.$.images.getControls().length ; i++) {
			images.push(this.$.images.controls[i]);
		}
		for (var i = 0 ; i < images.length ; i++) {
			images[i].destroy();
		}
		this.updateCount();
	},

	// Image selection change
	imageSelected: function (sender, e) {
		// Unselect all image - except the one clicked
		var images = this.$.images.children;
		for (var i = 0 ; i < images.length ; i++) {
			if (images[i] != sender) {
				images[i].set('selected', false);
			}
		}

		// Change image selection
		sender.set('selected', !sender.selected);

		// Update the twist images
		if (sender.selected) {
			this.twist.image = sender.source;
		} else {
			this.twist.image = undefined;
		}
	},

	// Twist button tapped, publish the Twist
	twistButtonTapped: function() {
		this.$.urlDecorator.removeClass('twist-focused');
		this.$.textDecorator.removeClass('twist-focused');
		this.$.authorDecorator.removeClass('twist-focused');
		if (this.twist) {
			this.publishTwist();
		}
	},

	// Update character count for the twist
	updateCount: function() {
		var urlLength = this.$.url.getValue().length;
		var textRaw = this.$.text.getRawtext();
		var textLength = textRaw.length;
		var authorLength = this.$.author.getValue().length;
		var count = urlLength+textLength+authorLength;
		if (textLength > 1) {
			count++; // Whitespace
		}
		if (authorLength > 1) {
			count+=3; // Whitespace + ( + )
		}
		this.$.count.setContent(count);
		return count;
	},

	// Call an API on the server but first ensure that the token is valid
	callMethod: function(methodName) {
		var that = this;
		var method = util.bindSafely(this, methodName);
		Storage.getValue("token", function(token) {
			// Check token first
			that.token = token;
			if (!that.token) {
				// Invalid, open auth dialog first
				that.$.authDialog.setThen(method);
				that.$.authDialog.show();
				return;
			}

			// Token is valid, call method directly
			method.call(that);
		});
	},

	// Retrieve all existing tags
	getTags: function() {
		var that = this;
		this.sendRequest(
			"tag",
			"GET",
			"getTags",
			{},
			function(sender, response) {
				that.$.text.setTags(response);
			}
		);
	},

	// Create the Twist in database (without publishing it at first)
	createTwist: function() {
		// A twist is already here
		if (this.twist) {
			// First delete the current one
			this.callMethod('deleteTwist');
			this.resetContent();
		}

		// Then create the new Twist
		var that = this;
		this.sendRequest(
			"twist",
			"POST",
			"createTwist",
			{
				uid: this.token.uid,
				url: encodeURI(this.$.url.getValue()),
				text: this.$.text.getRawtext(),
				author: this.$.author.getValue(),
				cleaned: true,
				published: false
			},
			function(sender, response) {
				// Store cleaned URL
				that.twist = response;
				that.$.url.setValue(that.twist.url);

				// Shorten URL
				that.callMethod('shortenURL');

				// Get metadata
				that.callMethod('getMetadata');
			},
			function(sender, error) {
				if (error == 400) {
					// Invalid URL
					that.$.errorPopup.setContent('Invalid URL');
					that.$.errorPopup.show();
				} else {
					that.apiCallFail(sender, error);
				}
			}
		);
	},

	// Shorten URL of the twist
	shortenURL: function() {
		var that = this;
		this.sendRequest(
			"twist/"+this.twist._id+"/short",
			"GET",
			"shortenURL",
			{},
			function(sender, response) {
				if (response.urlShortened) {
					that.twist.urlShortened = response.urlShortened;
					that.$.url.setValue(that.twist.urlShortened);
				}
			}
		);
	},

	// Get metadata of the twist
	getMetadata: function() {
		var that = this;
		this.sendRequest(
			"twist/"+this.twist._id+"/metadata",
			"GET",
			"getMetadata",
			{},
			function(sender, response) {
				// If an images is specified in metadata, use it
				if (response.metadata && response.metadata.image) {
					// Display the image
					that.$.images.createComponent(
						{
							kind: GridListImageItem,
							classes: 'twist-image-item',
							selected: true,
							source: response.metadata.image,
							placeholder: Img.placeholder,
							ontap: 'imageSelected',
							mixins: [Overlay.Selection]
						},
						{owner: that}
					).render();

					// Use it for the twist
					that.twist.image = response.metadata.image;
					that.twist.metadata = response.metadata;
				}

				// Load all images in the page
				else {
					that.callMethod('getImages');
				}
			}
		);
	},

	// Get images of the twist
	getImages: function() {
		var that = this;
		this.sendRequest(
			"twist/"+this.twist._id+"/images",
			"GET",
			"getImages",
			{},
			function(sender, response) {
				// If there is images in the page
				if (response.images && response.images.length > 0) {
					// Display each image
					for (var i = 0 ; i < response.images.length ; i++) {
						that.$.images.createComponent(
							{
								kind: GridListImageItem,
								classes: 'twist-image-item',
								selected: false,
								source: response.images[i],
								placeholder: Img.placeholder,
								ontap: 'imageSelected',
								mixins: [Overlay.Selection]
							},
							{owner: that}
						).render();
					}
				}
			}
		);
	},

	// Delete the twist
	deleteTwist: function() {
		var that = this;
		this.sendRequest(
			"twist/"+this.twist._id,
			"DELETE",
			"deleteTwist",
			{},
			function(sender, response) {
			}
		);
	},

	// Publish the Twist
	publishTwist: function() {
		// Update fields
		var that = this;
		var twistUpdate = {
			uid: this.token.uid,
			url: encodeURI(this.$.url.getValue()),
			text: this.$.text.getRawtext(),
			author: this.$.author.getValue(),
			published: true
		};
		if (this.twist.image) {
			twistUpdate.image = this.twist.image;
		}
		if (this.twist.urlShortened) {
			twistUpdate.urlShortened = this.twist.urlShortened;
		}
		if (this.twist.metadata) {
			twistUpdate.metadata = JSON.stringify(this.twist.metadata);
		}
console.log(twistUpdate);

		// Send the update request to server
		this.sendRequest(
			"twist/"+this.twist._id,
			"PUT",
			"publishTwist",
			twistUpdate,
			function(sender, response) {
				console.log(response);
				that.$.url.setValue('');
				that.resetContent();
				that.twist = null;
			}
		);
	},

	// Generic method to build and send a request to the server with the header already included
	sendRequest: function(apiToCall, apiType, dataMethod, postParams, callbackOk, callbackError) {
		var ajax = new Ajax({
			url: "http://localhost:8081/api/"+apiToCall,
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
			ajax.error(util.bindSafely(this, 'apiCallFail'));
		}
		ajax.go();
	},

	// Generic API error handler: if auth error, open the dialog then relaunch the command
	apiCallFail: function(inSender, inError) {
		if (inError == 401) {
			this.$.authDialog.setThen(util.bindSafely(this, inSender.headers["data-method"]));
			this.$.authDialog.show();
		} else {
			this.$.errorPopup.setContent('Error '+inError+' while connecting to server');
			this.$.errorPopup.show();
		}
	}
});
