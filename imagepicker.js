
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

				// Retrieve all images
				var imageTags = soupselect.select(dom, "img");
				imageTags.forEach(function(image) {
					// Ignore local image
					var src = image.attribs.src;
					if (src.indexOf('data:') == 0) {
						return;
					}

					// Convert to absolute URL
					var url;
					if (src.indexOf('http') == 0) {
						url = src;
					} else if (src.indexOf('//') == 0) {
						url = 'http:' + src;
					} else {
						var dotdotslashslash = twist.url.indexOf('://');
						var scheme = twist.url.substr(0, dotdotslashslash);
						var serverEnd = twist.url.indexOf('/', dotdotslashslash+3);
						var server = twist.url.substr(dotdotslashslash+3, (serverEnd != -1 ? serverEnd : twist.url.length)-scheme.length-3);
						url = scheme + '://' + server + (src[0]!='/'?'/':'') + src;
					}

					// Add to images list
					images.push(url);
				});

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
