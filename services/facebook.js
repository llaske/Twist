
// Service to post in Facebook
var facebook =  require('fb');

module.exports = {
	name: 'facebook',

	type: 'publisher',

	post: function(account, twist, callback) {
		// Set token
		var result = {
			aid: account._id,
			provider: 'facebook',
			name: account.name
		}
		if (!setToken(account)) {
			// Error on token
			result.error = "Invalid token";
			callback(result);
			return;
		}

		// Post status update to Facebook
		var post = {
			link: twist.url,
			message: twist.text ? twist.text + ' ' : ''
		};
		if (twist.author) {
			post.message += ' ('+twist.author+')';
		}
		if (twist.image) {
			// Can't be done since 2.11: https://stackoverflow.com/questions/47348337/facebook-graph-v2-11-only-owners-of-the-url-have-the-ability-to-specify-the-pic
			//post.picture = twist.image;
		}
		facebook.api('me/feed', 'post', post, function (res) {
			if (!res || res.error) {
				result.error = res.error.code + ": " + res.error.message;
			} else {
				result.id = res.id;
			}
			callback(result);
		});
	},

	get: function(account, twist, callback) {
		// Set token
		var result = {
			aid: account._id,
			provider: 'facebook',
			name: account.name
		}
		if (!setToken(account)) {
			// Error on token
			result.error = "Invalid token";
			callback(result);
			return;
		}

		// Get status
		facebook.api(twist.id, 'get', {fields: "message,link"}, function (res) {
			if (!res || res.error) {
				result.error = res.error.code + ": " + res.error.message;
			} else {
				result.url = res.link;
				result.text = res.message;
			}
			callback(result);
		});
	},

	delete: function(account, twist, callback) {
		// Set token
		var result = {
			aid: account._id,
			provider: 'facebook',
			name: account.name
		}
		if (!setToken(account)) {
			// Error on token
			result.error = "Invalid token";
			callback(result);
			return;
		}

		// Delete status
		facebook.api(twist.id, 'delete', function (res) {
			if (!res || res.error) {
				result.error = res.error.code + ": " + res.error.message;
			}
			callback(result);
		});
	}
}


// Private : Set Facebook token for the account
function setToken(account, callback) {
	// Check keys presence
	var keys = account.keys;
	if (!keys.access_token) {
		return false;
	}

	// Set token
	facebook.setAccessToken(keys.access_token);
	return true;
}
