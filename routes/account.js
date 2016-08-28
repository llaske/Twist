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

	update: function(req, res) {
		// Check params
		if (!req || (!req.headers && !req.body) || !req.params) {
			res.status(400);
			res.send({'error': 'Invalid arguments'});
			return;
		}
		var uid = (req.headers ? req.headers['uid'] : req.body.uid);
		var id = req.params.id;
		var query = {};
		if (!uid || !mongo.ObjectID.isValid(uid) || !id || !mongo.ObjectID.isValid(id)) {
			res.status(400);
			res.send({'error': 'Invalid arguments'});
			return;
		}
		query.uid = uid;
		query._id = new mongo.ObjectID(id);

		// Get params updated
		var account = {};
		var params = req.body;
		if (params.name) {
			account.name = params.name;
		}
		if (params.provider) {
			account.provider = params.provider;
		}
		if (params.activated) {
			account.activated = (params.activated == "true");
		}
		if (params.type) {
			account.type = params.type;
		}
		if (params.keys) {
			account.keys = JSON.parse(params.keys);
		}

		// Update account matching
		db.collection(accountsCollection, function(err, collection) {
			collection.update(query, {$set: account}, {safe:true}, function(err, result) {
				if (err) {
					res.status(400);
					res.send({'error':'An error has occurred'});
				} else {
					res.send(account);
				}
			});
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
