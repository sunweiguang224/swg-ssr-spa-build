// 第三方
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import webpack from 'webpack';
import merge from 'webpack-merge';
import vuxLoader from 'vux-loader';
import autoprefixer from 'autoprefixer';
import nodeExternals from 'webpack-node-externals';
import VueSSRServerPlugin from 'vue-server-renderer/server-plugin';

// 自定义
import config from './config.js';
import buildPageRouter from './build_page_router.js';

// 如果本地开发，启动express服务之前编译路由，确保路由能够注册上
// 如果发布代码，路由已经在npm run server中编译好，不需要启动服务前编译，这样可以快速重启
if (config.env.env) {
  buildPageRouter();
}

let setting = {
  // 将 entry 指向应用程序的 server entry 文件
  entry: function () {
    return `./src/page/app-server.js`;
  }(),

  // 这允许 webpack 以 Node 适用方式(Node-appropriate fashion)处理动态导入(dynamic import)，
  // 并且还会在编译 Vue 组件时，
  // 告知 `vue-loader` 输送面向服务器代码(server-oriented code)。
  target: 'node',

  // https://webpack.js.org/configuration/externals/#function
  // https://github.com/liady/webpack-node-externals
  // 外置化应用程序依赖模块。可以使服务器构建速度更快，
  // 并生成较小的 bundle 文件。
  // 外置的模块将不会被预处理
  externals: nodeExternals({
    // 不要外置化 webpack 需要处理的依赖模块。
    // 你可以在、这里添加更多的文件类型。例如，未处理 *.vue 原始文件，
    // 你还应该将修改 `global`（例如 polyfill）的依赖模块列入白名单
    whitelist: [
      // /^dvd-/,
      // 以下模块都间接性的引用了.vue或.scss模块
      /^dvd-service-com/,
      /^dvd-service-js-popup$/,
      /^dvd-service-js-common$/,
      /^dvd-service-js-debug$/,
      /^dvd-service-js-img-lazyload$/,
      /^dvd-service-js-ajax$/,
    ],
  }),

  // 此处告知 server bundle 使用 Node 风格导出模块(Node-style exports)
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve('dist/static'),
    filename: '[name].js',
  },

  // 这是将服务器的整个输出
  // 构建为单个 JSON 文件的插件。
  // 默认文件名为 `vue-ssr-server-bundle.json`
  plugins: function () {
    let arr = [];

    // 服务端代码
    arr.push(new VueSSRServerPlugin());

    return arr;
  }(),
};

// 对 bundle renderer 提供 source map 支持
if (config.env.env !== 'prod') {
  setting.devtool = 'source-map';
}

export default merge(require('./webpack.base.config.js').default, setting);
