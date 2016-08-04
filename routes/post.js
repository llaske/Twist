// Twist handling
var mongo = require('mongodb');
var publisher = require('../publisher');

var server;
var db;
var postsCollection;

module.exports = {
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
		if (params.text) {
			post.text = params.text;
		}
		if (params.published) {
			post.published = params.published;
		}
		if (params.clean) {
			post.clean = params.clean;
		}
		post.createdOn = post.updatedOn = new Date(Date.now());

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

	update: function(req, res) {
		// Check params
		var params = req.body;
		if (!params.uid || !params._id || !mongo.ObjectID.isValid(params._id)) {
			res.send({'error': 'Invalid arguments'});
			return;
		}
		var post = {};
		post.uid = params.uid;
		if (params.url) {
			post.url = params.url;
		}
		if (params.text) {
			post.text = params.text;
		}
		if (params.published) {
			post.published = params.published;
		}
		if (params.clean) {
			post.clean = params.clean;
		}
		post.updatedOn = new Date(Date.now());

		// Update the Twist
		db.collection(postsCollection, function(err, collection) {
			collection.update({'_id':new mongo.ObjectID(params._id)}, {$set: post}, {safe:true}, function(err, result) {
				if (err) {
					res.send({'error':'An error has occurred'});
				} else {
					// Publish if need
					if (post.published) {
						publisher.publish(post, function(execres) {
							post.publishResult = execres;
							res.send(post);
						});
						return;
					}

					// Else just send object
					res.send(post);
				}
			});
		});
	},

	delete: function(req, res) {
		// check params
		var params = req.body;
		if (!params) {
			res.send({'error': 'Invalid arguments'});
			return;
		}
		var uid = params.uid;
		var id = params._id;
		if (!uid || !mongo.ObjectID.isValid(uid)) {
			res.send({'error': 'Invalid arguments'});
			return;
		}
		if (!id || !mongo.ObjectID.isValid(id)) {
			res.send({'error': 'Invalid arguments'});
			return;
		}
		db.collection(postsCollection, function(err, collection) {
			collection.remove({'_id':new mongo.ObjectID(id), 'uid':uid}, function(err, result) {
				if (err) {
					res.send({'error':'An error has occurred'});
				} else {
					res.send({_id:id});
				}
			});
		});
	},

	findAll: function(req, res) {
		// Limit to an user
		var query = {};
		if (req.body && req.body.uid) {
			if (!mongo.ObjectID.isValid(req.body.uid)) {
				res.send();
				return;
			}
			query.uid = req.body.uid;
		}

		// Retrieve all twists
		db.collection(postsCollection, function(err, collection) {
			collection.find(query).toArray(function(err, items) {
				res.send(items);
			});
		});
	},

	findById: function(req, res) {
		// Get post
		getPost(req.body, function(item) {
			res.send(item);
		});
	},

	short: function(req, res) {
		// Get post
		getPost(req.body, function(twist) {
			// Invalid twist
			if (!twist) {
				res.send();
				return;
			}

			// Call shortener
			publisher.shorten(twist, function(result) {
				res.send(result);
			});
		});
	},

	metadata: function(req, res) {
		// Get post
		getPost(req.body, function(twist) {
			// Invalid twist
			if (!twist) {
				res.send();
				return;
			}

			// Get metadata
			publisher.getMetadata(twist, function(result) {
				res.send(result);
			});
		});
	},

	images: function(req, res) {
		// Get post
		getPost(req.body, function(twist) {
			// Invalid twist
			if (!twist) {
				res.send();
				return;
			}

			// Get images
			publisher.getImages(twist, function(result) {
				res.send(result);
			});
		});
	}
}

// Private: get a twist
function getPost(params, callback) {
	// Get params
	if (!params) {
		callback();
		return;
	}
	var uid = params.uid;
	var id = params._id;

	// Limit to an user
	var query = {};
	if (!uid || !mongo.ObjectID.isValid(uid)) {
		callback();
		return;
	}
	query.uid = uid;

	// Limit to a specific twist
	if (!id || !mongo.ObjectID.isValid(id)) {
		callback();
		return;
	}
	query._id = id;

	// Retrieve twist matching
	db.collection(postsCollection, function(err, collection) {
		collection.findOne(query, function(err, item) {
			callback(item);
		});
	});
}
