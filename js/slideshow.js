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
		var timeoutStart, timeoutSlide, isBusy = false, isBackwards = false;

		self.init = function()
		{
			self.element = $(config.slideshow);
			self.strip = self.element.find('.' + config.classStrip);
			self.slides = self.element.find('.' + config.classSlide);

			// Does this slideshow not exist or have only one slide?
			if (!self.element.length || self.slides.length < 2) { return; }

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

			updateNextPrev();
			initPositions();
			initEvents();
			initMarkers();

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

		self.change = function(event, override)
		{
			isBackwards = !!(event && event.data && event.data.isBackwards);

			// Ignore when busy and if link is disabled
			if (!isBusy && (!event || event && !$(event.target).hasClass('disabled')))
			{
				updateNextSlide(override);

				// Proceed if not current slide
				if (!self.slide.is(self.slideNext))
				{
					// We are now busy
					isBusy = true;

					updateNextPrev();
					updateMarkers();

					var time = (config.isCarousel)? config.slideTransition : 0;
					var complete = function() { transitionEnd(event); };

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
			self.strip.animate({ left: getTransitionX() }, time, complete);
		};

		function transitionEnd(event)
		{
			// Update sticky class
			self.slides.removeClass(config.classActive);
			self.slideNext.addClass(config.classActive);

			// This is now the current slide
			self.slide = self.slideNext;
			isBusy = false;

			// Clicked, focus active slide
			if (event && event.type === 'click')
			{
				self.slide.focus();
			}

			self.callback();
		}

		function getTransitionX()
		{
			return ((self.slideNumber - 1) * -100) + '%';
		}

		function updateNextSlide(override)
		{
			var slide, number;
			var count = self.slides.length;

			// Prepare specific slide
			if (typeof override !== 'undefined')
			{
				slide = self.slides.eq(override);
				number = override + 1;
			}

			// Prepare next/previous
			else
			{
				slide = (isBackwards)? self.slide.prev('.' + config.classSlide) : self.slide.next('.' + config.classSlide);
				number = (isBackwards)? number - 1 : number + 1;

				// Does it exist?
				if (!slide.length)
				{
					// If not looping, don't switch back to begining/end
					if (!config.canLoop) { isBackwards = !isBackwards; }

					// Wrap around to start/end
					slide = (isBackwards)? self.slides.eq(count - 1) : self.slides.eq(0);
					number = (isBackwards)? count : 1;
				}
			}

			self.slideNext = slide;
			self.slideNumber = number;
		}

		function updateMarkers(event)
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
		}

		function updateNextPrev()
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
		}

		function initPositions()
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
			self.strip.css({ left: getTransitionX() });
		}

		function initMarkers()
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
			updateMarkers();

			// Wire up and show the markers
			markerLinks.click(updateMarkers);
			markers.show();
		}

		function initEvents()
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
		}
	};