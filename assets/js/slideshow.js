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
		prefix = prefixes[0],

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
		isBusy, isBack, style;

		// Override defaults with custom config?
		$.each(override, function(name, value) { config[name] = value; });
		
/*
		Start the slideshow
		----------------------------------- */

		function init()
		{
			var element = $(config.slideshow),
				slides = element.find('.' + config.classSlide),
				strip = element.find('.' + config.classStrip);

			if (!element.length || slides.length < 2) { return; }

			// Grab slide with active class
			self.slide = slides.filter('.' + config.classActive);
			self.number = slides.index(self.slide) + 1;

			// No? Grab 1st slide instead
			if (!self.slide.length)
			{
				self.number = 1;
				self.slide = slides.eq(self.number - 1).addClass(config.classActive);
			}

			// Share externally
			self.element = element;
			self.strip = strip;
			self.slides = slides;

			self.next = element.find(config.next).show();
			self.previous = element.find(config.previous).show();

			// Expose slide strip's CSS
			style = strip[0].style;

			initPositions();
			initEvents();
			initMarkers();
			updateNextPrev();

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
			if (!event) { start(); }

			// Don't allow default event
			else { event.preventDefault(); }
		}

		function transition(time, complete)
		{
			// Move using CSS transition
			if (config.isCSS)
			{
				style[prefix + 'Transition'] = (time)? time / 1000 + 's' : '';
				style[prefix + 'Transform'] = 'translateX(-' + getTransitionX(null, true) + '%)';
			}
			
			// Move using jQuery
			else { self.strip.animate({ left: getTransitionX() + '%' }, time); }

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

			// Zero transition time
			style[prefix + 'Transition'] = '';

			// Clicked, focus active slide
			if (event && event.type === 'click')
			{
				self.slide.focus();
			}

			// Run optional callback?
			if (callback) { callback.call(self); }
		}

		function getTransitionX(number, isRelative)
		{
			number = (number === 0 || number)? number : self.number - 1;

			// Present percentage relative to entire strip width?
			return (isRelative)? number * (100 / self.slides.length) : number * -100;
		}

		function setNextSlide(override)
		{
			var slide = self.slide, slides = self.slides, classSlide = config.classSlide,
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
					if (!config.canLoop) { isBack = !isBack; }

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
	
					case self.slides.length:
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
			self.strip.width((self.slides.length * 100) + '%');
			self.slides.width((100 / self.slides.length) + '%');
		
			// Loops slides, fix positions
			var i = self.slides.length, x;
			while (i--)
			{
				x = getTransitionX(i, true) + '%';
				self.slides.eq(i).css({ 'left': x, 'display': 'block' }).attr('tabindex', '-1');
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
				var i = self.slides.length;
				while (i--)
				{
					markers.prepend($('<li><a href="#" role="button">' + (i + 1) + '</a></li>'));
				}
	
				// Find the new links, wire up
				markerLinks = markers.find('a').click(updateMarkers);
	
				// Add the markers, show
				self.element.append(markers);
				markers.show();
			}
		}

		function initEvents()
		{
			self.next.on('click', { isBack: false }, change);
			self.previous.on('click', { isBack: true }, change);

			// Allow slides to be clicked, listen for movement
			self.slides.click(change);
			self.element.mouseenter(stop).mouseleave(start);
		}

/*
		Expose internal methods
		----------------------------------- */

		self.init = init;
		self.start = start;
		self.stop = stop;
		self.change = change;
		self.transition = transition;
		self.getTransitionX = getTransitionX;
	};