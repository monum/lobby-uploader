'use strict';

var CronJob = require('cron').CronJob,
	bunyan = require('bunyan'),
	assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	aws = require('aws-sdk'),
	lconf = require('lconf'),
	hs = require('hulksmash'),
	runJob = require('./behavior').runJob;

var log = bunyan.createLogger({name: "lobby-uploader"});

var configDir = "./config/";

var global = hs.keys(lconf()
		.parse(configDir + "global.json")	
		.parse(configDir + "global.yml")	
		.parse(configDir + "global.yaml")	
		.parse(configDir + "global.js")
		.suppress()
		.opts());

// verify we have global config
try {
	assert.notDeepEqual(global, {},
	"global configuration not found! see https://github.com/monum/lobby-uploader/#configuration for more info.");
} catch (e) {
	log.error({error: e, global: global}, "Failed to find global configuration.");
	throw e;
}

// login with global creds
aws.config.update({accessKeyId: global["S3_API_KEY"], secretAccessKey: global["S3_API_TOKEN"]});

// get the jobs
var jobDir = "./jobs/",
	jobs = fs.readdirSync(jobDir);

// iterate jobs
for (var i = 0 ; i < jobs.length ; i++) {
	var job = jobs[i];

	if (path.extname(job) !== ".js") {
		log.warn({job: job}, "Skipping job");
	} else {

		log.info({job: job}, "Found new job");

		var jobConfigPath = configDir + path.basename(job, path.extname(job));

		// parse the job config, if there is any
		var jobOpts = hs(lconf()
			.parse(jobConfigPath + ".json")
			.parse(jobConfigPath + ".yml")
			.parse(jobConfigPath + ".yaml")
			.parse(jobConfigPath + ".js")
			.suppress()
			.opts());

		var interval = (jobOpts["FOREVER"] || global["FOREVER"] || false) ? jobOpts["CRON_INTERVAL"] || global["CRON_INTERVAL"] || false : false;

		// if there's an interval set, cron it up
		// since we're using cronjob's this script won't immediately end
		if (interval) {
			
			log.info({job: job, interval: interval}, "Scheduling Job.");

			// use a closure to capture variables
			(function(job, jobDir, global, jobOpts) {
				function _runner() {
					log.info({job: job, path: jobDir + job}, "Starting Job...");
					// handle sync and async errors
					try {
						runJob("../" + jobDir + job, global, jobOpts, function(e) {
							log.error({error: e, job: job, path: jobDir + job}, "Job Exception!");
						});
					} catch (e) {
						log.error({error: e, job: job, path: jobDir + job}, "Job Exception!");
						throw e;
					} finally {
						log.info({job: job, path: jobDir + job}, "Job Finished.");
					}
				};

				new CronJob(interval, _runner).start();
				_runner();
			})(job, jobDir, global, jobOpts);
		}
	}
}