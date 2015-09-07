/*
* * * Authored by Mohammad K. Sidani: mohdsidani@gmail.com / moe.sidani@vinelab.com
*/

(function () {

  'use strict';
  var browserSync = require("browser-sync");
  var config = require("./gulp.config.js")();
  var gulp = require("gulp");
  var lazy = require("gulp-load-plugins")({lazy: true});
  var runSequence = require("run-sequence"); /* Exceptionally used to run tasks in a sequence - not in parallel */
  var wiredep = require("wiredep");
  var requireDir = require('require-dir');
  requireDir('./');

/*
* * * Tasks defined as Test-...-... trigger test tasks written inside gulp-test.js
*/

  /*                                 */
 /* * * Development Environment * * */
/*                                 */

/*
* * * Run this task to List all tasks
*/
gulp.task("list-tasks", lazy.taskListing);


/*
* * * Compile Typescript to JavaScript 
*/
gulp.task("ts-compiler", function () {
    return gulp.src(config.allts)
               .pipe(lazy.typescript({
                // Generates corresponding .map file. 
                sourceMap : false,
                
                // Generates corresponding .d.ts file. 
                declaration : true,
 
                // Do not emit comments to output. 
                removeComments : false,
 
                // Warn on expressions and declarations with an implied 'any' type. 
                noImplicitAny : false,
 
                // Skip resolution and preprocessing. 
                noResolve : false,
 
                // Specify module code generation: 'commonjs' or 'amd'   
                module : "amd",
 
                // Specify ECMAScript target version: 'ES3' (default), or 'ES5' 
                target : "ES5"
              }))
              .pipe(gulp.dest(config.dev));
});
gulp.task("Test-ts-compiler", ["test-ts-compiler"]); 


/*
* * * Less to Css conversion 
*/
gulp.task("less-css", function () {
    return gulp.src(config.allless)
               .pipe(lazy.less())
               .pipe(gulp.dest(config.dev + "_public/styles/css/"));
});
gulp.task("Test-less-css", ["test-less-css"]);


/*
* * * Concat all Css files in one file
*/
gulp.task("concat-css", function () {
    return gulp.src(config.allcss)
               .pipe(lazy.concatCss("main.css"))
               .pipe(gulp.dest(config.dev + "_public/styles/css/"));
});
gulp.task("Test-concat-css", ["test-concat-css"]);


/*
* * * Add browser prefixes to make the Css rules compatible across browsers in the main.css file
*/
gulp.task("auto-prefixer", function () {
    return gulp.src(config.dev + "_public/styles/css/main.css")
               .pipe(lazy.autoprefixer({
                  browsers: ["> 0%"],
                  cascade: true
               }))
               .pipe(gulp.dest(config.dev + "_public/styles/css/"));
});
gulp.task("Test-auto-prefixer", ["test-auto-prefixer"]);


/*
* * * Inject all Bower components into index.html 
*/
gulp.task("bower-injector", function () {
    return gulp.src(config.index)
               .pipe(wiredep.stream())
               .pipe(gulp.dest(""));
});
gulp.task("Test-bower-injector", ["test-bower-injector"]);


/*
* * * Inject all JavaScript files into index.html
*/
gulp.task("js-injector", function () {                                    
    return gulp.src(config.index)
               .pipe(lazy.inject(gulp.src(config.alljs, {read: false})))
               .pipe(gulp.dest(""));
});
gulp.task("Test-js-injector", ["test-js-injector"]);


/*
* * * Inject all Css files into index.html
*/
gulp.task("css-injector", function () {
    return gulp.src(config.index)
               .pipe(lazy.inject(gulp.src(config.dev + "_public/styles/css/main.css", {read: false})))
               .pipe(gulp.dest(""));
});
gulp.task("Test-css-injector", ["test-css-injector"])


/*
* * * Move all HTML files to "development" destination
*/
gulp.task("copy-html", function () {
    return gulp.src(config.allhtml)
               .pipe(gulp.dest(config.dev));
});

function copyHtml (file, dest) {
  gulp.src(file)
      .pipe(gulp.dest(dest));
};


/*
* * *  Watch for newly added Typescript files, compile them, and then added their Js files into index.html. 
* * * If a file has been deleted, its corresponding Js will be deleted and its following script will be 
* * * also deleted from index.html
*/ 
gulp.task("ts-watcher", function () {
    lazy.watch(["./app/**/", "!./app/**/*.html" ,"!./app/**/**/**/*.less", "!./app/**/**/**/*.css", "!./app/_public/img/*.*", "!./app/_public/styles/fonts/*.*"])
        .on("add", function (path) {  
          console.log("New file has been added " + path);
          runSequence("ts-compiler", "js-injector"); 
        })
        .on("change", function (path) {
            console.log("File has been changed " + path);
            gulp.start("ts-compiler");
        })
        .on("unlink", function (path) {
            var index = path.indexOf(config.client);
            var filePath = path.substring(index);
            var suffix = path.substring(path.length - 3);
            var jsPath = filePath.replace(".ts", ".js").replace("/app", "/development/app");
            console.log("File has been deleted " + filePath);
            clean(jsPath);
            setTimeout(function() { 
              gulp.start("js-injector"); 
            }, 1000);
        });
});


/*
* * * Watch for newly added Less files, compile them, and then added their Css files into index.html. 
* * * If a file has been deleted, its corresponding Css will be deleted and its following stylesheet 
* * * will be also deleted from index.html
*/ 
gulp.task("less-watcher", function () {
    lazy.watch(["./app/**/", "!./app/*.ts", "!./app/**/*.html", "!./app/**/*.ts", "!./app/**/**/**/*.css", "!./app/_public/img/*.*", "!./app/_public/styles/fonts/*.*"])
        .on("add", function (path) {
            var index = path.indexOf(config.client);
            var filePath = path.substring(index);
            var suffix = path.substring(path.lastIndexOf("."));
            console.log("New file has been added " + path);
            runSequence("less-css", "concat-css", "auto-prefixer", "css-injector");
        })
        .on("change", function (path) {
            console.log("File has been changed " + path);
            clean(config.dev + "_public/styles/css/main.css");
            setTimeout(function () {
              runSequence("less-css", "concat-css", "auto-prefixer");
            }, 1000);
        })
        .on("unlink", function (path) {
            var index = path.indexOf(config.client);
            var filePath = path.substring(index);
            var suffix = path.substring(path.lastIndexOf("."));
            var cssPath = filePath.replace("less", "css").replace(".less", ".css").replace("/app", "/development/app");
            console.log("File has been deleted " + filePath);
            clean(cssPath);
            setTimeout(function () {
              gulp.start("css-injector");
            }, 1000);
        });
});

/*
* * *
*/
gulp.task("html-watcher", function () {
    lazy.watch(["./app/**/", "!./app/*.ts", "!./app/**/*.ts", "!./app/**/**/**/*.css", "!./app/**/**/**/*.less", "!./app/_public/img/*.*", "!./app/_public/styles/fonts/*.*"])
        .on("add", function (path) {
          var index = path.indexOf("/app");
          var filePath = path.substr(index);
          var devFile = "./development" + filePath.substr(0, filePath.lastIndexOf("/"));
          console.log("New file has been added " + filePath);
          copyHtml("." + filePath, devFile);
        })
        .on("change", function (path) {
          var index = path.indexOf("/app");
          var filePath = path.substr(index );
          var devPath = filePath.replace("/app", "/development/app");
          var devFile = "./development" + filePath.substr(0, filePath.lastIndexOf("/"));
          console.log("File has been changed " + filePath);
          console.log("Should clean " + devPath);
          clean("." + devPath);
          setTimeout(function () {
            copyHtml("." + filePath, devFile);
          }, 1000);

        })
        .on("unlink", function (path) {
          var index = path.indexOf("/app");
          var filePath = path.substr(index);
          var devPath = filePath.replace("/app", "/development/app");
          var devFile = "./development" + filePath.substr(0, filePath.lastIndexOf("/"));
          console.log("File has been deleted " + filePath);
          clean("." + devPath);
        });
});


/*
* * * Browser Sync Starter
*/
gulp.task("browser-sync", startBrowserSync);


/*
* * * Browser Sync configuration. Synchronize code across browsers. Watch for changes and reload the browsers.
*/
function startBrowserSync() {
  var options = {
      proxy: "localhost:" + 9090,
      port: 9090,
      files: ["!./app/_public/styles/less/*.less", "./app/**/*.*"],
      ghostMode: {
        clicks: true,
        location: true,
        forms: true,
        scroll: true
      },
      injectChanges: true,
      logFileChanges: true,
      logLevel: "debug",
      logPrefix: "gulp-patterns",
      notify: true,
      reloadDelay: 0,
      browser: "safari"
  };

  if (browserSync.active) {
    return;
  } 

  gulp.start(["less-watcher", "ts-watcher"], function () {
    browserSync.reload();
  });

  browserSync(options);
}







  /*                                  */
 /* * *     Build Environment    * * */
/*                                  */

/*
* * * Minify Html
*/
gulp.task("minify-html", function () {
    return gulp.src(config.allhtml)
               .pipe(lazy.minifyHtml({conditionals: true, spare:true}))
               .pipe(gulp.dest(config.build));
});
gulp.task("Test-minify-html", ["test-minify-html"]);



/*
* * * Compressing Images
*/
gulp.task("images", function () {
    return gulp.src(config.allimg)
               .pipe(lazy.imagemin({optimizationLevel: 5}))
               .pipe(gulp.dest(config.build + "_public/img"));
});
gulp.task("Test-images", ["test-images"]);




/*
* * * Copying fonts to their destination 
*/
gulp.task("copy-fonts", function () {
    return gulp.src(config.allfonts)
               .pipe(gulp.dest(config.build + "_public/styles/fonts"))
});


/*
* * * Template cache
*/  
gulp.task("template-cache", function () {
    return gulp.src(config.allhtml)
               .pipe(lazy.minifyHtml({empty: true}))
               .pipe(lazy.angularTemplatecache())
               .pipe(gulp.dest(config.build));
});
gulp.task("Test-template-cache", ["test-template-cache"]);



/*
* * * Minify Css
*/
gulp.task("minify-css", function () {
    return gulp.src(config.build + "main.css")
               .pipe(lazy.minifyCss({keepBreaks: false}))
               .pipe(lazy.rename({suffix: '.optimized.min'}))
               .pipe(gulp.dest(config.build));
});
gulp.task("Test-minify-css", ["test-minify-css"]);



/*
* * * Minify JS
*/
gulp.task("minify-js", function () {
    return gulp.src(config.build + "build.js")
               .pipe(lazy.stripDebug())
               .pipe(lazy.uglify())
               .pipe(lazy.rename({suffix: '.optimized.min'}))
               .pipe(gulp.dest(config.build));
});
gulp.task("Test-minify-js", ["test-minify-js"]);



/*
* * * Fix angular's dependecie's names 
*/
gulp.task("dependency-fixer", function () {
  return gulp.src(config.alljs)
             .pipe(lazy.ngAnnotate()) 
             .pipe(gulp.dest(config.dev));
});
gulp.task("Test-dependency-fixer", ["test-dependency-fixer"]);



/*
* * * IF the environment is the build environment, it injects the html partials in the
* * * angular template cache before merging all the scripts together in one file.
*/
function useRefBuild () {
  var assets = lazy.useref.assets();
  gulp.src(config.index)
      .pipe(lazy.inject(gulp.src(config.build + "templates.js", {read: false}), {starttag: "<!-- inject:templates:js -->"}))
      .pipe(assets)
      .pipe(assets.restore())
      .pipe(lazy.useref())
      .pipe(gulp.dest("./build"))
      .on("end", function () {
          runSequence("minify-js", "minify-css", function () {
            clean([config.build + "main.css", config.build + "build.js", config.build + "templates.js"]);
            setTimeout(rename, 1000);
          });
      });
}


/*
* * * Rename the newly optimized files back to build.js and main.css respectively, then delete the old optimized files, 
* * * because he useRef in the index.html is always pointing at two files named: build.js and main.css.
*/
function rename() {
  gulp.src(config.build + "build.optimized.min.js")
      .pipe(lazy.rename("./build/app/build.js"))
      .pipe(gulp.dest(""))
      .on("end", function () {
        clean(config.build + "build.optimized.min.js");
      });
  gulp.src(config.build + "main.optimized.min.css")
      .pipe(lazy.rename("./build/app/main.css"))
      .pipe(gulp.dest(""))
      .on("end", function () {
        clean(config.build + "main.optimized.min.css");
      });
}

/*
* * *
*/
function clean (path) {
    gulp.src(path, {read: false})
        .pipe(lazy.clean()).on("end", function () {
          console.log("Done Cleaning...");
        });
}





  /*                                 */
 /* * *      Two Main Tasks     * * */
/*                                 */

/*
* * * Fire the main task to create the "development" environment.  
*/
gulp.task("env-development", function () {
    runSequence("ts-compiler", 
                "less-css", 
                "concat-css",
                "auto-prefixer",
                "bower-injector", 
                "js-injector", 
                "css-injector",
                "copy-html",
                "ts-watcher", 
                "less-watcher",
                "html-watcher",
                "browser-sync");
});


/*
* * * Fire the main tasks to prepare the "build" environment. Optimize All. For publishing app.js lib.js app.css lib.css
*/
gulp.task("env-build", ["minify-html", 
                        "images", 
                        "copy-fonts", 
                        "template-cache",
                        "dependency-fixer"], useRefBuild);
}());