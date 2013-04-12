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
		prefixes = ['ms', 'O', 'Moz', 'Webkit', ''],
		prefix = prefixes[prefixes.length], style,

/*
		Default configuration
		----------------------------------- */

		config =
		{
			next: 'button.next',
			previous: 'button.previous',

			// Classes
			classStrip: 'strip',
			classSlide: 'slide',
			classActive: 'sticky',
			classMarkers: 'markers',
			classDisabled: 'disabled',

			// Adjust timings
			delay: 3000,
			interval: 5000,
			time: 600,

			// Allow infinite looping, auto-play or carousel style?
			canLoop: true,
			isManual: true,
			isCarousel: true
		},

		element, slides, strip, markers, markerLinks,
		timeoutStart, timeoutSlide, timeoutResize,
		isBusy, isBack,

/*
		Other checks
		----------------------------------- */

		// CSS transitions?
		isCSS = (function()
		{
			var css = document.body.style, i = prefixes.length;

			// Check vendor prefixes
			while (i--) { if (typeof css[prefixes[i] + 'Transition'] === 'string') { prefix = prefixes[i]; break; } }
			return !!prefix;
		})(),

		// Touch events?
		isTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;

		// Override defaults with custom config?
		$.each(override, function(name, value) { config[name] = value; });

/*
		Start the slideshow
		----------------------------------- */

		function init()
		{
			element = $(config.slideshow);
			slides = element.find('.' + config.classSlide);
			strip = element.find('.' + config.classStrip);

			if (!element.length || slides.length < 2) return;

			// Expose slide strip's CSS
			style = strip[0].style;

			// Grab slide with active class
			self.slide = slides.filter('.' + config.classActive);
			self.number = slides.index(self.slide) + 1;

			// No? Grab 1st slide instead
			if (!self.slide.length)
			{
				self.number = 1;
				self.slide = slides.eq(self.number - 1).addClass(config.classActive);
			}

			// Touch requires carousel mode
			if (isTouch) config.isCarousel = true;

			initPositions();
			initEvents();
			initMarkers();

			updateNextPrev();
			updateWidth();

			// Start the slideshow timer
			timeoutStart = setTimeout(start, config.delay);
		}

		function start()
		{
			if (!config.isManual)
			{
				timeoutSlide = setTimeout(function() { change(); }, config.interval);
			}
		}

		function stop()
		{
			clearTimeout(timeoutStart);
			clearTimeout(timeoutSlide);
		}

/*
		Jump to next or specific slide
		----------------------------------- */

		function change(event, override)
		{
			isBack = !!(event && event.data && event.data.isBack);

			var slide = $(this);

			// Ignore when busy and if link is disabled
			if (!isBusy && (!event || event && !slide.hasClass(config.classDisabled)))
			{
				// If slide clicked, jump to slide
				if (slide.hasClass(config.classSlide))
				{
					if (slide.is('a')) return;
					override = slides.index(slide);
				}

				setNextSlide(override);

				// Proceed if not current slide
				if (!self.slide.is(self.slideNext))
				{
					isBusy = true;

					updateNextPrev();

					// Only transition where carousel is enabled and no CSS transitions
					transition((config.isCarousel)? config.time : 0, function() { transitionEnd(event); });
					stop();
				}
			}

			// Start slideshow again?
			if (!event) start();

			// Don't allow default event
			else event.preventDefault();
		}

		function transition(time, complete, touchX)
		{
			// Move using CSS transition
			if (isCSS && config.isCarousel)
			{
				touchX = touchX || 0;

				// Callback when complete
				strip.one(prefix.toLowerCase() + 'TransitionEnd transitionend', complete);

				// Move using CSS animation
				style[prefix + 'Transition'] = (time)? time / 1000 + 's' : '';
				style[prefix + 'Transform'] = 'translateX(' + (getTransitionX(null, true) - touchX) * -1 + '%)';
			}

			// Move using jQuery
			else strip.animate({ left: getTransitionX() + '%' }, time, complete);
		}

		function transitionEnd(event)
		{
			// Update sticky class
			slides.removeClass(config.classActive);
			self.slideNext.addClass(config.classActive);

			// This is now the current slide
			self.slide = self.slideNext;
			isBusy = false;

			// Zero transition time
			style[prefix + 'Transition'] = '';

			// Clicked, focus active slide
			if (event && event.type === 'click')
			{
				self.slide.focus();
			}

			// Run optional callback?
			if (callback) callback.call(self);
		}

		function getTransitionX(number, isRelative)
		{
			number = (number === 0 || number)? number : self.number - 1;

			// Present percentage relative to entire strip width?
			return (isRelative)? number * (100 / slides.length) : number * -100;
		}

		function setNextSlide(override)
		{
			var slide = self.slide, classSlide = config.classSlide,
				number = self.number, count = slides.length;

			// Prepare specific slide
			if (typeof override !== 'undefined')
			{
				slide = slides.eq(override);
				number = override + 1;
			}

			// Prepare next/previous
			else
			{
				slide = (isBack)? slide.prev('.' + classSlide) : slide.next('.' + classSlide);
				number = (isBack)? number - 1 : number + 1;

				// Does it exist?
				if (!slide.length)
				{
					// If not looping, don't switch back to begining/end
					if (!config.canLoop) isBack = !isBack;

					// Wrap around to start/end
					slide = (isBack)? slides.eq(count - 1) : slides.eq(0);
					number = (isBack)? count : 1;
				}
			}

			self.slideNext = slide;
			self.number = number;
		}

