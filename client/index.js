var
	kind = require('enyo/kind'),
	ready = require('enyo/ready');

var
	Application = require('enyo/Application');

var
	Panels = require('moonstone/Panels');

var
	MainView = require('./mainview');

var TwistApp = module.exports = kind({
	name: 'Twist.Application',
	kind: Application,
	view: MainView
});

ready(function () {
	new TwistApp({name: 'app'});
});
