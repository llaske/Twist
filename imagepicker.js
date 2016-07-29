
// Service to extract all images
var request = require("request");
var htmlparser = require("htmlparser");
var soupselect = require("soupselect");


module.exports = {
	process: function(twist, callback) {
		request({url: twist.url}, function(error, response, body) {
			// Register handler
			var images = [];
			response.setEncoding('utf8');
			var handler = new htmlparser.DefaultHandler(function (error, dom) {
				// Unable to handle parser
				if (error) {
					callback({
						provider: 'imagepicker',
						error: 'unable to instanciate handler'
					});
					return;
				}

				// Return images set
				twist.images = images;
				callback({
					provider: 'imagepicker',
					images: images
				});
			});

			// Launch parsing
			var parser = new htmlparser.Parser(handler);
			parser.parseComplete(body);
		});
	}
}
