

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
				provider: 'bitly',
				name: account.name,
				error: 'invalid key'
			});
			return;
		}

		// Call bitly service
		var url = "http://api.bit.ly/v3/shorten?apiKey="+keys.apiKey+"&login="+account.name+"&longUrl="+twist.url+"&format=txt";
		request({url: url}, function(error, response, body) {
			if (response.statusCode != 200) {
				callback({
					provider: 'bitly',
					name: account.name,
					error: body
				});
			} else {
				callback({
					provider: 'bitly',
					name: account.name,
					urlShortened: body.replace('\n', '')
				});
			}
		});
	}
}
