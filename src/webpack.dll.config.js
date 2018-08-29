// 第三方
var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

/************************* dll配置 ***************************/
let dll = {
  list: [
    'vue',
    'jquery',
    'vue-lazyload',
    // 'babel-polyfill',
    'js-cookie',
    'crypto-js/md5.js',
    // 'style-loader',
    // 'vue-style-loader',
    'scriptjs',
    'vuex',
    'vue-router',
    'swiper',
  ],
};

/*// 根据当前编译参数修改vue模块的入口js指向
 var vuePackageJsonPath = '../node_modules/vue/package.json';
 var vuePackageJson = require(vuePackageJsonPath);
 var targetVue = 'dist/vue.js';
 if (isMini) {
 targetVue = 'dist/vue.min.js';
 }
 if (vuePackageJson.main !== targetVue || vuePackageJson.module !== targetVue) {
 vuePackageJson.main = vuePackageJson.module = targetVue;
 fs.writeFileSync(__dirname + '/' + vuePackageJsonPath, JSON.stringify(vuePackageJson, ' ', 2), {flag: 'w'}, function (err) {
 if (err) {
 throw new Error(err);
 }
 });
 }*/


// 是否打包压缩的dll
let isMini = process.env.mini === 'true';

let dllJsonPath = path.join(__dirname, "../dist/dll", '[name].dll' + (isMini ? '.min' : '') + '.json');
console.log(`dllJsonPath(${dllJsonPath.replace('[name]', 'vendor')})内容如下: `);
// console.log(JSON.stringify(require(dllJsonPath.replace('[name]', 'vendor')), ' ', 2));

let json = {
  entry: {
    vendor: dll.list,
  },
  output: {
    path: path.join(__dirname, "../dist/dll"),
    filename: '[name].dll' + (isMini ? '.min' : '') + '.js',
    library: "[name]_factory",  // 暴露的工厂函数名称
  },
  plugins: function () {
    var plugins = [
      new webpack.DllPlugin({
        // context: __dirname,
        context: `${__dirname}/../`,
        path: dllJsonPath,  // 清单json文件的绝对路径
        name: "[name]_factory",   // 暴露的dll函数的名称
      }),
    ];
    if (isMini) {
      plugins.push(new webpack.optimize.UglifyJsPlugin({
        output: {
          comments: false  // remove all comments
        },
        compress: {
          warnings: false,
          drop_debugger: true,
          drop_console: true
        }
      }));
    }
    return plugins;
  }(),
  resolve: {
    alias: {
      vue: isMini ? 'vue/dist/vue.min.js' : 'vue/dist/vue.js',
      swiper: 'swiper/dist/js/swiper.min.js',
    }
  },
};


module.exports = json;
