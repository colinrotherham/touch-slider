/*
	Copyright (c) 2012 Colin Rotherham, http://colinr.com
	https://github.com/colinrotherham
*/

	var CRD = CRD || {};

	CRD.Slideshow = function(userConfig, callback)
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
		isBusy, isOffset, isScrolling, isPrev, count,

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
		$.each(userConfig, function(name, value) { config[name] = value; });

/*
		Start the slideshow
		----------------------------------- */

		function init()
		{
			element = $(config.slideshow);
			slides = element.find('.' + config.classSlide);
			strip = element.find('.' + config.classStrip);

			// Number of slides
			count = slides.length;

			if (!element.length || count < 2) return;

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

			// Set widths
			strip.width((count * 100) + '%');
			slides.width((100 / count) + '%');

			// Kick off touch support
			if (isTouch) initTouch();

			initEvents();
			initMarkers();

			// Set start positions
			updateNextPrev();
			initPositions();
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
				index = options && options.slide;

			// Ignore when busy
			if (!isBusy)
			{
				// Remember direction for later
				isPrev = options && options.isPrev;

				// If slide clicked, jump to slide
				if (element.hasClass(config.classSlide))
				{
					if (element.is('a')) return;
					index = slides.index(element);
				}

				// Determine next slide
				setNextSlide(index);

				// Proceed if not current slide
				if (!self.slide.is(self.slideNext))
				{
					isBusy = true;
					stop();

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
			// Wrap around or go to next/prev slide
			var position = (config.canLoop && time)? setPositionOffset() : self.number;

			// Move using CSS transition
			if (isCSS && config.isCarousel)
			{
				touchX = touchX || 0;

				// Callback when complete
				if (complete) strip.one(prefix.toLowerCase() + 'TransitionEnd transitionend', complete);

				// Move using CSS animation
				style[prefix + 'Transition'] = (time)? time / 1000 + 's' : '';
				style[prefix + 'Transform'] = 'translateX(' + (getTransitionX(position - 1, true) - touchX) * -1 + '%)';
			}

			// Move using jQuery
			else strip.stop(true, true).animate({ left: getTransitionX(position - 1) + '%' }, time, complete);
		}

		function transitionEnd(event)
		{
			// This is now the current slide
			self.slide = self.slideNext;
			isBusy = false;

			// Update sticky class
			slides.removeClass(config.classActive);
			self.slide.addClass(config.classActive);

			// Zero transition time
			style[prefix + 'Transition'] = '';

			// If temporarily offset, restore position
			if (config.canLoop && isOffset)
			{
				// Finished, remove offset
				isOffset = false;

				initPositions();
			}

			updateNextPrev();

			// Clicked, focus active slide
			if (event && event.type === 'click')
				self.slide.focus();

			// Run optional callback?
			if (callback) callback.call(self);
		}

		function getTransitionX(number, isRelative)
		{
			// Present percentage relative to entire strip width?
			return (isRelative)? number * (100 / count) : number * -100;
		}

		function setNextSlide(index)
		{
			var number = self.number;

			// Prepare specific slide by index
			if (typeof index !== 'undefined')
			{
				isPrev = (index < number)? true : false;
				number = index + 1;
			}

			// Prepare next
			else if (!isPrev)
			{
				number = (number === count)? ((config.canLoop)? 1 : count) : number + 1;
			}

			// Prepare next
			else
			{
				number = (number === 1)? ((config.canLoop)? count : 1) : number - 1;
			}

			self.slideNext = slides.eq(number - 1);
			self.number = number;
		}

		function isEnd()
		{
			return (isPrev && self.number === 1) || (!isPrev && self.number === count);
		}


/*
		Set slide numbers + positions
		----------------------------------- */

		function setPosition(slide, x)
		{
			slide.css({ 'left': x, 'display': 'block' }).attr('tabindex', '-1').data('x', x);
		}

		function setPositionOffset()
		{
			var position = self.number, slide, x;

			// Looping from the end to the start
			if (!isPrev && position === 1)
			{
				position = count + 1;
				slide = slides.eq(0);
			}

			// Looping from the start to the end
			else if (isPrev && position === count)
			{
				position = 0;
				slide = slides.eq(count - 1);
			}

			// Offset this slide
			if (slide)
			{
				x = getTransitionX(position - 1, true);
				slide.css('left', x + '%').data('x', x);

				// Mark as temporarily offset
				isOffset = true;
			}

			return position;
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
			var button, buttonClass = config.classDisabled;
		
			// Skip when looping is on
			if (!config.canLoop)
			{
				buttons.removeClass(buttonClass);

				switch (self.number)
				{
					case 1:
					button = buttonPrev; break;

					case count:
					button = buttonNext; break;
				}

				if (button) button.addClass(buttonClass);
			}

			updateMarkers();
		}

/*
		Initial setup
		----------------------------------- */

		function initPositions()
		{
			var i = count, xOld, xNew, slide;

			// Loops slides, fix positions
			while (i--)
			{
				slide = slides.eq(i);

				xOld = slide.data('x');
				xNew = getTransitionX(i, true) + '%';

				// Only set position if it's changed
				if (xNew !== xOld) setPosition(slide, xNew);
			}

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
				var i = count;
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
			// Allow slides to be clicked
			slides.on('click touchend', change);

			// Listen for mouse movement
			element.mouseenter(stop).mouseleave(start);

			// Wire up next/previous
			buttonNext = element.find(config.next).on('click touchend', next);
			buttonPrev = element.find(config.previous).on('click touchend', prev);

			// Both buttons
			buttons = buttonPrev.add(buttonNext);

			// Start the slideshow timer
			timeoutStart = setTimeout(start, config.delay);
		}

		function initTouch()
		{
			var touch, delta,

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
				if (touches.length > 1 || originalEvent.scale && originalEvent.scale !== 1)
					return;

				// Movement since touch
				delta = { x: (touches.pageX || touches.screenX) - touch.x, y: (touches.pageY || touches.screenY) - touch.y };

				// Are we scrolling? i.e. Moving up/down more than left/right
				if (typeof isScrolling === 'undefined')
					isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y));

				// If tracking touch, block scrolling
				if (!isScrolling)
				{
					event.preventDefault();
					stop();

					// Swiping forward or backwards?
					isPrev = delta.x > 0;

					// Mark as busy
					isBusy = true;

					// Add resistance to first and last slide
					if (!config.canLoop && isEnd()) delta.x = delta.x / (Math.abs(delta.x) / self.width + 1);

					// Override strip X relative to touch moved
					transition(0, undefined, (delta.x / self.width) * (100 / count));
				}
			}

			function end()
			{
				if (!isScrolling)
				{
					var duration = +new Date() - touch.time, distance = Math.abs(delta.x),
						isEnough = duration < 250 && distance > 20 || distance > self.width / 3;

					// No longer busy
					isBusy = false;

					// Progress to next slide
					if (isEnough && !isEnd())
						change(undefined, { isPrev: isPrev });

					// Stay on slide
					else if (distance > 0)
						transition(config.time);
				}

				element.off(eventsTouchMove, move);
				element.off(eventsTouchEnd, end);
			}

			function click(event)
			{
				// Prevent click being registered after valid swipe
				if (!isScrolling && isBusy) event.preventDefault();
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

			// For smooth animation, touch must use carousel mode
			config.isCarousel = true;
			config.canLoop = false;

			// Wait for touches + tell CSS touch is enabled
			element.on(eventsTouchStart, begin).on('click', click).addClass(config.classTouch);

			// Track slideshow size for movement calculations
			updateWidth();
			$(window).resize(updateWidth);
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