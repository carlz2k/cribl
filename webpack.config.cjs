const path = require('path');
const fs = require('fs');
const glob = require('glob');
const loaderUtils = require('loader-utils');
const webpack = require('webpack');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const PACKAGE = require('./package.json');
const projName = PACKAGE.name;

function loadFiles(cwd, fileGlob, addContextDependency) {
  var absoluteCwd = path.resolve(cwd || '');
  var currentGlob = fileGlob || '*.json';
  var results = {};

  glob.sync(currentGlob, {
    cwd: absoluteCwd
  }).forEach((filePath) => {
    var absoluteFilePath = path.join(absoluteCwd, filePath);
    var parsedAbsoluteFilePath = path.parse(absoluteFilePath);

    if (typeof addContextDependency === 'function') {
      addContextDependency(parsedAbsoluteFilePath.dir);
    }

    var extension = parsedAbsoluteFilePath.ext;
    var end = -1 * extension.length;
    var parts = filePath.slice(0, end).split(path.sep);
    var last = parts.length - 1;
    parts.reduce((root, part, idx) => {
      if (idx == last) root[part] = JSON.parse(fs.readFileSync(absoluteFilePath));
      else if (!(part in root)) root[part] = {};
      return root[part];
    }, results);
  });

  return results;
}
// Aggregating JSON functions - End

let runMod = 'development';

if (process.argv.indexOf('development') === -1) {
  if (process.argv.indexOf('production') === -1) {
    runMod = 'devServer';
    process.env.NODE_ENV = 'devServer';
    console.log(process.argv);
    console.log('Running Dev-Server build......');
  } else {
    runMod = 'production';
    process.env.NODE_ENV = 'production';
    console.log(process.argv);
    console.log('Running Production build......');
  }
} else {
  runMod = 'development';
  process.env.NODE_ENV = 'development';
  console.log(process.argv);
  console.log('Running Local build......');
}

function loadJsonFiles(startPath, parentObj) {
  var files = fs.readdirSync(startPath);

  for(var i=0; i < files.length; i++){
    var filename = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()){
      parentObj[`${files[i]}`] = loadFiles(filename);
      loadJsonFiles(filename, parentObj[`${files[i]}`]);
    }
  }
}


function generateDist (envMode) {
  const devPath = '';
  const prodPath = '';
  const stgPath = `/${projName}`;

  if (envMode === 'devServer') {
    return stgPath;
  } else if (envMode === 'production') {
    return prodPath;
  } else {
    return devPath;
  }
}

function generateModRules(envMode) {
  const devModRules = [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', { targets: 'defaults' }]
          ],
          plugins: ['@babel/plugin-transform-runtime']
        }
      }
    }
  ]

  const prodModRules = [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: 'babel-loader?cacheDirectory',
      resolve: {
        fullySpecified: false,
      }
    },
    {
      test: /browser-sync/,
      use: {
        loader: 'ignore-loader',
      },
    },
  ]

  if (envMode === 'production') {
    return prodModRules;
  } else {
    return devModRules;
  }
}

function generateEnv (envMode) {
  const devEnv = 'dev';
  const prodEnv = 'prod';
  const stgEnv = 'stg';

  if (envMode === 'devServer') {
    return stgEnv;
  } else if (envMode === 'production') {
    return prodEnv;
  } else {
    return devEnv;
  }
}

const moduleRules = generateModRules(runMod);
const distRules = generateDist(runMod);

module.exports = {
  entry: ['./src/main.js'],
  mode: process.env.NODE_ENV,
  output: {
    path: path.join(__dirname, 'dist' + distRules),
    filename: 'index.js',
    clean: true,
    library: {
      type: "module",
    },
    //libraryTarget: 'commonjs2',
    chunkFormat: 'module',
  },
  target: "node",
  experiments: {
    outputModule: true,
  },
  module: {
    rules: moduleRules
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'package.json', globOptions: { ignore:['{**/\_*,**/\_*/**}','**/*.pug'], }, },
        { from: 'package.json', globOptions: { ignore:['{**/\_*,**/\_*/**}','**/*.pug'], }, },
      ]
    }),
  ],
  resolve: {
    modules: [
      'node_modules'
    ],
    alias: {},
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.js(\?.*)?$/i,
        extractComments: true,
        exclude: [/node_modules\/@maizzle\/framework/, /node_modules\/react/],
      }),
    ],
  },
};
