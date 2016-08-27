// Account handling
var mongo = require('mongodb');

var server;
var db;
var accountsCollection;

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
	},

	findAll: function(req, res) {
		// Limit to an user
		var query = {};
		var uid;
		if (req.headers && (uid = req.headers['uid'])) {
			if (!mongo.ObjectID.isValid(uid)) {
				res.status(400);
				res.send([]);
				return;
			}
			query.uid = uid;
		}

		// Filter
		if (req.query) {
			if (req.query.type) {
				query.type = req.query.type;
			}
			if (req.query.provider) {
				query.provider = req.query.provider;
			}
			if (req.query.activated) {
				query.activated = (req.query.activated == 'true');
			}
		}

		// Retrieve all accounts
		db.collection(accountsCollection, function(err, collection) {
			collection.find(query).toArray(function(err, items) {
				res.send(items);
			});
		});
	},
}
