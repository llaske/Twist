
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
							assert.equal(post.text, 'Hello #Bouygues!');
							assert.equal(post.author, '@lionellaske');
							assert.notEqual(post.tags, null);
							assert.notEqual(post.tags, undefined);
							assert.equal(post.tags.length, 1);
							assert.equal(post.tags[0], "bouygues");
							assert.notEqual(undefined, post._id);
							assert.equal((Date.now()-post.createdOn.getTime())<1000, true);
							assert.equal(post.updatedOn.getTime(), post.createdOn.getTime());
							done();
						}
						posts.create({body: {url:encodeURI('http://lespot-bouygues.com'),uid:testUserUID, text: 'Hello #Bouygues!', author: '@lionellaske'}}, res);
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
							assert.equal(post.text, 'Hello #Bouygues!');
							assert.notEqual(post.tags, null);
							assert.notEqual(post.tags, undefined);
							assert.equal(post.tags.length, 1);
							assert.equal(post.tags[0], "bouygues");
							assert.equal((Date.now()-post.updatedOn.getTime())<1000, true);
							assert.equal(post.updatedOn.getTime(), post.createdOn.getTime());
							done();
						}
						posts.findById({body: {uid:testUserUID, _id:newTwistId}}, res);
					});
				});

				describe('#findTags()', function() {
					it('should retrieve all existing tags', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(res.value.length, 1);
							assert.equal(res.value[0], 'bouygues');
							done();
						}
						posts.findTags({body: {uid:testUserUID}}, res);
					});
				});

				describe('#update()', function() {
					it('should be updated', function(done) {
						res.done = function() {
							var post = res.value;
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal('Bye #Microsoft, welcome #macOS', post.text);
							assert.equal(post.author, '@c2s_bouygues');
							assert.notEqual(post.tags, null);
							assert.notEqual(post.tags, undefined);
							assert.equal(post.tags.length, 2);
							assert.equal(post.tags[0], 'microsoft');
							assert.equal(post.tags[1], 'macos');
							assert.notEqual(post.createdOn, post.updatedOn);
							done();
						}
						var update = {};
						update.uid = testUserUID;
						update._id = newTwistId;
						update.text = 'Bye #Microsoft, welcome #macOS';
						update.author = '@c2s_bouygues';
						posts.update({body: update}, res);
					});

					it('should updated with right fields', function(done) {
						res.done = function() {
							var post = res.value;
							assert.notEqual(undefined, post);
							assert.notEqual(null, post);
							assert.equal(post.url, encodeURI('http://lespot-bouygues.com'));
							assert.equal(post.text, 'Bye #Microsoft, welcome #macOS');
							assert.notEqual(post.tags, null);
							assert.notEqual(post.tags, undefined);
							assert.equal(post.tags.length, 2);
							assert.equal(post.tags[0], 'microsoft');
							assert.equal(post.tags[1], 'macos');
							assert.equal((Date.now()-post.updatedOn.getTime())<1000, true);
							assert.notEqual(post.createdOn, post.updatedOn);
							done();
						}
						posts.findById({body: {uid:testUserUID, _id:newTwistId}}, res);
					});

					it('should update existing tags', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(res.value.length, 2);
							assert.equal(res.value[0], 'macos');
							assert.equal(res.value[1], 'microsoft');
							done();
						}
						posts.findTags({body: {uid:testUserUID}}, res);
					});
				});

				this.timeout(8000);

				describe('#short()', function() {
					it('should do nothing without uid and id', function(done) {
						res.done = function() {
							assert.equal(undefined, res.value);
							done();
						}
						posts.short({body: {}}, res);
					});

					it('should do nothing without id', function(done) {
						res.done = function() {
							assert.equal(undefined, res.value);
							done();
						}
						posts.short({body: {uid:testUserUID}}, res);
					});

					it('should do nothing with an invalid id', function(done) {
						res.done = function() {
							assert.equal(undefined, res.value);
							done();
						}
						posts.short({body: {uid:testUserUID, _id:'ffffffffffffffffffffffff'}}, res);
					});

					it('should call shortener', function(done) {
						res.done = function() {
							assert.notEqual(undefined, res.value);
							assert.notEqual(null, res.value);
							assert.equal("http://bit.ly/11vmmy1", res.value.urlShortened);
							done();
						}
						posts.short({body: {uid:testUserUID, _id:newTwistId}}, res);
					});
				});

				var metadataTwistId = null;
				describe('#metadata()', function() {

					it('should create a twist for metadata', function(done) {
						res.done = function() {
							var post = res.value;
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(post.text, 'LMI #microsoft');
							assert.equal(post.url, encodeURI('http://www.lemondeinformatique.fr/actualites/lire-blockchain-l-attaque-contre-dao-conduit-ethereum-a-proposer-un-fork-65194.html'));
							assert.notEqual(undefined, post._id);
							metadataTwistId = post._id;
							assert.notEqual(post.tags, null);
							assert.notEqual(post.tags, undefined);
							assert.equal(post.tags.length, 1);
							assert.equal(post.tags[0], 'microsoft');
							assert.equal((Date.now()-post.createdOn.getTime())<1000, true);
							assert.equal(post.updatedOn.getTime(), post.createdOn.getTime());
							done();
						}
						posts.create({body: {url:encodeURI('http://www.lemondeinformatique.fr/actualites/lire-blockchain-l-attaque-contre-dao-conduit-ethereum-a-proposer-un-fork-65194.html'), text: 'LMI #microsoft', uid:testUserUID}}, res);
					});

					it('should update existing tags', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(res.value.length, 2);
							assert.equal(res.value[0], 'macos');
							assert.equal(res.value[1], 'microsoft');
							done();
						}
						posts.findTags({body: {uid:testUserUID}}, res);
					});

					it('should do nothing without uid and id', function(done) {
						res.done = function() {
							assert.equal(undefined, res.value);
							done();
						}
						posts.metadata({body: {}}, res);
					});

					it('should do nothing without id', function(done) {
						res.done = function() {
							assert.equal(undefined, res.value);
							done();
						}
						posts.metadata({body: {uid:testUserUID}}, res);
					});

					it('should do nothing with an invalid id', function(done) {
						res.done = function() {
							assert.equal(undefined, res.value);
							done();
						}
						posts.metadata({body: {uid:testUserUID, _id:'ffffffffffffffffffffffff'}}, res);
					});

					it('should get metadata', function(done) {
						res.done = function() {
							assert.notEqual(res.value.metadata, null);
							assert.notEqual(res.value.metadata, undefined);
							assert.equal(3, Object.keys(res.value.metadata).length);
							assert.equal('http://images.itnewsinfo.com/lmi/articles/grande/000000052547.jpg', res.value.metadata.image);
							assert.equal("Blockchain : l'attaque contre The DAO conduit Ethereum � proposer un fork - Le Monde Informatique", res.value.metadata.title);
							assert.equal("L'exploitation d'une faille dans The DAO, organisation autonome d�centralis�e bas�e sur la blockchain d'Ethereum, a permis � un utilisateur de subtili...", res.value.metadata.description);
							done();
						}
						posts.metadata({body: {uid:testUserUID, _id:metadataTwistId}}, res);
					});
				});

				describe('#images()', function() {
					it('should do nothing without uid and id', function(done) {
						res.done = function() {
							assert.equal(undefined, res.value);
							done();
						}
						posts.images({body: {}}, res);
					});

					it('should do nothing without id', function(done) {
						res.done = function() {
							assert.equal(undefined, res.value);
							done();
						}
						posts.images({body: {uid:testUserUID}}, res);
					});

					it('should do nothing with an invalid id', function(done) {
						res.done = function() {
							assert.equal(undefined, res.value);
							done();
						}
						posts.images({body: {uid:testUserUID, _id:'ffffffffffffffffffffffff'}}, res);
					});

					it('should get images from LeSpot', function(done) {
						res.done = function() {
							assert.notEqual(res.value.images, null);
							assert.notEqual(res.value.images, undefined);
							assert.equal(true, res.value.images.length > 1);
							done();
						}
						posts.images({body: {uid:testUserUID, _id:newTwistId}}, res);
					});

					it('should get images from LMI', function(done) {
						res.done = function() {
							assert.notEqual(res.value.images, null);
							assert.notEqual(res.value.images, undefined);
							assert.equal(true, res.value.images.length > 1);
							done();
						}
						posts.images({body: {uid:testUserUID, _id:metadataTwistId}}, res);
					});
				});

				describe('#delete()', function() {
					it('should do nothing without uid and id', function(done) {
						res.done = function() {
							assert.notEqual(undefined, res.value);
							assert.notEqual(null, res.value);
							assert.notEqual(undefined, res.value.error);
							done();
						}
						posts.delete({body: {}}, res);
					});

					it('should do nothing without id', function(done) {
						res.done = function() {
							assert.notEqual(undefined, res.value);
							assert.notEqual(null, res.value);
							assert.notEqual(undefined, res.value.error);
							done();
						}
						posts.delete({body: {uid:testUserUID}}, res);
					});

					it('should delete one', function(done) {
						res.done = function() {
							assert.notEqual(undefined, res.value);
							assert.notEqual(null, res.value);
							assert.equal(newTwistId, res.value._id);
							done();
						}
						posts.delete({body: {uid:testUserUID, _id:newTwistId}}, res);
					});

					it('should delete two', function(done) {
						res.done = function() {
							assert.notEqual(undefined, res.value);
							assert.notEqual(null, res.value);
							assert.equal(metadataTwistId, res.value._id);
							done();
						}
						posts.delete({body: {uid:testUserUID, _id:metadataTwistId}}, res);
					});

					it('should retrieve init count', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(initCount, res.value.length);
							done();
						}
						posts.findAll({}, res);
					});

					it('should retrieve init user count', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(initUserCount, res.value.length);
							done();
						}
						posts.findAll({body: {uid: testUserUID}}, res);
					});

					it('should update existing tags', function(done) {
						res.done = function() {
							assert.notEqual(res.value, null);
							assert.notEqual(res.value, undefined);
							assert.equal(res.value.length, 0);
							done();
						}
						posts.findTags({body: {uid:testUserUID}}, res);
					});
				});
			});
		});
	});
});
