
// Unit testing on posts

var assert = require('assert');
var posts = require('../routes/post');


// Connect to MongoDB
var settings = {
	database: {	server: "localhost", port: "27018",	name: "twist" },
	collections: { posts: "posts" }
};
var testUserUID = "577ba1c317a3bd6ae3b13642";

describe('init', function() {
	it('should log to database', function(done) {
		posts.init(settings, function() {
			done();

			describe('post', function() {
				// HACK: Dummy request to match Express interface
				var res = {send: function(value) {
					this.value = value;
					if (this.done) this.done();
				}};

				// First count number of users in database
				var initCount = 0;
				res.done = function() {
					initCount = res.value.length;
				}
				posts.findAll(null, res);

				// Start test
				this.timeout(2000);

				describe('#findAll()', function() {
					it('should return all twists', function(done) {
						res.done = function() {
							assert.equal(initCount, this.value.length);
							done();
						}
						posts.findAll(null, res);
					});
				});

				var newUser = null;
				describe('#create()', function() {
					it('should create only with url and uid set', function(done) {
						res.done = function() {
							assert.equal('Invalid arguments', res.value.error);
							done();
						}
						posts.create({body: {post: '{}'}}, res);
					});

					it('should create only with url set', function(done) {
						res.done = function() {
							assert.equal('Invalid arguments', res.value.error);
							done();
						}
						posts.create({body: {post: '{"uid":"'+testUserUID+'"}'}}, res);
					});

					it('should create only with uid set', function(done) {
						res.done = function() {
							assert.equal('Invalid arguments', res.value.error);
							done();
						}
						posts.create({body: {post: '{"url":"'+encodeURI('http://lespot-bouygues.com')+'"}'}}, res);
					});

					it('should create a twist', function(done) {
						res.done = function() {
							var post = res.value;
							assert.equal(post.url, encodeURI('http://lespot-bouygues.com'));
							assert.notEqual(undefined, post._id);
							done();
						}
						posts.create({body: {post: '{"url":"'+encodeURI('http://lespot-bouygues.com')+'","uid":"'+testUserUID+'"}'}}, res);
					});

					it('should add a new twist', function(done) {
						res.done = function() {
							assert.equal(initCount+1, this.value.length);
							done();
						}
						posts.findAll(null, res);
					});
				});
			});
		});
	});
});
