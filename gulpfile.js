/*
	Dependencies
	----------------------------------- */

	var autoprefixer = require('autoprefixer'),
		browserify = require('browserify'),
		buffer = require('vinyl-buffer'),
		csswring = require('csswring'),
		del = require('del'),
		gulp = require('gulp'),
		perfectionist = require('perfectionist'),
		plumber = require('gulp-plumber'),
		postcss = require('gulp-postcss'),
		rename = require('gulp-rename'),
		sass = require('gulp-sass'),
		source = require('vinyl-source-stream');
		uglify = require('gulp-uglify');


/*
	Shared options
	----------------------------------- */

	var options = {

		sass: {
			style: 'compressed',
			errLogToConsole: true
		},

		autoprefixer: {
			browsers: ['> 5%', 'IE >= 7', 'iOS >= 5.1'],
			remove: true
		},

		perfectionist: {
			cascade: false
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

		gulp.src('./src/js/*.js')
			.pipe(gulp.dest('./dist/assets/js'));

	});


/*
	Sass to CSS
	----------------------------------- */

	gulp.task('sass', ['clean'], function() {

		gulp.src('./src/scss/*.scss')

			// Convert to CSS
			.pipe(sass(options.sass).on('error', sass.logError))

			// Process PostCSS
			.pipe(postcss([
				autoprefixer(options.autoprefixer),
				csswring(options.csswring),
				perfectionist(options.perfectionist)
			]))

			// Rename, write to files
			.pipe(gulp.dest('./dist/assets/css'))
	});


/*
	Resolve dependencies, bundle
	----------------------------------- */

	gulp.task('bundle', ['clean'], function() {

		// Configure browserify
		var b = browserify({
			debug: true,
			entries: './src/js/touch-slider.js',
			standalone: 'TouchSlider'
		});

		return b.bundle()
			.pipe(plumber())

			// Load files
			.pipe(source('./src/js/touch-slider.js'))
			.pipe(buffer())

			// Uglify and switch to build location
			.pipe(uglify())
			.pipe(rename({
				dirname: './dist/assets/js/',
				suffix: '-bundle.min'
			}))

			// Write to files
			.pipe(gulp.dest('.'));
	});


/*
	Define tasks
	----------------------------------- */

	// Default
	gulp.task('default', ['copy', 'sass', 'bundle']);