/*
		Update markers + buttons
		----------------------------------- */

		function updateMarkers(event)
		{
			if (markers)
			{
				// Clicked so update
				if (event)
				{
					// Change to the right slide
					change(event, markerLinks.index(this));
				}
	
				else
				{
					// Highlight the right marker
					markerLinks.removeAttr('class').eq(self.number - 1).addClass(config.classActive);
				}
			}
		}

		function updateNextPrev()
		{
			// Skip when looping is on or no buttons
			if (!config.canLoop)
			{
				self.previous.add(self.next).removeClass(config.classDisabled);
	
				switch (self.number)
				{
					case 1:
					self.previous.addClass(config.classDisabled); break;
	
					case slides.length:
					self.next.addClass(config.classDisabled); break;
				}
			}
			
			updateMarkers();
		}

/*
		Initial setup
		----------------------------------- */

		function initPositions()
		{
			strip.width((slides.length * 100) + '%');
			slides.width((100 / slides.length) + '%');
		
			// Loops slides, fix positions
			var i = slides.length, x;
			while (i--)
			{
				x = getTransitionX(i, true) + '%';
				slides.eq(i).css({ 'left': x, 'display': 'block' }).attr('tabindex', '-1');
			}

			// Set start position for slide strip
			transition(0);
		}

		function initMarkers()
		{
			// Skip when no marker config
			if (config.classMarkers)
			{
				// Add the markers
				markers = $('<ul />').addClass(config.classMarkers);
	
				// Create marker links
				var i = slides.length;
				while (i--)
				{
					markers.prepend($('<li><a href="#" role="button">' + (i + 1) + '</a></li>'));
				}
	
				// Find the new links, wire up
				markerLinks = markers.find('a').click(updateMarkers);
	
				// Add the markers, show
				element.append(markers);
				markers.show();
			}
		}

		function initEvents()
		{
			// listen for mouse movement
			element.mouseenter(stop).mouseleave(start);

			if (!isTouch)
			{
				// Allow slides to be clicked
				slides.click(change);

				// Wire up next/previous
				self.next = element.find(config.next).on('click', { isBack: false }, change).show();
				self.previous = element.find(config.previous).on('click', { isBack: true }, change).show();
			}

			// Enable touch?
			else initTouch();
		}

		function initTouch()
		{
			var touch, delta, isScrolling,

			// Track touches here
			selector = '.' + config.classStrip;

			function start(event)
			{
				if (isBusy) return;
			
				var originalEvent = event.originalEvent,
					touches = originalEvent.touches[0];

				// Log touch start, empty delta
				touch = { x: touches.pageX, y: touches.pageY, time: +new Date() };
				delta = {};

				// Reset scroll detection
				isScrolling = undefined;

				element.on('touchmove', selector, move);
				element.on('touchend touchcancel', selector, end);
			}
			
			function move(event)
			{
				var originalEvent = event.originalEvent,
					touches = originalEvent.touches[0];

				// Single touch point, no pinch-zoom
				if (touches.length > 1 || originalEvent.scale && originalEvent.scale !== 1) return;

				// Movement since touch
				delta = { x: touches.pageX - touch.x, y: touches.pageY - touch.y };

				// Are we scrolling? i.e. Moving up/down more than left/right
				if (typeof isScrolling === 'undefined')
				{
					isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y));
				}
				
				// Continue tracking touch but block scroll event
				if (!isScrolling) event.preventDefault();

				// Override strip X relative to touch moved
				transition(0, function() { }, (delta.x / self.width) * (100 / slides.length));
			}
			
			function end()
			{
				if (isScrolling) return;

				element.off('touchmove', selector);
				element.off('touchend touchcancel', selector);

				// TODO: Jump forward, back or stay on slide depending on swipe
				change();
			}
			
			function click(event)
			{
				// Prevent click being registered after valid swipe
				if (!isScrolling) event.preventDefault();
			}

			// Wait for touches
			element.on('touchstart', selector, start);
			element.on('click', selector, click);
			
			// Track slideshow size for movement calculations
			$(window).resize(updateWidth);
		}

		function updateWidth(event)
		{
			function set()
			{
				self.width = element.outerWidth();
			}
		
			if (timeoutResize) clearTimeout(timeoutResize);
			timeoutResize = setTimeout(set, (event)? 300 : 0);
		}

/*
		Expose internals
		----------------------------------- */

		self.element = element;
		self.strip = strip;
		self.slides = slides;

		self.init = init;
		self.start = start;
		self.stop = stop;
		self.change = change;
		self.transition = transition;
		self.getTransitionX = getTransitionX;
	};