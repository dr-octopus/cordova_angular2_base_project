const del = require('del');
const gulp = require('gulp');
const concat = require('gulp-concat');
const liveServer = require('gulp-live-server');
const plumber = require('gulp-plumber');
const runSequence = require('run-sequence');
const sourcemaps = require('gulp-sourcemaps');
const sysBuilder = require('systemjs-builder');
const tslint = require('gulp-tslint');
const tsc = require('gulp-typescript');
const uglify = require('gulp-uglify');
const tsconfig = require('tsconfig-glob');

const appDir = 'src';
const tscConfig = require('./tsconfig.json');
const resourcesDir = 'mobile/www'

// Clean the js distribution directory
gulp.task('clean:dist:js', function () {
  return del(resourcesDir + '/dist/js/*');
});

// Clean library directory
gulp.task('clean:lib', function () {
  return del(resourcesDir + '/lib/**/*');
});

gulp.task('clean:app:js', function() {
  return del(resourcesDir + '/app/**/*')
});

// Lint Typescript
gulp.task('lint:ts', function() {
  return gulp
    .src([appDir + '/**/*.ts'])
    .pipe(tslint({
        formatter: "verbose"
    }))
    .pipe(tslint.report({ emitError: false }));
});

// Compile TypeScript to JS
// NOT (YET) USED
gulp.task('compile:ts', function () {
  return gulp
    .src(tscConfig.filesGlob)
    .pipe(plumber({
      errorHandler: function (err) {
        console.error('>>> [tsc] Typescript compilation failed'.bold.green);
        this.emit('end');
      }}))
    .pipe(sourcemaps.init())
    .pipe(tsc(tscConfig.compilerOptions))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(resourcesDir + '/dist'));
});

// Generate systemjs-based builds
// NOT (YET) USED
gulp.task('bundle:js', function() {
  var builder = new sysBuilder(resourcesDir, './system.config.js');
  return builder.buildStatic('app', resourcesDir + '/lib/js/app.min.js')
    .then(function () {
      return del([resourcesDir + '/dist/js/**/*', '!' + resourcesDir + '/dist/js/app.min.js']);
    })
    .catch(function(err) {
      console.error('>>> [systemjs-builder] Bundling failed'.bold.green, err);
    });
});

// Minify JS bundle
// NOT (YET) USED
gulp.task('minify:js', function() {
  return gulp
    .src(resourcesDir + '/dist/js/app.min.js')
    .pipe(uglify())
    .pipe(gulp.dest(resourcesDir + '/dist/js'));
});


// Copy dependencies
gulp.task('copy:libs', function() {
  // concatenate non-angular2 libs, shims & systemjs-config
  gulp.src([
    'node_modules/reflect-metadata/Reflect.js',
    'node_modules/zone.js/dist/zone.js',
    'node_modules/systemjs/dist/system.src.js',
    'systemjs.config.js'
  ])
    .pipe(concat('vendors.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(resourcesDir + '/lib/js'));
  
  // copy source maps
  gulp.src([
    'node_modules/reflect-metadata/Reflect.js.map',
    'node_modules/systemjs/dist/system.src.js.map'
  ])
    .pipe(gulp.dest(resourcesDir + '/lib/js'));

  gulp.src(['node_modules/rxjs/**/*'])
    .pipe(gulp.dest(resourcesDir + '/lib/js/rxjs'));

  gulp.src(['node_modules/angular-in-memory-web-api/**/*'])
    .pipe(gulp.dest(resourcesDir + '/lib/js/angular2/angular-in-memory-web-api'));

  return gulp.src(['node_modules/@angular/**/*'])
    .pipe(gulp.dest(resourcesDir + '/lib/js/angular2'));
});

// Update the tsconfig files based on the glob pattern
// NOT USED
gulp.task('tsconfig-glob', function () {
  return tsconfig({
    configPath: '.',
    indent: 2
  });
});

// Watch src files for changes, then trigger recompilation
//gulp.task('watch:app', function() {
//  gulp.watch(appDir + '/**/*.ts', ['scripts']);
//  gulp.watch(appDir + '/**/*.scss', ['styles']);
//});

gulp.task('lint', ['lint:ts']);

gulp.task('clean', ['clean:dist:js', 'clean:lib', 'clean:app:js']);

gulp.task('copy', function(callback) {
  runSequence('clean:lib', 'copy:libs', callback);
});

gulp.task('scripts', function(callback) {
  runSequence(['lint:ts', 'clean:dist:js'], callback);
});
/*
gulp.task('scripts', function(callback) {
  runSequence(['lint:ts', 'clean:dist:js'], 'compile:ts', 'bundle:js', 'minify:js', callback);
});
*/

gulp.task('build', function(callback) {
  runSequence('copy', 'scripts', callback);
});