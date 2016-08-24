
// Service to extract META TAG
var request = require("request");
var htmlparser = require("htmlparser");
var soupselect = require("soupselect");


module.exports = {
	process: function(twist, callback) {
		request({url: twist.url}, function(error, response, body) {
			// Invalid url
			if (error) {
				callback({
					provider: 'metaparser',
					error: 'invalid url'
				});
				return;
			}

			// Register handler
			response.setEncoding('utf8');
			var handler = new htmlparser.DefaultHandler(function (error, dom) {
				// Unable to handle parser
				if (error) {
					callback({
						provider: 'metaparser',
						error: 'unable to instanciate handler'
					});
					return;
				}

				// Extract title and descriptin
				var metadata = {};
				var metas = soupselect.select(dom, "meta");
				metas.forEach(function(meta) {
					if (meta.attribs.name == 'dc.title' || meta.attribs.property == 'og:title') {
						metadata.title = meta.attribs.content;
					} else if (meta.attribs.name == 'dc.description' || meta.attribs.property == 'og:description') {
						metadata.description = meta.attribs.content;
					} else if (meta.attribs.name == 'og:image') {
						metadata.image = meta.attribs.content;
					}
				});

				// Extract image if not in metadata
				if (!metadata.image) {
					var links = soupselect.select(dom, "link");
					links.forEach(function(link) {
						if (link.attribs.rel == 'image_src')
							metadata.image = link.attribs.href;
					});
				}

				// Return metadata
				twist.metadata = metadata;
				callback({
					provider: 'metaparser',
					metadata: metadata
				});
			});

			// Launch parsing
			var parser = new htmlparser.Parser(handler);
			parser.parseComplete(body);
		});
	}
}
