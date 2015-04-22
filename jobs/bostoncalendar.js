var ical = require('ical');

module.exports = function(opts) {
	
	// get ical data for boston calendar [url is from http://cityofboston.gov/calendar#ical]
	ical.fromURL("http://www.trumba.com/calendars/cob-calendar.ics", {}, function(e, cal) {
		if (e) return opts.error("failed to get boston calendar data");

		// used to see if events are <3days from happening
		var threeDaysAway = new Date();
		threeDaysAway.setDate(threeDaysAway.getDate() + 3);

		// we'll push all relevant events into here
		var cityHallEvents = [];

		// iterate all events
		for (var k in cal) {
			if (cal.hasOwnProperty(k)) {
				var evt = cal[k];

				// the event starts and stops in the next 3 days && is @ city hall
				if (threeDaysAway >= evt.start &&
					threeDaysAway >= evt.end &&
					typeof(evt.location) === "string" &&
					evt.location.toLowerCase().indexOf("city hall") > -1)
				{
					// store it
					cityHallEvents.push(evt);
				}
			}
		}

		// upload cityHallEvents to s3
		opts.s3.upload({
			Bucket: opts.bucket,
			Body: JSON.stringify(cityHallEvents),
			Key: "bostoncalendar-latest.json",
			ACL: "public-read",
			ContentType: "application/json"
		}, function(e) {
			if (e) opts.error(e); //for handling of async errors
		});
	});
};