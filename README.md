Simple Slideshow
================

Features
--------

1. Swipe or change slide by pressing the next/previous buttons
2. Markers below the slideshow show which slide is active\*
3. Fully responsive + flexible, no reliance on JavaScript to resize
4. GPU accelerated where available (i.e. CSS Translate/Transition)
5. Otionally provide a callback to run after each transition

\* e.g. Styled as the little dots, iOS-style

By default, the slideshow has a three-second delay, then you'll get
a wait time of five seconds per slide and a 400ms transition time.

Customise as you like!


Browser support
---------------

For modern browsers (e.g. Chrome, Safari, Firefox, Opera), Simple Slideshow uses super smooth GPU-accelerated CSS Translate + Transition.
Where support isn't available (e.g. IE7, IE8) jQuery animations are used instead.


Touch sliding
-------------

Touching to move slide (either flicking or following your finger) is available in Android 2.2+, iOS 5.1+, IE10+


Configuring the script
----------------------

Starting the slideshow (as shown in launcher.js):

``` js
new CRD.Slideshow({ slideshow: '#slideshow' }).init();
```

Alternatively, set a callback to run after each transition:

``` js
new CRD.Slideshow({ slideshow: '#slideshow' }, function() { /* Do something */ }).init();
```

Alternatively, set a callback to run before and after each transition:

``` js
new CRD.Slideshow({ slideshow: '#slideshow' }, function() { /* After transition */ }, function() { /* Before transition */ }).init();
```

Alternatively, override the default configuration:

``` js
new CRD.Slideshow({ slideshow: '#slideshow', delay: 3000, interval: 5000, time: 600, canLoop: true, isManual: false }).init();
```
