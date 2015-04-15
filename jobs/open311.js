var request = require('request');

module.exports = function(opts) {
	
	// get a cat pic
	request.get("https://mayors24.cityofboston.gov/open311/v2/requests.json?extensions=v1&status=open", function(e, r, b) {
		if (e || r.statusCode != 200) return opts.error("failed to get open311 data");

		// parse the payload
		var o = JSON.parse(b);

		// do some processing on o

		// upload o to s3
		opts.s3.upload({Bucket: opts.bucket, Body: JSON.stringify(o), Key: "open311-latest.json"}, function(e) {
			if (e) opts.error(e); //for handling of async errors
		});
	});
};