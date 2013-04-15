Slideshow
=========

How does it work?
-----------------

This slideshow will move between slides with the class "slide".

Features:

1. Change slide by pressing the Next/Previous buttons
2. Markers are added to show which slide is active\*
3. To add functionality, optionally run a callback after each transition

\* e.g. Perhaps style these as the little dots below the slideshow

When the script runs it has a three-second delay, then you'll get
a wait time of five seconds per slide and a 400ms transition time.

Customise as you like!


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

Alternatively, override the default configuration:

``` js
new CRD.Slideshow({ slideshow: '#slideshow', delay: 3000, slideInterval: 5000, slideTransition: 600, canLoop: true, isManual: false }).init();
```