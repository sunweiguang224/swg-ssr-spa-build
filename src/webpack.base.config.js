// 第三方
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import webpack from 'webpack';
import vuxLoader from 'vux-loader';
import autoprefixer from 'autoprefixer';
import StyleLintPlugin from 'stylelint-webpack-plugin';

// 自定义
import config from './config.js';
// import TextReplacePlugin from './plugin/TextReplacePlugin.js';

// 字符替换loader，替换全局环境变量
let replaceLoader = {
  loader: path.resolve(`${__dirname}/loader/replace-loader.js`),
  options: {
    replacer: (function () {
      let replacer = Object.assign({}, config.replacer);
      delete replacer.regex;
      return replacer;
    })(),
  },
};

// 解决 vue-lazyload 编译报错问题
var vuePackageJsonPath = `${__dirname}/../../vue-lazyload/.babelrc`;
let data = fs.readFileSync(vuePackageJsonPath, {encoding: 'utf-8'});
let vueLazyloadJson = JSON.parse(data);
// vueLazyloadJson.plugins = [];
vueLazyloadJson = {};
console.log(vueLazyloadJson);
fs.writeFileSync(vuePackageJsonPath, JSON.stringify(vueLazyloadJson, ' ', 2), {flag: 'w'});

let json = {
  entry: {},
  output: {},
  module: {
    // 每个rule内部的loader的执行顺序为倒序（后注册先执行）
    rules: [
      // js-loader
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: config.babel,
          },
          replaceLoader,
        ],
      },

      // vue-loader
      {
        test: /\.vue$/,
        use: [
          {
            loader: 'vue-loader',
            options: {
              // 处理vue中引用的css
              postcss: [
                autoprefixer(config.autoprefixer),
              ],
              loaders: {
                js: [
                  {
                    loader: 'babel-loader',
                    options: config.babel,
                  },
                ],
              }
            }
          },
          replaceLoader,
        ],
      },

      // json-loader
      {
        test: /\.json$/,
        use: [
          {loader: 'json-loader'},
          replaceLoader,
        ]
      },

      // scss-loader
      {
        test: /\.(scss|css)$/,
        use: [
          {loader: 'style-loader'},
          {loader: 'css-loader'},
          {
            loader: 'postcss-loader',
            options: {
              plugins: [
                autoprefixer(config.autoprefixer),
              ]
            }
          },
          {loader: 'sass-loader'},
        ]
      },

      // img-loader
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [
          {loader: 'url-loader'},
        ]
      },
    ],
  },

  // 监听文件变化
  watch: config.env.env ? false : true,
  watchOptions: {
    // poll: 1000,
  },

  plugins: [],
  externals: {},
  resolve: {
    alias: {
      // 本地开发使用开发版严格校验，发布到公共环境时使用压缩版避免严格校验产生的报错（严格校验促进更优秀的代码质量）
      vue: !config.env.env ? 'vue/dist/vue.js' : 'vue/dist/vue.min.js',
    }
  },
};

/* eslint loader creator */
function createEslintLoader({fix} = {}) {
  return {
    loader: 'eslint-loader',
    options: {
      // 出错停止编译
      // failOnError: true,

      // 是否自动修复文件（只能修复.js格式文件）
      fix: fix && config.env.repair ? true : false,
    }
  };
}

/* 是否需要代码风格检测 */
if (config.env.lint) {
  // js代码格式校验
  json.module.rules[0].use.push(createEslintLoader());

  // vue代码格式校验
  json.module.rules[1].use.push({
    loader: 'htmllint-loader',
    query: {
      config: `.htmllintrc`, // path to custom config file
      failOnError: false,
      failOnWarning: false,
    },
  });
  json.module.rules[1].use[0].options.loaders.js.push(createEslintLoader({fix: false}));

  // css代码格式校验
  json.plugins.push(new StyleLintPlugin({
    syntax: 'scss',
    files: ['src/page/*/**/*.scss'],
    fix: config.env.repair ? true : false,
  }));
}

// 只有m项目支持VUX
if (config.pkg.name == 'm') {
  // vue组件中引用其他模块不加文件后缀（这样做不好），为了兼容才做此设置
  json.resolve.extensions = ['.js', '.vue', '.json'];

  // 增加一些plugin辅助加载vux
  json = vuxLoader.merge(json, {
    plugins: ['vux-ui']
  });
}

export default json;
