/*
	Copyright (c) 2012 Colin Rotherham, http://colinr.com
	https://github.com/colinrotherham
*/

	var CRD = CRD || {};

	CRD.Slideshow = function(override, callback)
	{
		'use strict';

		var self = this,

		// Transition prefixes + default
		prefixes = ['o', 'ms', 'Moz', 'webkit', ''],
		prefix = prefixes[0],

		// Default config
		config =
		{
			buttonNext: 'button.next',
			buttonPrevious: 'button.previous',

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
			isCarousel: true,

			// Check support for CSS transitions
			isCSS: (function()
			{
				var css = document.body.style, i = prefixes.length;

				// Check vendor prefixes
				while (i--) { if (typeof css[prefixes[i] + 'Transition'] === 'string') { prefix = prefixes[i]; }}
				return !!prefix;
			})()
		},

		markers, markerLinks,
		timeoutStart, timeoutSlide,
		isBusy = false, isBackwards = false;

		// Override defaults with custom config?
		$.each(override, function(name, value) { config[name] = value; });

		// Start the slideshow
		function init()
		{
			self.element = $(config.slideshow);
			self.strip = self.element.find('.' + config.classStrip);
			self.slides = self.element.find('.' + config.classSlide);

			// Does this slideshow not exist or have only one slide?
			if (!self.element.length || self.slides.length < 2) { return; }

			// Find all the buttons
			self.buttonNext = self.element.find(config.buttonNext).show();
			self.buttonPrevious = self.element.find(config.buttonPrevious).show();

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
			timeoutStart = setTimeout(start, config.delay);
		}

		function start()
		{
			// Only re-start when automatic
			if (!config.isManual)
			{
				timeoutSlide = setTimeout(function() { change(); }, config.slideInterval);
			}
		}

		function stop()
		{
			clearTimeout(timeoutStart);
			clearTimeout(timeoutSlide);
		}

		function change(event, override)
		{
			isBackwards = !!(event && event.data && event.data.isBackwards);

			var element = $(this);

			// Ignore when busy and if link is disabled
			if (!isBusy && (!event || event && !element.hasClass(config.classDisabled)))
			{
				// If slide clicked, jump to slide
				if (element.hasClass(config.classSlide))
				{
					if (element.is('a')) { return; }
					override = self.slides.index(element);
				}

				updateNextSlide(override);

				// Proceed if not current slide
				if (!self.slide.is(self.slideNext))
				{
					// We are now busy
					isBusy = true;

					updateNextPrev();
					updateMarkers();

					// Only transition where carousel is enabled and no CSS transitions
					transition((config.isCarousel)? config.slideTransition : 0, function() { transitionEnd(event); });
					stop();
				}
			}

			// Start slideshow again?
			if (!event) { start(); }

			// Don't allow default event
			else { event.preventDefault(); }
		}

		function transition(time, complete)
		{
			self.strip.animate({ left: getTransitionX() + '%' }, (config.isCSS)? 0 : time);

			// Callback
			if (complete) { setTimeout(complete, time); }
		}

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

			// Run optional callback?
			if (callback) { callback.call(self); }
		}

		function getTransitionX()
		{
			return ((self.slideNumber - 1) * -100);
		}

		function updateNextSlide(override)
		{
			var slide = self.slide, slides = self.slides, classSlide = config.classSlide,
				number = self.slideNumber, count = slides.length;

			// Prepare specific slide
			if (typeof override !== 'undefined')
			{
				slide = slides.eq(override);
				number = override + 1;
			}

			// Prepare next/previous
			else
			{
				slide = (isBackwards)? slide.prev('.' + classSlide) : slide.next('.' + classSlide);
				number = (isBackwards)? number - 1 : number + 1;

				// Does it exist?
				if (!slide.length)
				{
					// If not looping, don't switch back to begining/end
					if (!config.canLoop) { isBackwards = !isBackwards; }

					// Wrap around to start/end
					slide = (isBackwards)? slides.eq(count - 1) : slides.eq(0);
					number = (isBackwards)? count : 1;
				}
			}

			self.slideNext = slide;
			self.slideNumber = number;
		}

		function updateMarkers(event)
		{
			if (markers)
			{
				var marker = self.slideNumber - 1;
	
				// Clicked so update
				if (event)
				{
					// Change to the right slide
					change(event, markerLinks.index(this));
				}
	
				else
				{
					// Highlight the right marker
					markerLinks.removeAttr('class').eq(marker).addClass(config.classActive);
				}
			}
		}

		function updateNextPrev()
		{
			// Skip when looping is on or no buttons
			if (!config.canLoop)
			{
				self.buttonPrevious.add(self.buttonNext).removeClass(config.classDisabled);
	
				switch (self.slideNumber)
				{
					case 1:
					self.buttonPrevious.addClass(config.classDisabled); break;
	
					case self.slides.length:
					self.buttonNext.addClass(config.classDisabled); break;
				}
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
				self.slides.eq(i).css({ 'left': x, 'display': 'block' }).attr('tabindex', '-1');
			}

			// Set start position for slide strip
			transition(0);

			// Enable for CSS transitions
			if (config.isCSS)
			{
				var css = self.strip.get(0).style;
				var rule = 'left ' + config.slideTransition / 1000 + 's';

				setTimeout(function() { css[prefix + 'Transition'] = rule; }, 0);
			}
		}

		function initMarkers()
		{
			// Skip when no marker config
			if (config.classMarkers)
			{
				// Add the markers
				markers = $('<ul />').addClass(config.classMarkers);
	
				// Create marker links
				var i = self.slides.length;
				while (i--)
				{
					markers.prepend($('<li><a href="#" role="button">' + (i + 1) + '</a></li>'));
				}
	
				// Find the new links, wire up
				markerLinks = markers.find('a').click(updateMarkers);
	
				// Add the markers, update
				self.element.append(markers);
				updateMarkers();
	
				// Show the markers
				markers.show();
			}
		}

		function initEvents()
		{
			// Listen for back/forward
			self.buttonNext.on('click', { isBackwards: false }, change);
			self.buttonPrevious.on('click', { isBackwards: true }, change);

			// Allow slides to be clicked, listen for movement
			self.slides.click(change);
			self.element.mouseenter(stop).mouseleave(start);
		}

		// Make internal methods available outside
		self.init = init;
		self.start = start;
		self.stop = stop;
		self.change = change;
		self.transition = transition;
		self.getTransitionX = getTransitionX;
	};