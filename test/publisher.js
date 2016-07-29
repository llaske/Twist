
// Unit testing on publisher

var assert = require('assert');
var publisher = require('../publisher');
var twitter = require('../services/twitter');

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

				this.timeout(8000);

				describe('#getMetadata', function() {
					it('should return nothing if no medata', function(done) {
						publisher.getMetadata({url: "http://lespot-bouygues.com"}, function(result) {
							assert.equal(0, Object.keys(result.metadata).length);
							done();
						});
					});

					it('should get title and description', function(done) {
						publisher.getMetadata({url: "http://www.latribune.fr/entreprises-finance/services/transport-logistique/sans-uber-et-lyft-une-ville-texane-tente-de-s-organiser-differemment-581360.html"}, function(result) {
							assert.equal(2, Object.keys(result.metadata).length);
							assert.equal("Sans Uber et Lyft, une ville texane tente de s&#039;organiser différemment", result.metadata.title);
							assert.equal("A Austin, au Texas, des réglementations strictes ont été mises en place en mai dernier vis à vis des compagnies de VTC. Suite à cela Uber et Lyft ont quitté la ville et de nouvelles méthodes contournent ces interdictions.", result.metadata.description);
							done();
						});
					});

					it('should get image, title and description', function(done) {
						publisher.getMetadata({url: "http://www.lemondeinformatique.fr/actualites/lire-blockchain-l-attaque-contre-dao-conduit-ethereum-a-proposer-un-fork-65194.html"}, function(result) {
							assert.equal(3, Object.keys(result.metadata).length);
							assert.equal('http://images.itnewsinfo.com/lmi/articles/grande/000000052547.jpg', result.metadata.image);
							assert.equal("Blockchain : l'attaque contre The DAO conduit Ethereum � proposer un fork - Le Monde Informatique", result.metadata.title);
							assert.equal("L'exploitation d'une faille dans The DAO, organisation autonome d�centralis�e bas�e sur la blockchain d'Ethereum, a permis � un utilisateur de subtili...", result.metadata.description);
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

				describe('#publish on Twitter', function() {
					var tweetId = null;

					it('should publish', function(done) {
						publisher.publishOn(twitter, {uid: testUserUID, url: "http://lespot-bouygues.com", text: "Hello!"}, function(result) {
							assert.notEqual(undefined, result.id);
							tweetId = result.id;
							done();
						});
					});

					it('should get', function(done) {
						publisher.getOn(twitter, {uid: testUserUID, id: tweetId}, function(result) {
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
			});
		});
	});
});
