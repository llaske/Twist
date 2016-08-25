
// Unit testing on publisher

var assert = require('assert');
var publisher = require('../publisher');
var twitter = require('../services/twitter');
var yammer = require('../services/yammer');

// Connect to MongoDB
var settings = {
	database: {	server: "localhost", port: "27018",	name: "twist" },
	collections: { posts: "posts", accounts: "accounts" }
};
var testUserUID = "577ba1c317a3bd6ae3b13642";


describe('init publisher', function() {
	it('should log to database', function(done) {
		publisher.init(settings, function() {
			done();

			describe('publisher', function() {
				describe('#clean', function() {
					it('should do nothing on already cleaned url', function(done) {
						publisher.clean({url: "http://lespot-bouygues.com"}, function(result) {
							assert.equal(null, result);
							done();
						});
					});

					it('should remove query', function(done) {
						publisher.clean({url: "https://www.youtube.com/watch?v=eFIfLnm4dFs"}, function(result) {
							assert.equal("https://www.youtube.com/watch", result.urlCleaned);
							done();
						});
					});

					it('should remove query but not tag', function(done) {
						publisher.clean({url: "http://lespot-bouygues.com/#contact?key=123&value=RT%30T"}, function(result) {
							assert.equal("http://lespot-bouygues.com/#contact", result.urlCleaned);
							done();
						});
					});
				});

				describe('#parseTags', function() {
					it('no tags in null text', function(done) {
						publisher.parseTags({}, function(result) {
							assert.notEqual(null, result.tags);
							assert.equal(0, result.tags.length);
							done();
						});
					});

					it('no tags in empty text', function(done) {
						publisher.parseTags({text: ''}, function(result) {
							assert.notEqual(null, result.tags);
							assert.equal(0, result.tags.length);
							done();
						});
					});

					it('no tags in text without tags', function(done) {
						publisher.parseTags({text: 'Hey, this is a text with no tag inside!'}, function(result) {
							assert.notEqual(null, result.tags);
							assert.equal(0, result.tags.length);
							done();
						});
					});

					it('identify tags in text', function(done) {
						publisher.parseTags({text: 'Hey, this is an #microsoft system inside but #Android #ios is nice too.'}, function(result) {
							assert.notEqual(null, result.tags);
							assert.equal(3, result.tags.length);
							assert.equal("microsoft", result.tags[0]);
							assert.equal("android", result.tags[1]);
							assert.equal("ios", result.tags[2]);
							done();
						});
					});

					it('identify special case tags in text', function(done) {
						publisher.parseTags({text: '#bEGin # #: #o #one#two #1 #three'}, function(result) {
							assert.notEqual(null, result.tags);
							assert.equal(5, result.tags.length);
							assert.equal("begin", result.tags[0]);
							assert.equal("o", result.tags[1]);
							assert.equal("one", result.tags[2]);
							assert.equal("two", result.tags[3]);
							assert.equal("three", result.tags[4]);
							done();
						});
					});
				});

				this.timeout(8000);

				describe('#getMetadata', function() {
					it('should return nothing if no medata', function(done) {
						publisher.getMetadata({url: "http://lespot-bouygues.com"}, function(result) {
							assert.notEqual(result.metadata, null);
							assert.notEqual(result.metadata, undefined);
							assert.equal(0, Object.keys(result.metadata).length);
							done();
						});
					});

					it('should return nothing if unexisting url', function(done) {
						publisher.getMetadata({url: "http://www"}, function(result) {
							assert.notEqual(result.error, null);
							assert.notEqual(result.error, undefined);
							done();
						});
					});

					it('should get title and description', function(done) {
						publisher.getMetadata({url: "http://www.latribune.fr/entreprises-finance/services/transport-logistique/sans-uber-et-lyft-une-ville-texane-tente-de-s-organiser-differemment-581360.html"}, function(result) {
							assert.notEqual(result.metadata, null);
							assert.notEqual(result.metadata, undefined);
							assert.equal(3, Object.keys(result.metadata).length);
							assert.equal('http://static.latribune.fr/full_width/581430/austin.png', result.metadata.image);
							assert.equal("Sans Uber et Lyft, une ville texane tente de s&#039;organiser différemment", result.metadata.title);
							assert.equal("A Austin, au Texas, des réglementations strictes ont été mises en place en mai dernier vis à vis des compagnies de VTC. Suite à cela Uber et Lyft ont quitté la ville et de nouvelles méthodes contournent ces interdictions.", result.metadata.description);
							done();
						});
					});

					it('should get image, title and description', function(done) {
						publisher.getMetadata({url: "http://www.lemondeinformatique.fr/actualites/lire-blockchain-l-attaque-contre-dao-conduit-ethereum-a-proposer-un-fork-65194.html"}, function(result) {
							assert.notEqual(result.metadata, null);
							assert.notEqual(result.metadata, undefined);
							assert.equal(3, Object.keys(result.metadata).length);
							assert.equal('http://images.itnewsinfo.com/lmi/articles/grande/000000052547.jpg', result.metadata.image);
							assert.equal("Blockchain : l'attaque contre The DAO conduit Ethereum � proposer un fork - Le Monde Informatique", result.metadata.title);
							assert.equal("L'exploitation d'une faille dans The DAO, organisation autonome d�centralis�e bas�e sur la blockchain d'Ethereum, a permis � un utilisateur de subtili...", result.metadata.description);
							done();
						});
					});
				});

				describe('#getImages', function() {
					it('should return images, test with LeSpot', function(done) {
						publisher.getImages({url: "http://lespot-bouygues.com"}, function(result) {
							assert.notEqual(result.images, null);
							assert.notEqual(result.images, undefined);
							assert.equal(true, result.images.length > 1);
							for (var i = 0 ; i < result.images.length ; i++) {
								assert.equal(0, result.images[i].indexOf('http'));
							}
							done();
						});
					});

					it('should return nothing if unexisting url', function(done) {
						publisher.getImages({url: "http://www"}, function(result) {
							assert.notEqual(result.error, null);
							assert.notEqual(result.error, undefined);
							done();
						});
					});

					it('should return images, test with LMI', function(done) {
						publisher.getImages({url: "http://www.lemondeinformatique.fr/actualites/lire-blockchain-l-attaque-contre-dao-conduit-ethereum-a-proposer-un-fork-65194.html"}, function(result) {
							assert.notEqual(result.images, null);
							assert.notEqual(result.images, undefined);
							assert.equal(true, result.images.length > 1);
							for (var i = 0 ; i < result.images.length ; i++) {
								assert.equal(0, result.images[i].indexOf('http'));
							}
							done();
						});
					});

					it('should return images, test with La Tribune', function(done) {
						publisher.getImages({url: "http://www.latribune.fr/entreprises-finance/services/transport-logistique/sans-uber-et-lyft-une-ville-texane-tente-de-s-organiser-differemment-581360.html"}, function(result) {
							assert.notEqual(result.images, null);
							assert.notEqual(result.images, undefined);
							assert.equal(true, result.images.length > 1);
							for (var i = 0 ; i < result.images.length ; i++) {
								assert.equal(0, result.images[i].indexOf('http'));
							}
							done();
						});
					});

					it('should return images, test with Ubergizmo', function(done) {
						publisher.getImages({url: "http://fr.ubergizmo.com/2016/07/28/ecran-cinema-3d-sans-lunettes.html"}, function(result) {
							assert.notEqual(result.images, null);
							assert.notEqual(result.images, undefined);
							assert.equal(true, result.images.length > 1);
							for (var i = 0 ; i < result.images.length ; i++) {
								assert.equal(0, result.images[i].indexOf('http'));
							}
							done();
						});
					});

					it('should return images, test with iphon.fr', function(done) {
						publisher.getImages({url: "http://www.iphon.fr/post/le-milliard-d-iphone-vendu-est-officiellement-atteint-857945"}, function(result) {
							assert.notEqual(result.images, null);
							assert.notEqual(result.images, undefined);
							assert.equal(true, result.images.length > 1);
							for (var i = 0 ; i < result.images.length ; i++) {
								assert.equal(0, result.images[i].indexOf('http'));
							}
							done();
						});
					});
				});

				describe('#shorten', function() {
					it('should return a short url', function(done) {
						publisher.shorten({uid: testUserUID, url: "http://lespot-bouygues.com"}, function(result) {
							assert.equal("http://bit.ly/11vmmy1", result.urlShortened);
							done();
						});
					});

					it('should do nothing if already shortened', function(done) {
						publisher.shorten({uid: testUserUID, url: "http://bit.ly/11vmmy1"}, function(result) {
							assert.equal("ALREADY_A_BITLY_LINK", result.error);
							done();
						});
					});
				});

				describe('#authorsuggest', function() {
					it('should return a suggested author', function(done) {
						publisher.suggestAuthor({uid: testUserUID, url: "http://fr.ubergizmo.com/2016/08/25/gants-dexmo-ressentir-objets-realite-virtuelle.html"}, function(result) {
							assert.equal("@ubergizmofr", result.author);
							done();
						});
					});

					it('should do nothing if unknown prefix', function(done) {
						publisher.suggestAuthor({uid: testUserUID, url: "http://lespot-bouygues.com"}, function(result) {
							assert.equal(undefined, result.author);
							done();
						});
					});
				});

				describe('#publish on Twitter', function() {
					var tweetId = null;

					it('should publish', function(done) {
						publisher.publishOn(twitter, {uid: testUserUID, url: "http://lespot-bouygues.com", text: "Hello!"}, function(result) {
							assert.equal(undefined, result.error);
							assert.notEqual(undefined, result.id);
							tweetId = result.id;
							done();
						});
					});

					it('should get', function(done) {
						publisher.getOn(twitter, {uid: testUserUID, id: tweetId}, function(result) {
							assert.notEqual(result.text, null);
							assert.notEqual(result.text, undefined);
							assert.equal(0, result.text.indexOf("Hello! http"));
							done();
						});
					});

					it('should delete', function(done) {
						publisher.deleteOn(twitter, {uid: testUserUID, id: tweetId}, function(result) {
							assert.equal(undefined, result.error);
							done();
						});
					});
				});

				describe('#publish on Yammer', function() {
					var yamId = null;

					it('should publish', function(done) {
						publisher.publishOn(yammer, {uid: testUserUID, url: "http://lespot-bouygues.com", text: "Hello!"}, function(result) {
							assert.notEqual(undefined, result.id);
							yamId = result.id;
							done();
						});
					});

					it('should get', function(done) {
						publisher.getOn(yammer, {uid: testUserUID, id: yamId}, function(result) {
							assert.notEqual(result.text, null);
							assert.notEqual(result.text, undefined);
							assert.equal("Hello! http://lespot-bouygues.com", result.text);
							assert.equal("http://lespot-bouygues.com", result.url);
							done();
						});
					});

					it('should delete', function(done) {
						publisher.deleteOn(yammer, {uid: testUserUID, id: yamId}, function(result) {
							assert.equal(undefined, result.error);
							done();
						});
					});
				});
			});
		});
	});
});
