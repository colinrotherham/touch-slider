/*
	Copyright (c) 2012 Colin Rotherham, http://colinr.com
	https://github.com/colinrotherham
*/

	(function()
	{
		// This is a sample configuration
		var config =
		{
			slideshow: '#slideshow',
			buttons: 'ul.buttons',
			buttonNext: 'li.next a',
			buttonPrevious: 'li.previous a',

			// Classes
			classStrip: 'strip',
			classSlide: 'slide',
			classActive: 'sticky',
			classMarkers: 'markers',
			classDisabled: 'disabled',

			// Adjust timings
			delay: 3000,
			slideInterval: 5000,
			slideTransition: 600,

			// Allow infinite looping, auto-play or carousel style?
			canLoop: true,
			isManual: false,
			isCarousel: true
		};

		// Run this when the active slide changes
		var callback = function()
		{
			if (this.slideNumber === 3 && window.console)
			{
				console.log("This is pretty special, I'm slide number three");
			}
		};

		// Create and initialise the slideshow
		var slideshow = new CRD.Slideshow(config, callback);
		slideshow.init();
	})();