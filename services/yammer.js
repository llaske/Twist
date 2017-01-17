
// Service to post in Yammer
var yammer = require('yammer-rest-api-client');

module.exports = {
	name: 'yammer',

	type: 'publisher',

	post: function(account, twist, callback) {
		// Create yammer client
		var client = getClient(account);
		if (client == null) {
			callback({
				aid: account._id,
				provider: 'yammer',
				name: account.name,
				error: 'invalid keys'
			});
			return;
		}

		// Post status update to Yammer
		var content = twist.text ? twist.text + ' ' : '';
		content += twist.url;
		if (twist.author) {
			content += ' ('+twist.author+')';
		}
		var message = {
			body: content,
			og_url: twist.url
		};
		if (twist.metadata) {
			if (twist.metadata.description) {
				message.og_description = twist.metadata.description;
			}
			if (twist.metadata.title) {
				message.og_title = twist.metadata.title;
			}
			if (twist.metadata.image) {
				message.og_image = twist.metadata.image;
			}
		}
		if (account.keys && account.keys.group_id) {
			message.group_id = account.keys.group_id;
		}
		client.messages.create(message, function(error, yam) {
			var result = {
				aid: account._id,
				provider: 'yammer',
				name: account.name
			}
			if (error) {
				if (error[0]) {
					result.error = error[0].code + ": " + error[0].message;
				} else {
					result.error = "Unknown error";
				}
			} else {
				result.id = yam.messages[0].id;
			}
			callback(result);
		});
	},

	get: function(account, twist, callback) {
		// Create yammmer client
		var client = getClient(account);
		if (client == null) {
			callback({
				aid: account._id,
				provider: 'yammer',
				name: account.name,
				error: 'invalid keys'
			});
			return;
		}

		// Get the Tweet matching the id
		client.messages.get(twist.id, function(error, yam) {
			var result = {
				aid: account._id,
				provider: 'yammer',
				name: account.name
			}
			if (error) {
				result.error = error[0].code + ": " + error[0].message;
			} else {
				result.url = yam.attachments[0].web_url;
				result.text = yam.body.parsed;
			}
			callback(result);
		});
	},

	delete: function(account, twist, callback) {
		// Create yammer client
		var client = getClient(account);
		if (client == null) {
			callback({
				aid: account._id,
				provider: 'yammer',
				name: account.name,
				error: 'invalid keys'
			});
			return;
		}

		// Delete the Yammer message matching the id
		client.messages.delete(twist.id, function(error, data) {
			var result = {
				aid: account._id,
				provider: 'yammer',
				name: account.name
			}
			if (error) {
				result.error = error[0].code + ": " + error[0].message;
			}
			callback(result);
		});
	}
}

// Private : Return Yammer client for the account
function getClient(account) {
	// Check keys presence
	var keys = account.keys;
	if (!keys || !keys.token) {
		return null;
	}

	// Create Yammer client
	var client = new yammer({
		token: keys.token
	});
	return client;
}
