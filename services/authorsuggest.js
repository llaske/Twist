

// Service to suggest and author

module.exports = {
	name: 'authorsuggest',

	type: 'service',

	process: function(account, twist, callback) {
		// Check keys presence
		var keys = account.keys;
		if (!keys || !keys.prefix || !keys.authors) {
			callback({
				provider: 'authorsuggest',
				error: 'invalid key'
			});
			return;
		}

		// Look for a matching url prefix into the array
		for (var i = 0 ; i < keys.prefix.length ; i++) {
			var prefix = keys.prefix[i];
			if (twist.url.indexOf(prefix) == 0) {
				// One match, return it
				callback({
					provider: 'authorsuggest',
					author: keys.authors[i]
				});
				return;
			}
		}

		// No match
		callback({
			provider: 'authorsuggest'
		});
	}
}
