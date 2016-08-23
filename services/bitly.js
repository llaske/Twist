

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
		var url = "http://api.bit.ly/v3/shorten?apiKey="+keys.apiKey+"&login="+account.name+"&longUrl="+twist.url+"&format=json";
		request({url: url}, function(error, response, body) {
			var data = JSON.parse(response.body);
			if (data.status_code != 200) {
				callback({
					provider: 'bitly',
					name: account.name,
					error: data.status_txt
				});
			} else {
				callback({
					provider: 'bitly',
					name: account.name,
					urlShortened: data.data.url
				});
			}
		});
	}
}
