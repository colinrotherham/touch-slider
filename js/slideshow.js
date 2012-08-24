/*
	Copyright (c) 2012 Colin Rotherham, http://colinr.com
	https://github.com/colinrotherham
*/

	var CRD = CRD || {};

	CRD.Slideshow = function(config, callback)
	{
		'use strict';
	
		var self = this;

		var markers, markerLinks;
		var buttons, buttonNext, buttonPrevious;
		var timeoutStart, timeoutSlide;

		// Not busy
		self.isBusy = false;
		
		// The current slide
		self.slideNumber = 1;

		self.init = function()
		{
			self.element = $(config.slideshow);

			// Does this slideshow exist?
			if (self.element.length)
			{
				self.slides = self.element.find('.' + config.classSlide);
	
				// Does it have more than one slide?
				if (self.slides.length > 1)
				{
					// Find all the buttons
					buttons = self.element.find(config.buttons);
					buttonNext = buttons.find(config.buttonNext);
					buttonPrevious = buttons.find(config.buttonPrevious);
		
					// Grab first slide
					self.slide = self.slides.eq(self.slideNumber - 1);

					self.initEvents();
					self.initMarkers();
					
					// Start the slideshow timer
					timeoutStart = setTimeout(self.start, config.delay);
				}
			}
		};

		self.start = function()
		{
			timeoutSlide = setTimeout(function() { self.change(); }, config.slideTime);
		};

		self.stop = function()
		{
			clearTimeout(timeoutStart);
			clearTimeout(timeoutSlide);
		};

		self.change = function(event, isPrevious, slideOverride)
		{
			isPrevious = !!isPrevious;

			// Ignore when busy
			if (!self.isBusy)
			{				
				var slideNext = self.getNextSlide(isPrevious, slideOverride);				
					
				// check if the same slide has been requested
				if (self.slide.is(slideNext))
				{
					return;
				}
				
				// We are now busy
				self.isBusy = true;
	
				self.updateMarkers();
				self.transition(slideNext);
	
				// Stop slideshow
				self.stop();				
			}

			// Start slideshow again?
			if (!event) { self.start(); }
			
			// Don't allow default event
			else { event.preventDefault(); }
			
			// Run callback
			self.callback();
		};
		
		self.callback = function()
		{
			if (typeof callback === 'function') { callback.apply(self); }
		};
		
		self.transition = function(slideNext)
		{
			// In comes the new slide
			slideNext.stop().css('z-index', 1).fadeTo(config.slideTimeFade, 1);

			// Out goes the old slide
			self.slide.stop().css('z-index', 0).fadeOut(config.slideTimeFade / 2, function()
			{
				// Update sticky class
				self.slides.removeClass(config.classActive);
				slideNext.addClass(config.classActive);

				// This is now the current slide
				self.slide = slideNext;
				self.isBusy = false;
			});
		};
		
		self.getNextSlide = function(isPrevious, slideOverride)
		{
			var slideNext;
		
			// Go to specific slide
			if (typeof slideOverride !== 'undefined')
			{
				slideNext = self.slides.eq(slideOverride);
				self.slideNumber = slideOverride + 1;
			}
			
			// Go to next/previous
			else
			{
				slideNext = (isPrevious)? self.slide.prev('.' + config.classSlide) : self.slide.next('.' + config.classSlide);
				self.slideNumber = (isPrevious)? self.slideNumber - 1 : self.slideNumber + 1;

				// Does it exist?
				if (!slideNext.length)
				{
					slideNext = (isPrevious)? self.slides.eq(self.slides.length - 1) : self.slides.eq(0);
					self.slideNumber = (isPrevious)? self.slides.length : 1;
				}
			}
			
			return slideNext;
		};
		
		self.updateMarkers = function(event)
		{
			if (markers)
			{
				var marker = self.slideNumber - 1;
			
				// Clicked so update
				if (event)
				{
					marker = markerLinks.index($(this));
	
					// Change to the right slide
					self.change(event, false, marker);
				}
	
				else
				{
					// Highlight the right marker
					markerLinks.removeAttr('class').eq(marker).addClass(config.classActive);
				}
			}
		};

		self.initMarkers = function()
		{
			if (!config.classMarkers)
			{
				return;
			}
			
			// Add the markers
			markers = $('<ul />').addClass(config.classMarkers);

			// Create marker links
			for (var i = 0, j = self.slides.length; i < j; i++)
			{
				markers.append($('<li><a href="#">' + (i + 1) + '</a></li>'));
			}

			// Find the new links
			markerLinks = markers.find('a');

			// Add the markers
			self.element.append(markers);
		
			// Update the markers
			self.updateMarkers();

			// Wire up and show the markers
			markerLinks.click(self.updateMarkers);
			markers.show();
		};
		
		self.initEvents = function()
		{
			// Listen for back/forward
			buttonNext.bind('click', function(event) { self.change(event, false); });
			buttonPrevious.bind('click', function(event) { self.change(event, true); });

			// Listen for mouse movement
			self.element.bind('mouseenter', self.stop);
			self.element.bind('mouseleave', self.start);
		};
	};