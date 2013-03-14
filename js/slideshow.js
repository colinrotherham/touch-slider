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

			// Position all slides onto slide strip and display
			self.strip.width((self.slides.length * 100) + '%');
			self.slides.width((100 / self.slides.length) + '%');

			// Grab sticky slide
			self.slide = self.slides.filter('.' + config.classActive);
			self.slideNumber = self.slides.index(self.slide) + 1;

			// No active slide in markup
			if (!self.slide.length)
			{
				// Mark first slide as active
				self.slideNumber = 1;
				self.slide = self.slides.eq(self.slideNumber - 1).addClass(config.classActive);
			}

			self.updateNextPrev();
			self.initPositions();
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
				self.updateNextSlide(slideOverride);

				// Proceed if not current slide
				if (!self.slide.is(self.slideNext))
				{
					// We are now busy
					self.isBusy = true;

					self.updateNextPrev();
					self.updateMarkers();

					var time = (config.isCarousel)? config.slideTransition : 0;
					var complete = function() { self.transitionEnd(event); };

					self.transition(time, complete);
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

		self.transition = function(time, complete)
		{
			self.strip.animate({ left: self.getTransitionX() }, time, complete);
		};

		self.transitionEnd = function(event)
		{
			// Update sticky class
			self.slides.removeClass(config.classActive);
			self.slideNext.addClass(config.classActive);

			// This is now the current slide
			self.slide = self.slideNext;
			self.isBusy = false;

			// Clicked, focus active slide
			if (event && event.type === 'click')
			{
				self.slide.focus();
			}

			self.callback();
		};
		
		self.getTransitionX = function()
		{
			return ((self.slideNumber - 1) * -100) + '%';
		};

		self.updateNextSlide = function(slideOverride)
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
				self.slides.eq(i).css('left', x).css('display', 'block').attr('tabindex', '-1');
			}

			// Set start position for slide strip
			self.strip.css({ left: self.getTransitionX() });
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
				markers.prepend($('<li><a href="#" role="button">' + (length + 1) + '</a></li>'));
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