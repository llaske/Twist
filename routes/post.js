// Twist handling
var mongo = require('mongodb');
var publisher = require('../publisher');

var server;
var db;
var postsCollection;

var post = {
	init: function(ini, callback) {
		// Load settings
		postsCollection = ini.collections.posts;

		// Connect to database
		server = new mongo.Server(ini.database.server, ini.database.port, {auto_reconnect: true});
		db = new mongo.Db(ini.database.name, server, {w:1});
		db.open(function(err, db) {
			if(err) {
			}
			if (callback) callback();
		});
	},

	create:  function(req, res) {
		// Check params
		var params = req.body;
		var post = {};
		if (!params.uid || !params.url) {
			res.send({'error': 'Invalid arguments'});
			return;
		}
		post.uid = params.uid;
		post.url = params.url;
		post.published = params.published;

		// Create the new twist
		db.collection(postsCollection, function (err, collection) {
			collection.insert(post, {safe:true}, function(err, result) {
				if (err) {
					res.send({'error':'An error has occurred creating post'});
				} else {
					// Publish if need
					if (post.published) {
						publisher.publish(result.ops[0], function(execres) {
							result.ops[0].publishResult = execres;
							res.send(result.ops[0]);
						});
						return;
					}

					// Else just send object
					res.send(result.ops[0]);
				}
			});
		});
	},

	findAll: function(req, res) {
		// Limit to an user
		var query = {};
		if (req.params && req.params.uid) {
			if (!mongo.BSONPure.ObjectID.isValid(req.params.uid)) {
				res.send();
				return;
			}
			query = {uid: req.params.uid};
		}

		// Retrieve all twists
		db.collection(postsCollection, function(err, collection) {
			collection.find(query).toArray(function(err, items) {
				res.send(items);
			});
		});
	}
}

module.exports = post;
