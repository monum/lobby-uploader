'use strict';

var aws = require('aws-sdk');

// This is what main calls into from each cron job
// It's the behavior to run a given job
// it's given:
// job - a path to a job file
// global - the global config object
// jobOpts - the config object for the given job
// thrower - callback to throw errors
function runJob(job, global, jobOpts, thrower) {
	var jobRequiredAuth = false;

	if (jobOpts.hasOwnProperty("S3_API_KEY") && jobOpts.hasOwnProperty("S3_API_TOKEN")) {
		// re authenticate for this job only
		aws.config.update({accessKeyId: jobOpts["S3_API_KEY"], secretAccessKey: jobOpts["S3_API_TOKEN"]});
		jobRequiredAuth = true;
	}

	// build the opts we pass
	var opts = {
		s3: new aws.S3(),
		bucket: jobOpts["BUCKET"] || global["BUCKET"] || "",
		interval: (jobOpts["FOREVER"] || global["FOREVER"] || false) ? jobOpts["FOREVER_INTERVAL_MS"] || global["FOREVER_INTERVAL_MS"] || false : false,
		error: thrower
	};

	// run the job
	require(job)(opts);

	if (jobRequiredAuth) {
		// re authenticate for global
		aws.config.update({accessKeyId: global["S3_API_KEY"], secretAccessKey: global["S3_API_TOKEN"]});
	}
}

module.exports = {
	runJob: runJob
};