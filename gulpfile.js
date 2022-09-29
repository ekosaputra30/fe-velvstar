/*global require*/
"use strict";

var gulp = require("gulp"),
  path = require("path"),
  data = require("gulp-data"),
  twig = require("gulp-twig"), // Decided to use twig instead of pug, because already familiar with it
  prefix = require("gulp-autoprefixer"),
  sass = require("gulp-sass")(require("node-sass")),
  plumber = require("gulp-plumber"),
  concat = require("gulp-concat"),
  sourcemaps = require("gulp-sourcemaps"),
  browserSync = require("browser-sync").create(),
  rollup = require("gulp-better-rollup"),
  babel = require("rollup-plugin-babel"),
  resolve = require("rollup-plugin-node-resolve"),
  commonjs = require("rollup-plugin-commonjs"),
  fs = require("fs");
/*
 * Directories here
 */
var paths = {
  build: "./public/",
  sass: "./src/scss/",
  js: "./src/js/",
  css: "./public/dist/css/",
  data: "./src/data/",
};

function syncBrowser(done) {
  browserSync.init({
    server: {
      baseDir: paths.build,
    },
    notify: false,
    browser: "chrome",
  });
  done();
}

function reload(done) {
  browserSync.reload();
  done();
}

/**
 * Compile .twig files and pass data from json file
 * matching file name. index.twig - index.twig.json into HTMLs
 */
function twigTask() {
  return (
    gulp
      .src("./src/templates/index.twig")
      // Stay live and reload on error
      .pipe(
        plumber({
          handleError: function (err) {
            console.log(err);
            this.emit("end");
          },
        })
      )
      .pipe(
        data(function (file) {
          return JSON.parse(fs.readFileSync(paths.data + "index.json"));
        })
      )
      .pipe(twig())
      .on("error", function (err) {
        process.stderr.write(err.message + "\n");
        this.emit("end");
      })
      .pipe(gulp.dest(paths.build))
  );
}

/**
 * Compile .scss files into build css directory With autoprefixer no
 * need for vendor prefixes then live reload the browser.
 */
function sassTask() {
  return (
    gulp
      .src(paths.sass + "main.scss")
      .pipe(sourcemaps.init())
      // Stay live and reload on error
      .pipe(
        plumber({
          handleError: function (err) {
            console.log(err);
            this.emit("end");
          },
        })
      )
      .pipe(
        sass().on("error", function (err) {
          console.log(err.message);
          this.emit("end");
        })
      )
      // .pipe(
      //   prefix(["last 15 versions", "> 1%", "ie 8", "ie 7"], {
      //     cascade: true,
      //   })
      // )
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest(paths.css))
  );
}

/**
 * Compile .js files into build js directory With app.min.js
 */
function jsTask() {
  return gulp
    .src(paths.js + "script.js")
    .pipe(sourcemaps.init())
    .pipe(
      rollup(
        {
          plugins: [babel(), resolve(), commonjs()],
        },
        "umd"
      )
    )
    .pipe(concat("script.min.js"))
    .on("error", function (err) {
      console.log(err.toString());
      this.emit("end");
    })
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("public/dist/js"));
}

/**
 * Watch scss files for changes & recompile
 * Watch .twig files run twig-rebuild then reload BrowserSync
 */
function watchTask() {
  gulp.watch(paths.js + "script.js", gulp.series(jsTask, reload));
  gulp.watch(paths.sass + "main.scss", gulp.series(sassTask, reload));
  gulp.watch(
    ["./src/templates/**/*.twig", "./src/data/index.json"],
    gulp.series(twigTask, reload)
  );
}

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the project site, launch BrowserSync then watch
 * files for changes
 */

exports.default = gulp.series(
  syncBrowser,
  gulp.parallel(sassTask, jsTask, twigTask),
  watchTask
);
