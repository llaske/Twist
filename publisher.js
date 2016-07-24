
// Publish twist on different support

var mongo = require('mongodb');

var server;
var db;
var servicesCollection;

var services = [];

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
		services.bitly = require('./services/bitly');
	},

	publish: function(twist, callback) {
		// Call shortener
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
	}
}

// Private: Call shortener
function callShortener(twist, callback) {
	// List all activated accounts for the user
	var query = {uid: twist.uid, type: 'shortener', activated: true};
	db.collection(accountsCollection, function(err, collection) {
		collection.find(query).toArray(function(err, accounts) {
			// No shortener, call next
			if (accounts.length == 0) {
				callback(null);
				return;
			}

			// Get the shortener
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
	});
}

// Private: Publish the twist to all accounts of the user
function publishWithAllAccounts(twist, results, callback) {
	// List all activated accounts for the user
	query = {uid: twist.uid, type: 'publisher', activated: true};
	db.collection(accountsCollection, function(err, collection) {
		collection.find(query).toArray(function(err, accounts) {
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
	});
}
