var path = require('path')
var gulp = require('gulp')
var ora = require('ora')
var nop = require('gulp-nop')
var postcss = require('gulp-postcss')
var cssmin = require('gulp-cssmin')
var config = require('./config')
var replaceVars = require('./gen-vars').replace

var salad = function (browsers) {
  return require('postcss-salad')({
    browsers: browsers || config.browsers,
    features: config.features
  })
}

var themeize = function() {
  return require('postcss-themeize')(require(path.resolve(process.cwd(), config.themeVars)).options)
}

var customFolder = 'custom'

exports.fonts = function (opts) {
  var spin = ora(opts.message).start()
  var defaultPath = path.resolve(config.themePath, './src/fonts/**')
  var customPath = path.resolve(config.themePath, './' + customFolder + '/fonts/**')
  var stream = gulp.src([defaultPath, customPath])
    .pipe((opts.minimize || config.minimize) ? cssmin({showLog: false}) : nop())
    .pipe(gulp.dest(function(file) {
      if (file.path.indexOf('theme-in/' + customFolder + '/') > -1) {
        return (opts.out || config.out) + '/custom/fonts'
      }
      return path.resolve(opts.out || config.out, './fonts')
    }))
    .on('end', function () {
      spin.succeed()
    })

  return stream
}

exports.build = function (opts) {
  var spin = ora(opts.message).start()
  var stream
  var components
  var cssFiles = '*'
  var customCssFiles = '*'

  if (config.components) {
    components = config.components.concat(['base'])
    cssFiles = '{' + components.join(',') + '}'
  }

  var componentsPath = path.resolve(config.themePath, './src/' + cssFiles + '.css')
  var customPath = path.resolve(config.themePath, './' + customFolder + '/' + customCssFiles + '.css')

  stream = gulp.src([opts.config || config.config, componentsPath, customPath])
      .pipe(replaceVars(opts.config))
      .pipe(postcss([salad(opts.browsers), themeize()]))
      .pipe((opts.minimize || config.minimize) ? cssmin({showLog: false}) : nop())
      .pipe(gulp.dest(function(file) {
        if (file.path.indexOf('theme-in/' + customFolder + '/') > -1) {
          return (opts.out || config.out) + '/' + customFolder
        }
        return opts.out || config.out
      }))
      .on('end', function () {
        spin.succeed()
      })

  return stream
}
