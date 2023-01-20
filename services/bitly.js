

// Service to shorten URL
var request = require("request");


module.exports = {
	name: 'bitly',

	type: 'service',

	process: function(account, twist, callback) {
		// Check keys presence
		var keys = account.keys;
		if (!keys || !keys.apiKey) {
			callback({
				aid: account._id,
				provider: 'bitly',
				name: account.name,
				error: 'invalid key'
			});
			return;
		}

		// Call bitly service
		request.post("https://api-ssl.bitly.com/v4/shorten",{
			auth: {
				bearer: keys.apiKey
			},
			json: true,
			body: {
				long_url: twist.url
			}
		}, function(error, response, body) {
			if (response.statusCode > 205) {
				callback({
					aid: account._id,
					provider: 'bitly',
					name: account.name,
					error: "Error "+response.statusCode
				});
			} else {
				callback({
					aid: account._id,
					provider: 'bitly',
					name: account.name,
					urlShortened: body.link
				});
			}
		});
	}
}
