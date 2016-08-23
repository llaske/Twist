
// Service to post in Twitter
var twitter = require('twitter');

module.exports = {
	name: 'twitter',

	type: 'publisher',

	post: function(account, twist, callback) {
		// Create twitter client
		var client = getClient(account);
		if (client == null) {
			callback({
				provider: 'twitter',
				name: account.name,
				error: 'invalid keys'
			});
			return;
		}

		// Post status update to Twitter
		var content = twist.text ? twist.text + ' ' : '';
		content += twist.urlShortened ? twist.urlShortened : twist.url;
		if (twist.author) {
			content += ' ('+twist.author+')';
		}
		client.post('statuses/update', {status: content},  function(error, tweet, response){
			var result = {
				provider: 'twitter',
				name: account.name
			}
			if (error) {
				result.error = error[0].code + ": " + error[0].message;
			} else {
				result.id = tweet.id_str;
			}
			callback(result);
		});
	},

	get: function(account, twist, callback) {
		// Create twitter client
		var client = getClient(account);
		if (client == null) {
			callback({
				provider: 'twitter',
				name: account.name,
				error: 'invalid keys'
			});
			return;
		}

		// Get the Tweet matching the id
		client.get('statuses/show', {id: twist.id}, function(error, tweet, response) {
			var result = {
				provider: 'twitter',
				name: account.name
			}
			if (error) {
				result.error = error[0].code + ": " + error[0].message;
			} else {
				result.text = tweet.text;
			}
			callback(result);
		});
	},

	delete: function(account, twist, callback) {
		// Create twitter client
		var client = getClient(account);
		if (client == null) {
			callback({
				provider: 'twitter',
				name: account.name,
				error: 'invalid keys'
			});
			return;
		}

		// Delete the Tweet matching the id
		client.post('statuses/destroy', {id: twist.id}, function(error, tweet, response) {
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

// Private : Return Twitter client for the account
function getClient(account) {
	// Check keys presence
	var keys = account.keys;
	if (!keys || !keys.consumer_key || !keys.consumer_secret || !keys.access_token_key || !keys.access_token_secret) {
		return null;
	}

	// Create twitter client
	var client = new twitter({
		consumer_key: keys.consumer_key,
		consumer_secret: keys.consumer_secret,
		access_token_key: keys.access_token_key,
		access_token_secret: keys.access_token_secret
	});
	return client;
}
