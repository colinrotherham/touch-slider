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

		self.isBusy = false;
		self.isBackwards = false;
		self.slideNumber = 1;

		self.init = function()
		{
			self.element = $(config.slideshow);

			// Does this slideshow exist?
			if (!self.element.length) { return; }

			self.strip = self.element.find('.' + config.classStrip);
			self.slides = self.element.find('.' + config.classSlide);

			// Does it have more than one slide?
			if (self.slides.length < 2) { return; }

			// Find all the buttons
			if (config.buttons)
			{
				self.buttons = self.element.find(config.buttons);
				self.buttonNext = self.buttons.find(config.buttonNext);
				self.buttonPrevious = self.buttons.find(config.buttonPrevious);
			}

			// Grab current slide
			self.slide = self.slides.eq(self.slideNumber - 1);

			// Load all slides onto slide strip, position and display
			self.strip.width((self.slides.length * 100) + '%');
			self.slides.width((100 / self.slides.length) + '%');

			self.initPositions();
			self.updateNextPrev();
			self.initEvents();
			self.initMarkers();

			// Start the slideshow timer
			timeoutStart = setTimeout(self.start, config.delay);
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

		self.change = function(event, slideOverride)
		{
			self.isBackwards = !!(event && event.data && event.data.isBackwards);

			// Ignore when busy and if link is disabled
			if (!self.isBusy && (!event || event && !$(event.target).hasClass('disabled')))
			{
				self.getNextSlide(slideOverride);

				// Proceed if not current slide
				if (!self.slide.is(self.slideNext))
				{
					// We are now busy
					self.isBusy = true;

					self.updateNextPrev();
					self.updateMarkers();
					self.transition();

					self.stop();
				}
			}

			// Start slideshow again?
			if (!event) { self.start(); }

			// Don't allow default event
			else { event.preventDefault(); }
		};

		self.callback = function()
		{
			if (typeof callback === 'function') { callback.call(self); }
		};

		self.transition = function()
		{
			var x = ((self.slideNumber - 1) * -100) + '%';
			var time = (config.isCarousel)? config.slideTransition : 0;
			
			self.strip.animate({ left: x }, time, self.transitionEnd);
		};

		self.transitionEnd = function()
		{
			// Update sticky class
			self.slides.removeClass(config.classActive);
			self.slideNext.addClass(config.classActive);

			// This is now the current slide
			self.slide = self.slideNext;
			self.isBusy = false;

			self.callback();
		}

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
			if (!markers) { return; }

			var marker = self.slideNumber - 1;

			// Clicked so update
			if (event)
			{
				// Change to the right slide
				self.change(event, markerLinks.index(this));
			}

			else
			{
				// Highlight the right marker
				markerLinks.removeAttr('class').eq(marker).addClass(config.classActive);
			}
		};

		self.updateNextPrev = function()
		{
			// Skip when looping is on or no buttons
			if (config.canLoop || !config.buttons) { return; }

			self.buttonPrevious.removeClass(config.classDisabled);
			self.buttonNext.removeClass(config.classDisabled);

			switch (self.slideNumber)
			{
				case 1:
				self.buttonPrevious.addClass(config.classDisabled); break;

				case self.slides.length:
				self.buttonNext.addClass(config.classDisabled); break;
			}
		};

		self.initPositions = function()
		{
			// Loops slides, fix positions
			var i = self.slides.length, x;
			while (i--)
			{
				// Position each slide one after the other
				x = i * (100 / self.slides.length) + '%';
				self.slides.eq(i).css('left', x).css('display', 'block');
			}
		};

		self.initMarkers = function()
		{
			// Skip when no marker config
			if (!config.classMarkers) { return; }

			// Add the markers
			markers = $('<ul />').addClass(config.classMarkers);

			// Create marker links
			var length = self.slides.length;
			while (length--)
			{
				markers.prepend($('<li><a href="#">' + (length + 1) + '</a></li>'));
			}

			// Find the new links
			markerLinks = markers.find('a');

			// Add the markers, update
			self.element.append(markers);
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
				self.buttonNext.bind('click', { isBackwards: false }, self.change);
				self.buttonPrevious.bind('click', { isBackwards: true }, self.change);
			}

			// Listen for mouse movement
			self.element.bind('mouseenter', self.stop);
			self.element.bind('mouseleave', self.start);
		};
	};