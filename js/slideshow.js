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
		var timeoutStart, timeoutSlide;
		var classDisabled = 'disabled';

		// Not busy
		self.isBusy = false;
		
		// Direction
		self.isBackwards = false;

		// The current slide
		self.slideNumber = 1;

		self.init = function()
		{
			self.element = $(config.slideshow);
			self.width = self.element.width();

			// Does this slideshow exist?
			if (self.element.length)
			{
				self.slides = self.element.find('.' + config.classSlide);

				// Does it have more than one slide?
				if (self.slides.length > 1)
				{
					// Find all the buttons
					if (config.buttons)
					{
						self.buttons = self.element.find(config.buttons);
						self.buttonNext = self.buttons.find(config.buttonNext);
						self.buttonPrevious = self.buttons.find(config.buttonPrevious);
					}
		
					// Grab first slide
					self.slide = self.slides.eq(self.slideNumber - 1);

					self.updateNextPrev();
					self.initEvents();
					self.initMarkers();

					// Start the slideshow timer
					timeoutStart = setTimeout(self.start, config.delay);
				}
			}
		};

		self.start = function()
		{
			// Only re-start when automatic
			if (!config.isManual)
			{
				timeoutSlide = setTimeout(function() { self.change(); }, config.slideInterval);
			}
		};

		self.stop = function()
		{
			clearTimeout(timeoutStart);
			clearTimeout(timeoutSlide);
		};

		self.change = function(event, isBackwards, slideOverride)
		{
			self.isBackwards = !!isBackwards;

			// Ignore when busy and if link is disabled
			if (!self.isBusy && (!event || event && !$(event.target).hasClass('disabled')))
			{
				self.getNextSlide(slideOverride);

				// Skip is same slide has been request
				if (self.slide.is(self.slideNext)) { return; }

				// We are now busy
				self.isBusy = true;

				self.updateNextPrev();
				self.updateMarkers();
				self.transition();

				self.stop();
			}

			// Start slideshow again?
			if (!event) { self.start(); }

			// Don't allow default event
			else { event.preventDefault(); }
		};

		self.callback = function()
		{
			if (typeof callback === 'function') { callback.apply(self); }
		};

		self.transition = function()
		{
			// In comes the new slide
			self.transitionNext();

			// Out goes the old slide
			self.transitionCurrent(function()
			{
				// Update sticky class
				self.slides.hide().removeClass(config.classActive);
				self.slideNext.show().addClass(config.classActive);

				// This is now the current slide
				self.slide = self.slideNext;
				self.isBusy = false;

				self.callback();
			});
		};

		self.transitionCurrent = function(complete)
		{
			var slide = self.slide, time = config.slideTransition;

			// Stop animation and lower
			self.slide.stop().css('z-index', 0);

			if (config.isCarousel)
			{
				slide.animate({ left: ((!self.isBackwards)? '-' : '') + self.width + 'px' }, time, complete);
			}

			else
			{
				time = time / 2;
				slide.fadeTo(time, 0, complete);
			}
		};

		self.transitionNext = function()
		{
			var slide = self.slideNext, time = config.slideTransition;

			// Stop animation and raise
			slide.stop().css('z-index', 1);
		
			if (config.isCarousel)
			{
				slide.css({ left: ((self.isBackwards)? '-' : '') + self.width + 'px' }).show().animate({ left: '0' }, time);
			}

			else
			{
				slide.fadeTo(time, 1);
			}
		};

		self.getNextSlide = function(slideOverride)
		{
			// Prepare specific slide
			if (typeof slideOverride !== 'undefined')
			{
				self.slideNext = self.slides.eq(slideOverride);
				self.slideNumber = slideOverride + 1;
			}

			// Prepare next/previous
			else
			{
				self.slideNext = (self.isBackwards)? self.slide.prev('.' + config.classSlide) : self.slide.next('.' + config.classSlide);
				self.slideNumber = (self.isBackwards)? self.slideNumber - 1 : self.slideNumber + 1;

				// Does it exist?
				if (!self.slideNext.length)
				{
					// If not looping, don't switch back to begining/end
					if (!config.canLoop) { self.isBackwards = !self.isBackwards; }

					self.slideNext = (self.isBackwards)? self.slides.eq(self.slides.length - 1) : self.slides.eq(0);
					self.slideNumber = (self.isBackwards)? self.slides.length : 1;
				}
			}
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
		
		self.updateNextPrev = function()
		{
			// Skip when looping is on or no buttons
			if (config.canLoop || !config.buttons) { return; }

			self.buttonPrevious.removeClass(classDisabled);
			self.buttonNext.removeClass(classDisabled);

			switch (self.slideNumber)
			{
				case 1:
				self.buttonPrevious.addClass(classDisabled); break;

				case self.slides.length:
				self.buttonNext.addClass(classDisabled); break;
			}
		};

		self.initMarkers = function()
		{
			// Skip when no marker config
			if (!config.classMarkers) { return; }

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
			if (config.buttons)
			{
				self.buttonNext.bind('click', function(event) { self.change(event, false); });
				self.buttonPrevious.bind('click', function(event) { self.change(event, true); });
			}

			// Listen for mouse movement
			self.element.bind('mouseenter', self.stop);
			self.element.bind('mouseleave', self.start);
		};
	};