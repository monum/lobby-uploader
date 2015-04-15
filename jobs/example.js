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