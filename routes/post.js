// Twist handling
var mongo = require('mongodb');

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
		var param = req.body;
		var post = {};
		if (!param.uid || !param.url) {
			res.send({'error': 'Invalid arguments'});
			return;
		}
		post.uid = param.uid;
		post.url = param.url;

		// Create the new twist
		db.collection(postsCollection, function (err, collection) {
			collection.insert(post, {safe:true}, function(err, result) {
				if (err) {
					res.send({'error':'An error has occurred creating post'});
				} else {
					res.send(result.ops[0]);
				}
			});
		});
	},

	findAll: function(req, res) {
		// Retrieve all twists
		db.collection(postsCollection, function(err, collection) {
			collection.find().toArray(function(err, items) {
				res.send(items);
			});
		});
	}
}

module.exports = post;
