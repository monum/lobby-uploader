lobby-uploader
===============

> __This module is still under construction!__ Not yet ready for prime time.

This node module is responsible for querying data from various sources and uploading it to s3.
The general structure of this project is as follows:

+ `lib/` - where all the lobby-uploader inner workings live
+ `config/` - where all the configuration files should live
+ `jobs/` - where all the job modules should live
+ `index.js` - the entry point to the uploader. `npm start` runs this.

# Configuration

> Config files should live under `config/` within your forked version of this project. By default,
these files will be `gitignore`-d.

lobby-uploader uses [bengreenier/lconf](https://github.com/bengreenier/lconf) for configuration parsing,
and as such, it will support __yaml, json, and js__ configuration file types.

lobby-uploader attempts to parse `config/file.[json|yml|yaml|js]` in that order.

## Global Configuration

> This file should be  `config/global.[json|yml|yaml|js]`, and will be searched for in that order!

lobby-uploader uses the global configuration file to define configuration that applies to all sources. In general, this
is where s3 access credentials live, and other global flags (verbosity, use forever, etc).

Here's a good default:
```
{
	"S3_API_KEY": "",
	"S3_API_TOKEN": "",
	"BUCKET": "testing",
	"VERBOSE": true,
	"FOREVER": true,
	"CRON_INTERVAL": "*/5 * * * *"
}
```

> Global configuration parameters are case sensitive, and __can also be defined as environment variables__.

## Source Configuration

Each lobby-uploader source can __optionally__ have it's own unique config file under `config/`. See more about what's
needed for each source [below](#jobs). If an optional config file is to be defined, it should be named the same thing
as it's accompanying job file (with the exception of extension, of course), but inside the `config/` directory.

Any configuration file that's parsed for a source will override any of the global values, if values with the same key
are specified.

Here's an example with overrides:
```
{
	"VERBOSE": false,
	"FOREVER": true,
	"CRON_INTERVAL": "*/10 * * * *",
	"BUCKET": "my-bucket"
}
```

# Jobs

> Job files should live under `jobs/` within your forked version of this project. By default,
these files will be `gitignore`-d.

Each lobby-uploader source needs to have a job defined for it, so we know what to do when it's time to update.
The contents of each job should be pretty simple; each job needs to export a function, that is passed an options
object when it's called. The job should return without throwing any exceptions to indicate success.
The job should throw an `Error` with an appropriate message describing the failure, to indicate a failure.
Each job will be run as configured in global (`CRON_INTERVAL` key) or if overriden in `<job_name>.[json|yml|yaml|js]`.

Here's an example job:
```
var request = require('request'),
	uuid = require('uuid');
module.exports = function(opts) {
	
	// get a cat pic
	request.get("https://farm7.staticflickr.com/6100/6303228181_59371c29dc_q_d.jpg", function(e, r, b) {
		if (e || r.statusCode != 200) return opts.error("failed to get image");

		// upload it to s3
		opts.s3.upload({Bucket: opts.bucket, Body: b, Key: uuid.v4()+".jpg"}, function(e) {
			if (e) return opts.error(e); //for handling of async errors
		});
	});
};
```

## Opts

Whenever a job is executed, it is passed a single object, `opts`. Opts contains the following properties:

### [s3]

__Type:__ Object. Docs [here](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html).  
__Purpose:__ To allow jobs to access the authenticated s3 object, to do some operation against s3.  
__Details:__ __This object will already be authenticated!! No need to reauthenticate!!__

### [bucket]

__Type:__ String.  
__Purpose:__ Identifies the bucket that was set in configuration. This is set in global, and [optionally] overriden in `<job_name>.[json|yml|yaml|js]`.  
__Details:__ Used to tell a job which bucket to interact with. Note that we can't force a job to use this.

### [interval]

__Type:__ String.  
__Purpose:__ The cron interval that this job is run at.  
__Details:__ Useful if your job needs to be aware of how often its configured to run.

### [error]

__Type:__ Function.  
__Purpose:__ This function should be passed an error, if your job needs to fail asynchronously.  
__Details:__ Use this to fail asynchronously. If your job fails synchronously, you can simply throw the error instead.

# License

Licensed under the [MIT License](./LICENSE)
