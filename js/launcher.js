/*
	Copyright (c) 2012 Colin Rotherham, http://colinr.com
	https://github.com/colinrotherham
*/

	(function()
	{
		// This is a sample configuration
		var config =
		{
			'slideshow': '#slideshow',
			'buttons': 'ul.buttons',
			'buttonNext': 'li.next a',
			'buttonPrevious': 'li.previous a',
	
			// classes
			'classSlide': 'slide',
			'classActive': 'sticky',
			'classMarkers': 'markers',
	
			// adjust timings
			'delay': 3000,
			'slideTime': 5000,
			'slideTimeFade': 600
		};
		
		// Run this when the active slide changes
		var callback = function()
		{
			if (this.slideNumber === 3)
			{
				console.log("This is pretty special, I'm slide number three");
			}
		};
	
		// Create and initialise the slideshow
		var slideshow = new CRD.Slideshow(config, callback);
		slideshow.init();
	})();