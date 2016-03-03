/*
	Dependencies
	----------------------------------- */

	var autoprefixer = require('autoprefixer'),
		csswring = require('csswring'),
		del = require('del'),
		gulp = require('gulp'),
		perfectionist = require('perfectionist'),
		postcss = require('gulp-postcss'),
		rename = require('gulp-rename'),
		sass = require('gulp-sass'),
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

		gulp.src('./node_modules/jquery/dist/jquery.min.js')
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
	Minify JS
	----------------------------------- */

	gulp.task('uglify', ['clean'], function() {

		gulp.src('./src/js/simple-slideshow.js')
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
