#!/usr/bin/env node

'use strict';

var forever = require('forever-monitor');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "lobby-uploader"});

// main should stay up "forever", since it's the host of cron jobs
var child = new (forever.Monitor)('lib/main.js', {
	max: 3,
	silent: false,
	args: []
});

child.on('exit', function () {
	log.error('lib/main.js has exited after 3 restarts. Something is wrong.');
});

child.start();