Touch Slider
============

Features
--------

1. Swipe or change slide by pressing the next/previous buttons
2. Markers below the slider show which slide is active\*
3. Fully responsive + flexible, no reliance on JavaScript to resize
4. GPU accelerated where available (i.e. CSS Translate/Transition)
5. Optionally provide a callback to run after each transition

\* e.g. Styled as the little dots, iOS-style

By default, the slider has a three-second delay, then you'll get
a wait time of five seconds per slide and a 400ms transition time.

Customise as you like!


Browser support
---------------

For modern browsers (e.g. Chrome, Safari, Firefox, Opera), Touch Slider uses super smooth GPU-accelerated CSS Translate + Transition.
Where support isn't available (e.g. IE7, IE8) jQuery animations are used instead.


Touch sliding
-------------

Touching to move slide (either flicking or following your finger) is available in Android 2.2+, iOS 5.1+, IE10+


Configuring the script
----------------------

Starting the slider (as shown in launcher.js):

``` js
new TouchSlider({ slider: '.slider' }).init();
```

Adjusting how many slides to step by when moving next/prev
``` js
new TouchSlider({ slider: '.slider', step: 2 }).init();
```

Alternatively, set a callback to run after each transition:

``` js
new TouchSlider({ slider: '.slider' }, function(event) { /* Do something */ }).init();
```

Alternatively, set a callback to run before and after each transition:

``` js
new TouchSlider({ slider: '.slider' }, function(event) { /* After transition */ }, function(event) { /* Before transition */ }).init();
```

Alternatively, override the default configuration:

``` js
new TouchSlider({ slider: '.slider', delay: 3000, interval: 5000, time: 600, canLoop: true, isManual: false }).init();
```

…or override timings of an already-running slider:

``` js
var slider = new TouchSlider({ slider: '.slider' });

slider.init();
slider.updateConfig({ delay: 3000, interval: 5000, time: 600 });
```

CommonJS
--------

Instead, Touch Slider can be installed via `npm install touch-slider` and used as a module:

``` js
var slider = new (require('touch-slider'))({ slider: '.slider' });

slider.init();
slider.updateConfig({ delay: 3000, interval: 5000, time: 600 });
```
