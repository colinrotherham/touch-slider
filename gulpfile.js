/*
	Dependencies
	----------------------------------- */

	var gulp = require('gulp'),
		sass = require('gulp-sass'),
		uglify = require('gulp-uglify'),
		prefix = require('gulp-autoprefixer'),
		minifyCSS = require('gulp-minify-css'),
		beautifyCSS = require('gulp-cssbeautify'),
		rename = require('gulp-rename'),
		del = require('del');

/*
	Shared options
	----------------------------------- */

	var options = {

		sass: {
			style: 'compressed',
			errLogToConsole: true
		},

		prefix: {
			browsers: ['> 5%', 'IE >= 7', 'iOS >= 5.1'],
			cascade: false,
			remove: true
		},

		minifyCSS: {
			keepSpecialComments: false
		},

		beautifyCSS: {
			indent: '	',
			autosemicolon: true
		}
	};


/*
	Clean output directory
	----------------------------------- */

	gulp.task('clean', function(callback) {
		return del(['./dist/assets/js/*', './dist/assets/css/*'], callback);
	});


/*
	Copy other assets (e.g. jQuery)
	----------------------------------- */

	gulp.task('copy', function(callback) {

		gulp.src('./node_modules/jquery/dist/jquery.min.js')
			.pipe(gulp.dest('./dist/assets/js'));
	});


/*
	Sass to CSS
	----------------------------------- */

	gulp.task('sass', ['clean'], function() {

		gulp.src('./src/scss/*.scss')
			.pipe(sass(options.sass))
			.on('error', console.error.bind(console))
			.pipe(prefix(options.prefix))
			.pipe(minifyCSS(options.minifyCSS))
			.pipe(beautifyCSS(options.beautifyCSS))
			.pipe(gulp.dest('./dist/assets/css'));
	});


/*
	Minify JS
	----------------------------------- */

	gulp.task('uglify', ['clean'], function() {

		gulp.src('./src/js/slideshow.js')
			.pipe(uglify())
			.on('error', console.error.bind(console))
			.pipe(rename({ suffix: '.min' }))
			.pipe(gulp.dest('./dist/assets/js'));
	});


/*
	Define tasks
	----------------------------------- */

	// Default
	gulp.task('default', ['copy', 'sass', 'uglify']);