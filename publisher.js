
// Publish twist on different support

var mongo = require('mongodb');

var server;
var db;
var servicesCollection;

var services = [];

var metaparser = require('./metaparser');
var imagepicker = require('./imagepicker');


module.exports = {
	init: function(ini, callback) {
		// Load settings
		accountsCollection = ini.collections.accounts;

		// Connect to database
		server = new mongo.Server(ini.database.server, ini.database.port, {auto_reconnect: true});
		db = new mongo.Db(ini.database.name, server, {w:1});
		db.open(function(err, db) {
			if(err) {
			}
			if (callback) callback();
		});

		// Load all services provider
		services.twitter = require('./services/twitter');
		services.yammer = require('./services/yammer');
		services.facebook = require('./services/facebook');
		services.linkedin = require('./services/linkedin');
		services.bitly = require('./services/bitly');
		services.authorsuggest = require('./services/authorsuggest');
	},

	publish: function(twist, callback) {
		// Call cleaner
		if (twist.clean) {
			callCleaner(twist, function(result) {
				// Launch the rest of process
				launchProcess(twist, callback)
			});
			return;
		}

		// Launch the rest of process
		launchProcess(twist, callback);
	},

	clean: function(twist, callback) {
		callCleaner(twist, function(result) {
			callback(result);
		});
	},

	parseTags: function(twist, callback) {
		parseTags(twist, function(result) {
			callback(result);
		});
	},

	shorten: function(twist, callback) {
		callShortener(twist, function(result) {
			callback(result);
		});
	},

	suggestAuthor: function(twist, callback) {
		callAuthorSuggest(twist, function(result) {
			callback(result);
		});
	},

	getMetadata: function(twist, callback) {
		metaparser.process(twist, function(result) {
			callback(result);
		});
	},

	getImages: function(twist, callback) {
		imagepicker.process(twist, function(result) {
			callback(result);
		});
	},

	publishOn: function(provider, twist, callback) {
		// List all activated accounts for the user
		var query = {uid: twist.uid, provider: provider.name, type: provider.type, activated: true};
		getAccounts(query, function(accounts) {
			// No account for this provider
			if (provider == null || accounts.length == 0) {
				callback(null);
				return;
			}

			// Post with provider
			provider.post(accounts[0], twist, function(result) {
				callback(result);
			});
		});
	},

	getOn: function(provider, twist, callback) {
		// List all activated accounts for the user
		var query = {uid: twist.uid, provider: provider.name, type: provider.type, activated: true};
		getAccounts(query, function(accounts) {
			// No account for this provider
			if (provider == null || accounts.length == 0) {
				callback(null);
				return;
			}

			// Get from this provider
			provider.get(accounts[0], twist, function(result) {
				callback(result);
			});
		});
	},

	deleteOn: function(provider, twist, callback) {
		// List all activated accounts for the user
		var query = {uid: twist.uid, provider: provider.name, type: provider.type, activated: true};
		getAccounts(query, function(accounts) {
			// No account for this provider
			if (provider == null || accounts.length == 0) {
				callback(null);
				return;
			}

			// Delete with the provider
			provider.delete(accounts[0], twist, function(result) {
				callback(result);
			});
		});
	}
}

// Private: Launch process
function launchProcess(twist, callback) {
	// Extract metadata
	metaparser.process(twist, function(result) {
		var results = [];
		callShortener(twist, function(result) {
			// Add shortener result if any
			if (result) {
				results.push(result);
				if (result.urlShortened) {
					twist.urlShortened = result.urlShortened;
				}
			}

			// Launch publication
			publishWithAllAccounts(twist, results, callback);
		});
	});
}

// Private: Call url cleaner
function callCleaner(twist, callback) {
	// Look for query string
	var queryIndex = twist.url.indexOf('?');
	if (queryIndex == -1) {
		// Not present, go to next call
		callback(null);
		return;
	}

	// Clean url
	twist.url = twist.url.substr(0, queryIndex);
	callback({
		provider: 'cleaner',
		urlCleaned: twist.url
	});
}

// Private: Parse #TAG
function parseTags(twist, callback) {
	var tags = [];

	// Look for #
	var text = twist.text;
	if (text) {
		var i = text.indexOf('#');
		while (i != -1 && i < text.length) {
			// Get all characters after tag
			var tag = '';
			var char;
			i++;
			while (i < text.length && (
				((char = text[i]) == '_') ||
				(char >= 'A' && char <= 'Z') ||
				(char >= 'a' && char <= 'z')
			)) {
				tag += char;
				i++;
			}
			if (tag.length >= 1) {
				tags.push(tag.toLowerCase());
			}

			// Pass to next instance of #
			if (i < text.length) {
				i = text.indexOf('#', i);
			}
		}
	}

	// Return tags list
	callback({
		provider: 'tagparser',
		tags: tags
	});
}

// Private: Call shortener
function callShortener(twist, callback) {
	callServiceProvider('shortener', twist, callback);
}

// Private: Call author suggest service
function callAuthorSuggest(twist, callback) {
	callServiceProvider('dictionnary', twist, callback);
}

// Private: Call a service provider
function callServiceProvider(service, twist, callback) {
	// List all activated accounts for the user
	var query = {uid: twist.uid, type: service, activated: true};
	getAccounts(query, function(accounts) {
		// No service, call next
		if (accounts.length == 0) {
			callback(null);
			return;
		}

		// Get the service
		var provider = services[accounts[0].provider];
		if (provider) {
			// Post with provider
			provider.process(accounts[0], twist, function(result) {
				callback(result);
			});
		} else {
			//  No provider, call next
			callback(null);
		}
	});
}

// Private: Publish the twist to all accounts of the user
function publishWithAllAccounts(twist, results, callback) {
	// List all activated accounts for the user
	query = {uid: twist.uid, type: 'publisher', activated: true};
	getAccounts(query, function(accounts) {
		// Publish to all account
		var waitingFor = accounts.length;
		for (var i = 0 ; i < accounts.length ; i++) {
			// Get the provider
			var provider = services[accounts[i].provider];
			if (provider) {
				// Post with provider
				provider.post(accounts[i], twist, function(result) {
					results.push(result);
					if (--waitingFor == 0) {
						// Callback with results
						callback(results);
					}
				});
			} else {
				//  No provider, go to next account
				if (--waitingFor == 0) {
					// Callback with results
					callback(results);
				}
			}
		}
	});
}

// Private: get all accounts matching query
function getAccounts(query, callback) {
	db.collection(accountsCollection, function(err, collection) {
		collection.find(query).toArray(function(err, accounts) {
			callback(accounts);
		});
	});
}
