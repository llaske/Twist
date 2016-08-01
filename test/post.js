
// Unit testing on posts

var assert = require('assert');
var posts = require('../routes/post');


// Connect to MongoDB
var settings = {
	database: {	server: "localhost", port: "27018",	name: "twist" },
	collections: { posts: "posts" }
};
var testUserUID = "577ba1c317a3bd6ae3b13642";

describe('init post', function() {
	it('should log to database', function(done) {
		posts.init(settings, function() {
			done();

			describe('post', function(done) {
				// HACK: Dummy request to match Express interface
				var res = {send: function(value) {
					this.value = value;
					if (this.done) this.done();
				}};

				// Start test
				this.timeout(2000);

				// First count number of twist in database
				var initCount = 0;
				var initUserCount = 0;
				describe('init count', function() {
					it('should init count', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							initCount = res.value.length;
							done();
						}
						posts.findAll({}, res);
					});
				});

				describe('init user count', function() {
					it('should init user count', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							initUserCount = res.value.length;
							done();
						}
						posts.findAll({body: {uid: testUserUID}}, res);
					});
				});

				describe('#findAll()', function() {
					it('should return all twists', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(initCount, this.value.length);
							done();
						}
						posts.findAll({}, res);
					});

					it('should return all twists for the user', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(initUserCount, this.value.length);
							done();
						}
						posts.findAll({body: {uid: testUserUID}}, res);
					});
				});

				var newTwistId = null;
				describe('#create()', function() {
					it('should create only with url and uid set', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal('Invalid arguments', res.value.error);
							done();
						}
						posts.create({body: {}}, res);
					});

					it('should create only with url set', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal('Invalid arguments', res.value.error);
							done();
						}
						posts.create({body: {uid:testUserUID}}, res);
					});

					it('should create only with uid set', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal('Invalid arguments', res.value.error);
							done();
						}
						posts.create({body: {url:encodeURI('http://lespot-bouygues.com')}}, res);
					});

					it('should create a twist', function(done) {
						res.done = function() {
							var post = res.value;
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							newTwistId = post._id;
							assert.equal(post.url, encodeURI('http://lespot-bouygues.com'));
							assert.equal(post.text, 'Hello');
							assert.notEqual(undefined, post._id);
							assert.equal((Date.now()-post.createdOn.getTime())<1000, true);
							assert.equal(post.updatedOn.getTime(), post.createdOn.getTime());
							done();
						}
						posts.create({body: {url:encodeURI('http://lespot-bouygues.com'),uid:testUserUID, text: 'Hello'}}, res);
					});

					it('should add a new twist', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(initCount+1, res.value.length);
							done();
						}
						posts.findAll({}, res);
					});

					it('should add a new twist to the user', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(initUserCount+1, res.value.length);
							done();
						}
						posts.findAll({body: {uid: testUserUID}}, res);
					});
				});

				describe('#findById()', function() {
					it('should retrieve nothing with non existing id', function(done) {
						res.done = function() {
							assert.equal(undefined, res.value);
							done();
						}
						posts.findById({body: {uid:testUserUID, _id:'ffffffffffffffffffffffff'}}, res);
					});

					it('should retrieve fields value', function(done) {
						res.done = function() {
							var post = res.value;
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							newTwistId = post._id;
							assert.notEqual(undefined, post);
							assert.notEqual(null, post);
							assert.equal(post.url, encodeURI('http://lespot-bouygues.com'));
							assert.equal(post.text, 'Hello');
							assert.equal((Date.now()-post.updatedOn.getTime())<1000, true);
							assert.equal(post.updatedOn.getTime(), post.createdOn.getTime());
							done();
						}
						posts.findById({body: {uid:testUserUID, _id:newTwistId}}, res);
					});
				});

				describe('#update()', function() {
					it('should be updated', function(done) {
						res.done = function() {
							var post = res.value;
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal('Bye', post.text);
							assert.notEqual(post.createdOn, post.updatedOn);
							done();
						}
						var update = {};
						update.uid = testUserUID;
						update._id = newTwistId;
						update.text = 'Bye';
						posts.update({body: update}, res);
					});

					it('should updated with right fields', function(done) {
						res.done = function() {
							var post = res.value;
							assert.notEqual(undefined, post);
							assert.notEqual(null, post);
							assert.equal(post.url, encodeURI('http://lespot-bouygues.com'));
							assert.equal(post.text, 'Bye');
							assert.equal((Date.now()-post.updatedOn.getTime())<1000, true);
							assert.notEqual(post.createdOn, post.updatedOn);
							done();
						}
						posts.findById({body: {uid:testUserUID, _id:newTwistId}}, res);
					});
				});
			});
		});
	});
});
