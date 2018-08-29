// 第三方
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import webpack from 'webpack';
import merge from 'webpack-merge';
import vuxLoader from 'vux-loader';
import autoprefixer from 'autoprefixer';
import VueSSRClientPlugin from 'vue-server-renderer/client-plugin';

// 自定义
import config from './config.js';
import util from './util.js';

// 复制文件
util.copyFile('node_modules/dvd-base-build-node-ssr/dist/dll/vendor.dll.js', 'dist/static/common/js/vendor.dll.js');
util.copyFile('node_modules/dvd-base-build-node-ssr/dist/dll/vendor.dll.min.js', 'dist/static/common/js/vendor.dll.min.js');

let json = merge(require('./webpack.base.config').default, {
  entry: {
    'page/app-client': `./src/page/app-client.js`,
  },

  output: (function () {
    let fileName = `[name].[hash:5]${config.env.mini ? '.min' : ''}.js`;
    return {
      path: path.resolve('dist/static'),
      filename: fileName,
      chunkFilename: fileName.replace('hash:', 'chunkhash:'),
      publicPath: `${config.replacer['[[static]]']}/`,
    };
  })(),

  plugins: function () {
    let arr = [];

    // 全局变量替换
    // arr.push(new webpack.DefinePlugin({
    //   PRODUCTION: JSON.stringify(true),
    //   sss: JSON.stringify(true),
    //   '[[sss]]': JSON.stringify(true),
    //   VERSION: JSON.stringify("5fa3b9"),
    //   BROWSER_SUPPORTS_HTML5: true,
    //   TWO: "1+1",
    //   "typeof window": JSON.stringify("object")
    // }));

    // arr.push(new webpack.ContextReplacementPlugin(
    //   'bbb': 'wefwefwef',
    //   // newContentResource?: string,
    //   // newContentRecursive?: boolean,
    //   // newContentRegExp?: RegExp
    // ));

    // arr.push(new TextReplacePlugin());

    // 公共js提取
    if (!config.env.ssr && config.env.env) {
      // 提取公共js
      arr.push(new webpack.optimize.CommonsChunkPlugin({
        name: "common",
        filename: 'common/js/common.js',
        minChunks: 5,
      }));
    }

    // 读取dll信息
    let dllJsonPath = config.env.env ? `./dll/vendor.dll.min.json` : `./dll/vendor.dll.json`;
    let dllJson = require(dllJsonPath);
    // console.log(`dllJson(${dllJsonPath})内容如下: `);
    // console.log(JSON.stringify(dllJson, ' ', 2));

    // 读取dll信息
    arr.push(new webpack.DllReferencePlugin({
      context: `${__dirname}/../../../`,
      manifest: dllJson,
    }));

    // 此插件在输出目录中
    // 生成 `vue-ssr-client-manifest.json`。
    if (config.env.mini) {
      arr.push(new webpack.optimize.UglifyJsPlugin());
    }
    arr.push(new VueSSRClientPlugin());

    // 开发模式热更新
    if (!config.env.env) {
      arr.push(new webpack.HotModuleReplacementPlugin({}));
    }

    return arr;
  }(),

  externals: {
    'vconsole': 'window.VConsole',
    'babel-polyfill': 'window._babelPolyfill',
    'ali-oss': 'window.OSS',
  },
});

export default json;
