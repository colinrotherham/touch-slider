Slideshow
=========

How does it work?
-----------------

This slideshow will fade in/out child tags with the class "slide".

Features:

1. Next/Previous buttons are wired up to change slide
2. Markers are added to show which slide is active\*
3. A callback function can be run to add functionality

\* i.e. Style these as the little dots below a slideshow

When the script runs it starts a three-second timeout, then you'll get
a wait time of five seconds per slide and a 600ms transition time.

Customise as you like!


Configuring the script
----------------------

Take a look at the sample configuration in launcher.js.

The 2nd parameter (the callback) is completely optional.

``` js
var slideshow = new CRD.Slideshow(config, callback);
```