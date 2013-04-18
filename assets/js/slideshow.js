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
			classTouch: 'touch',

			// Adjust timings
			delay: 3000,
			interval: 5000,
			time: 400,

			// Allow infinite looping, auto-play or carousel style?
			canLoop: true,
			isManual: false,
			isCarousel: true
		},

		element, slides, strip, markers, markerButtons, buttons, buttonPrev, buttonNext,
		timeoutStart, timeoutSlide, timeoutResize,
		isBusy, isPrev,

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
		isTouch = ('ontouchstart' in window) || navigator.msPointerEnabled || window.DocumentTouch && document instanceof DocumentTouch;

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
			if (isTouch)
			{
				config.canLoop = false;
				config.isCarousel = true;

				// Tell CSS touch is enabled
				element.addClass(config.classTouch);
			}

			initPositions();
			initEvents();
			initMarkers();

			updateNextPrev();
			updateMarkers();
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

		function next(event) { change(event, { isPrev: false }); }
		function prev(event) { change(event, { isPrev: true }); }

		function change(event, options)
		{
			var element = $(this),
				override = options && options.slide;

			// Remember direction for later
			isPrev = !!(options && options.isPrev);

			// Ignore when busy and if link is disabled
			if (!isBusy && (!event || event && !element.hasClass(config.classDisabled)))
			{
				// If slide clicked, jump to slide
				if (element.hasClass(config.classSlide))
				{
					if (element.is('a')) return;
					override = slides.index(element);
				}

				// Determine next slide
				setNextSlide(override);

				// Proceed if not current slide (allowed if touch, for swipe resistance)
				if (!self.slide.is(self.slideNext))
				{
					isBusy = true;
					stop();

					updateNextPrev();

					// Only transition where carousel is enabled and no CSS transitions
					transition((config.isCarousel)? config.time : 0, function() { transitionEnd(event); });
				}
			}

			// Start slideshow again?
			if (!event) start();

			// Only allow default events on current slide
			else if (!element.is(self.slide)) event.preventDefault();
		}

		function transition(time, complete, touchX)
		{
			// Move using CSS transition
			if (isCSS && config.isCarousel)
			{
				touchX = touchX || 0;

				// Callback when complete
				if (complete) strip.one(prefix.toLowerCase() + 'TransitionEnd transitionend', complete);

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

			updateMarkers();

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
				slide = (isPrev)? slide.prev('.' + classSlide) : slide.next('.' + classSlide);
				number = (isPrev)? number - 1 : number + 1;

				// Does it exist?
				if (!slide.length)
				{
					// If not looping, don't switch back to begining/end
					if (!config.canLoop) isPrev = !isPrev;

					// Wrap around to start/end
					slide = (isPrev)? slides.eq(count - 1) : slides.eq(0);
					number = (isPrev)? count : 1;
				}
			}

			self.slideNext = slide;
			self.number = number;
		}

		function isEnd()
		{
			return (isPrev && self.number === 1) || (!isPrev && self.number === slides.length);
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
					change(event, { slide: markerButtons.index(this) });
				}

				else
				{
					// Highlight the right marker
					markerButtons.removeAttr('class').eq(self.number - 1).addClass(config.classActive);
				}
			}
		}

		function updateNextPrev()
		{
			// Skip when looping is on or no buttons
			if (!config.canLoop && !isTouch)
			{
				buttons.removeClass(config.classDisabled);

				switch (self.number)
				{
					case 1:
					buttonPrev.addClass(config.classDisabled); break;

					case slides.length:
					buttonNext.addClass(config.classDisabled); break;
				}
			}
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
				markers = $('<div />').addClass(config.classMarkers).on('click touchend', 'button', updateMarkers);

				// Create marker links
				var i = slides.length;
				while (i--)
				{
					markers.prepend($('<button>' + (i + 1) + '</button>'));
				}

				// Find the new links, wire up, add
				markerButtons = markers.find('button');
				element.append(markers);
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
				buttonNext = element.find(config.next).on('click', next);
				buttonPrev = element.find(config.previous).on('click', prev);

				// Both buttons
				buttons = buttonPrev.add(buttonNext).css('display', 'block');
			}

			// Enable touch?
			else initTouch();
		}

		function initTouch()
		{
			var touch, delta, isScrolling,

			// Listen for these events
			eventsTouchStart = 'touchstart MSPointerDown',
			eventsTouchMove = 'touchmove MSPointerMove',
			eventsTouchEnd = 'touchend touchleave touchcancel MSPointerUp MSPointerOut';

			function begin(event)
			{
				var originalEvent = event.originalEvent,
					touches = originalEvent.touches && originalEvent.touches[0] || originalEvent;

				// Don't track touches on markers
				if (markers.has(event.target).length) return;

				// If busy, end transition now
				if (isBusy) transitionEnd();

				// Log touch start, empty delta
				touch = { x: touches.pageX || touches.screenX, y: touches.pageY || touches.screenY, time: +new Date() };
				delta = {};

				// Reset scroll detection
				isScrolling = undefined;

				element.on(eventsTouchMove, move);
				element.on(eventsTouchEnd, end);
			}

			function move(event)
			{
				var originalEvent = event.originalEvent,
					touches = originalEvent.touches && originalEvent.touches[0] || originalEvent;

				// Single touch point, no pinch-zoom
				if (touches.length > 1 || originalEvent.scale && originalEvent.scale !== 1) return;

				// Movement since touch
				delta = { x: (touches.pageX || touches.screenX) - touch.x, y: (touches.pageY || touches.screenY) - touch.y };

				// Are we scrolling? i.e. Moving up/down more than left/right
				if (typeof isScrolling === 'undefined')
				{
					isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y));
				}

				// If tracking touch, block scrolling
				if (!isScrolling)
				{
					event.preventDefault();

					stop();

					// Swiping forward or backwards?
					isPrev = delta.x > 0;

					// Add resistance to first and last slide
					if (isEnd()) delta.x = delta.x / (Math.abs(delta.x) / self.width + 1);

					// Override strip X relative to touch moved
					transition(0, undefined, (delta.x / self.width) * (100 / slides.length));
				}
			}

			function end()
			{
				if (!isScrolling)
				{
					var duration = +new Date() - touch.time,
						isEnough = duration < 250 && Math.abs(delta.x) > 20 || Math.abs(delta.x) > self.width / 3;

					// Progress to next slide
					if (isEnough && !isEnd()) change(undefined, { isPrev: isPrev });

					// Stay on slide
					else transition(config.time);
				}

				element.off(eventsTouchMove, move);
				element.off(eventsTouchEnd, end);
			}

			function click(event)
			{
				// Prevent click being registered after valid swipe
				if (!isScrolling && isBusy) event.preventDefault();
			}

			// Wait for touches
			element.on(eventsTouchStart, begin);
			element.on('click', click);

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
		self.next = next;
		self.prev = prev;

		self.transition = transition;
		self.getTransitionX = getTransitionX;
	};