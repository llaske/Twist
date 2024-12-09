
// Service to post in Twitter
const {Client} = require("twitter-api-sdk");

module.exports = {
	name: 'twitter',

	type: 'publisher',

	post: function(account, twist, callback) {
		// Create twitter client
		var client = getClient(account);
		if (client == null) {
			callback({
				aid: account._id,
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

		var result = {
			aid: account._id,
			provider: 'twitter',
			name: account.name
		}
		client.tweets.createTweet({
			text: content,
		}).then((tweet) => {
			result.id = tweet.data.id;
			callback(result);
		}).catch((e) => {
			result.error = e.error.status + ": " + e.error.detail;
			callback(result);
		});
	},

	get: function(account, twist, callback) {
		// Create twitter client
		var client = getClient(account);
		if (client == null) {
			callback({
				aid: account._id,
				provider: 'twitter',
				name: account.name,
				error: 'invalid keys'
			});
			return;
		}

		// Get the Tweet matching the id
		var result = {
			aid: account._id,
			provider: 'twitter',
			name: account.name
		}
		twitterClient.tweets.findTweetsById({
			ids: [twist.id]
		}).then((tweet) => {
			result.text = tweet.data.text;
			callback(result);
		}).catch((e) => {
			result.error = e.error.status + ": " + e.error.detail;
			callback(result);
		});
	},

	delete: function(account, twist, callback) {
		// Create twitter client
		var client = getClient(account);
		if (client == null) {
			callback({
				aid: account._id,
				provider: 'twitter',
				name: account.name,
				error: 'invalid keys'
			});
			return;
		}

		// Delete the Tweet matching the id
		var result = {
			aid: account._id,
			provider: 'twitter',
			name: account.name
		}
		twitterClient.tweets.deleteTweetById(twist.id).then(() => {
			callback(result);
		}).catch((e) => {
			result.error = e.error.status + ": " + e.error.detail;
			callback(result);
		});
	}
}

// Private : Return Twitter client for the account
function getClient(account) {
	// Check keys presence
	var keys = account.keys;
	if (!keys || !keys.access_token_key) {
		return null;
	}

	// Create twitter client
	return new Client(keys.access_token_key);
}
