import fs from 'fs';
import glob from 'glob';
import util from './util.js';
import pkg from '../../../package.json';

/************************* 环境变量 ***************************/
let developer = fs.existsSync('./developer.config.js') ? require('../../../developer.config.js').default : null;
var env = {
  env: process.env.env !== '[object Object]' && process.env.env || '',
  num: process.env.num || '',
  mini: process.env.mini == 'true',
  zip: process.env.zip == 'true',
  gzip: process.env.gzip == 'true',
  lint: process.env.lint == 'true',
  repair: process.env.repair == 'true',
  ssr: pkg.type == 'ssr',
  page: (function () {
    // 如果是SPA应用，则编译入口为项目package.json中main指定的字段或router
    if (pkg.type == 'spa') {
      return pkg.main || 'router';
    } else {
      // 编译入口数组
      let entry = [];

      // 如果是工单发布||没有developer.config.js||developer.config.js中没有指定page字段||developer.config.js中page.length字段长度为0，则编译所有页面
      if (process.env.env || !developer || !developer.page || !developer.page.length) {
        entry = fs.readdirSync(`${__dirname}/../../../src/page`);
      } else {
        entry = developer.page;
      }

      // 过滤掉不存在和废弃的入口
      entry = entry.filter((item) => {
        let path = `${__dirname}/../../../src/page/${item}/config.json`;
        return !fs.existsSync(path) || !require(path).deprecated;
      });

      console.log(`即将编译入口为：（已过滤掉不存在和废弃的入口）`);
      console.log(entry);

      // 如果是多个，返回{a,b,c,..}格式
      if (entry.length > 1) {
        return `{${entry.join(',')}}`;
        // 如果是单个，返回字符串形式单个入口名
      } else if (entry.length === 1) {
        return developer.page[0];
      } else {
        throw new Error('编译入口数量为0，请检查developer.config.js配置目录名是否正确或src/page/目录下页面数量是否为0。');
      }
    }
  })(),
};

/************************* 文件glob路径 ***************************/
let path = {
  html: [`node_modules/dvd-base-build-node-ssr/html/template.html`],
  css: [`src/*page/${env.page}/css/*.scss`, `src/*common/css/common.scss`],
  js: `src/page/${env.page}/js/*.js`,
  router: `src/*page/${env.page}/js/router.js`,
  // dll: `node_modules/dvd-base-build-node-ssr/dist/dll/*.dll${env.env && '.min'}.js`,
  dll: `node_modules/dvd-base-build-node-ssr/dist/dll/*.js`,
  moveJs: `src/*common/js/autoRootSize.js`,
  img: [`src/*page/${env.page}/img/*`, `src/*common/img/*`],
  iconDir: `src/page/${env.page}/img/icon*`,
  temp: `.temp`,
  dist: `dist`,
  static: `dist/static`,
  include: `${__dirname}/../../../`,
};

/************************* 环境参数替换表 ***************************/
let replacer = {
  '[[env]]': env.env,
  '[[num]]': env.num,
  '[[base_domain]]': (function () {
    if (env.env == 'dev') {
      return 'bravetime.net';
    } else if (env.env == 'beta') {
      return 'vyohui.cn';
    } else{
      return 'davdian.com';
    }
  })(),
  '[[static]]': (function () {
    if (env.env == 'dev') {
      return `//fe.bravetime.net/${pkg.name}/static${env.num}/dist/static`;
    } else if (env.env == 'beta' || env.env == 'pt') {
      return `//fe.vyohui.cn/${pkg.name}/static${env.num}/dist/static`;
    } else {
      return `//5e.dvmama.com/${pkg.name}/static${env.num}/dist/static`;
    }
  })(),
  '[[vendor]]': '//3n.dvmama.com',
  '[[v]]': env.mini ? `` : `?v=${util.getTimeFormatVersion()}`,
  '[[project]]': pkg.name,
  regex: /\[\[(env|num|base_domain|static|vendor|v|project)]]/g,
};
// replacer.regex = function () {
//   let arr = [];
//   for (let i in replacer) {
//     let key = i.replace(/\[/g, '\\[');
//     arr.push(key);
//   }
//   console.log(arr);
//   return new RegExp(arr.join('|'), 'g');
// }();

/************************* css前缀 ***************************/
var autoprefixer = {
  browsers: [
    "last 4 versions",
    "Android >= 4",
    "iOS >= 4",
    "IE >= 8",
    "> 0.1%",
    "Firefox >= 20"
  ]
};

/************************* babel配置 ***************************/
var babel = {
  presets: [
    "es2015",
    "stage-0",
    "stage-1",
    "stage-2",
    "stage-3"
  ],
  plugins: [
    "transform-vue-jsx",
    "transform-object-assign",
    [
      "transform-runtime",
      {
        "helpers": false,
        "polyfill": false,
        "regenerator": true,
        "moduleName": "babel-runtime"
      }
    ],
  ],
};

let config = {
  env,
  path,
  replacer,
  pkg,
  autoprefixer,
  babel,
  'dvd-service-js-native': fs.readFileSync(`${__dirname}/../../dvd-service-js-native/package.json`, 'utf-8'),
};

console.log(`/************************* 运行参数 ***************************/`);
console.log(`config: ${util.stringifyFormat(config)}`);

export default config;
