
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
	},

	publish: function(twist, callback) {
		// List all services for the user
		var query = {uid: twist.uid, activated: true};
		db.collection(accountsCollection, function(err, collection) {
			collection.find(query).toArray(function(err, accounts) {
				// Publish to all account
				var publishResult = [];
				for (var i = 0 ; i < accounts.length ; i++) {
					// Get the provider
					var provider = services[accounts[i].provider];
					if (provider) {
						// Post with provider
						publishResult.push(provider.post(accounts[i], twist));
					}
				}

				// Callback with results
				callback(publishResult);
			});
		});
	}
}
