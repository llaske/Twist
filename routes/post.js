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

	create: function(req, res) {
		// Check params
		var params = req.body;
		var post = {};
		if (!params.uid) {
			res.status(400);
			res.send({'error': 'Invalid user'});
			return;
		}
		var isUrl = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
		if (!params.url || !isUrl.test(params.url)) {
			res.status(400);
			res.send({'error': 'Invalid url'});
			return;
		}

		// Set twist property values
		post.uid = params.uid;
		post.url = params.url;
		if (params.text) {
			post.text = params.text;
		}
		if (params.author) {
			post.author = params.author;
		}
		if (params.published) {
			post.published = (params.published == "true");
		}
		if (params.cleaned) {
			post.cleaned = (params.cleaned == "true");
		}
		post.createdOn = post.updatedOn = new Date(Date.now());
		publisher.parseTags(post, function(result) {
			post.tags = result.tags;

			// Clean if need
			if (post.cleaned) {
				publisher.clean(post, function(result) {
					if (result && result.urlCleaned) {
						post.url = result.urlCleaned;
					}
					createTwist(post, res);
				});
			}

			// Create the Twist
			else {
				createTwist(post, res);
			}
		});
	},

	update: function(req, res) {
		// Check params
		var params = req.body;
		if (!params.uid || !req.params.id || !mongo.ObjectID.isValid(req.params.id)) {
			res.status(400);
			res.send({'error': 'Invalid arguments'});
			return;
		}

		// Update twist property values
		var post = {};
		post.uid = params.uid;
		if (params.text) {
			post.text = params.text;
		}
		if (params.author) {
			post.author = params.author;
		}
		if (params.published) {
			post.published = (params.published == "true");
		}
		if (params.image) {
			post.image = params.image;
		}
		if (params.urlShortened) {
			post.urlShortened = params.urlShortened;
		}
		post.updatedOn = new Date(Date.now());
		publisher.parseTags(post, function(result) {
			post.tags = result.tags;

			// Update the Twist
			db.collection(postsCollection, function(err, collection) {
				collection.update({'_id':new mongo.ObjectID(req.params.id)}, {$set: post}, {safe:true}, function(err, result) {
					if (err) {
						res.status(400);
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
		});
	},

	delete: function(req, res) {
		// Check params
		var params = req;
		if (!params || !params.headers || !params.params) {
			res.status(400);
			res.send({'error': 'Invalid arguments'});
			return;
		}
		var uid = params.headers['uid'];
		var id = params.params.id;
		if (!uid || !mongo.ObjectID.isValid(uid)) {
			res.status(400);
			res.send({'error': 'Invalid arguments'});
			return;
		}
		if (!id || !mongo.ObjectID.isValid(id)) {
			res.status(400);
			res.send({'error': 'Invalid arguments'});
			return;
		}
		db.collection(postsCollection, function(err, collection) {
			collection.remove({'_id':new mongo.ObjectID(id), 'uid':uid}, function(err, result) {
				if (err) {
					res.status(400);
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
		var uid;
		if (req.headers && (uid = req.headers['uid'])) {
			if (!mongo.ObjectID.isValid(uid)) {
				res.status(400);
				res.send([]);
				return;
			}
			query.uid = uid;
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
		getPost(req, function(item) {
			// Invalid arguments
			if (!item) {
				res.status(400);
				res.send();
				return;
			}

			// Return item
			res.send(item);
		});
	},

	findTags: function(req, res) {
		// Limit to an user
		var uid;
		if (req.headers && (uid = req.headers['uid'])) {
			if (!mongo.ObjectID.isValid(uid)) {
				res.status(400);
				res.send([]);
				return;
			}
		}

		// Retrieve all tags of Twists
		var aggregate = [{'$match': {'uid': uid}}, {'$project': {'tags': 1, '_id': 0}}];
		db.collection(postsCollection, function(err, collection) {
			collection.aggregate(aggregate).toArray(function(err, items) {
				// Build a set of tags (unique)
				var tags = [];
				for(var i = 0 ; i < items.length ; i++) {
					var itemTags = items[i].tags;
					for (var j = 0 ; j < itemTags.length ; j++) {
						if(tags.indexOf(itemTags[j]) == -1) {
							tags.push(itemTags[j]);
						}
					}
				}

				// Sort by name and send it
				tags.sort();
				res.send(tags);
			});
		});
	},

	short: function(req, res) {
		// Get post
		getPost(req, function(twist) {
			// Invalid twist
			if (!twist) {
				res.status(400);
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
		getPost(req, function(twist) {
			// Invalid twist
			if (!twist) {
				res.status(400);
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
		getPost(req, function(twist) {
			// Invalid twist
			if (!twist) {
				res.status(400);
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
	if (!params || !params.headers || !params.params) {
		callback();
		return;
	}
	var uid = params.headers['uid'];
	var id = params.params.id;

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
	query._id = new mongo.ObjectID(id);

	// Retrieve twist matching
	db.collection(postsCollection, function(err, collection) {
		collection.findOne(query, function(err, item) {
			callback(item);
		});
	});
}

// Privte: Create a twist
function createTwist(post, res) {
	// Create the new twist
	db.collection(postsCollection, function (err, collection) {
		collection.insert(post, {safe:true}, function(err, result) {
			if (err) {
				res.status(400);
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
}
