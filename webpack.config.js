const webpack = require('webpack')
const merge = require('webpack-merge')

const common = {
  entry: './src/svg.pathmorphing2.js'

, output: {
    path: __dirname + '/dist'
  , library: 'SVG'
  , libraryTarget: 'umd'
  }

, externals: {
    'svg.js': {
      commonjs: 'svg.js'
    , commonjs2: 'svg.js'
    , amd: 'svg'
    , root: 'SVG'
    }
  , 'svg.point.js': {
      commonjs: 'svg.point.js'
    , commonjs2: 'svg.point.js'
    , amd: 'svg.point'
    , root: 'SVG'
    }
  }
}

var config

// Detect how npm is run and branch based on that
switch(process.env.npm_lifecycle_event) {
  case 'build:min':
    config = merge(common, {
      output: {
        filename: 'svg.pathmorphing2.min.js'
      }
    , plugins: [
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false
          }
        })
      ]
    })
    break

  case 'build':
  default:
    config = merge(common, {
      output: {
        filename: 'svg.pathmorphing2.js'
      }
    })
}

module.exports = config
