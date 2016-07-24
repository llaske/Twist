
// Service to post in Twitter
var twitter = require('twitter');

module.exports = {
	post: function(account, twist, callback) {
		// Check keys presence
		var keys = account.keys;
		if (!keys || !keys.consumer_key || !keys.consumer_secret || !keys.access_token_key || !keys.access_token_secret) {
			callback({
				provider: 'twitter',
				name: account.name,
				error: 'invalid keys'
			});
			return;
		}

		// Create twitter client
		var client = new twitter({
			consumer_key: keys.consumer_key,
			consumer_secret: keys.consumer_secret,
			access_token_key: keys.access_token_key,
			access_token_secret: keys.access_token_secret
		});

		// Post status update to Twitter
		client.post('statuses/update', {status: twist.url},  function(error, tweet, response){
			var result = {
				provider: 'twitter',
				name: account.name
			}
			if (error) {
				result.error = error[0].code + ": " + error[0].message;
			}
			callback(result);
		});
	}
}
