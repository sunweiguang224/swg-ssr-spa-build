// 第三方
import fs from 'fs';
// import Vue from 'vue';
import gulp from 'gulp';
import path from 'path';
import glob from 'glob';
import http from 'http';
import https from 'https';
import express from 'express';
// import bodyParser from 'body-parser';
import favicon from 'express-favicon';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import htmlMinifier from 'html-minifier';
import httpProxy from 'http-proxy-middleware';
import {createBundleRenderer} from 'vue-server-renderer';

// 内部模块
// import ajax from 'dvd-service-js-ajax';
import console from 'dvd-service-js-console';

// 自定义
import util from './util.js';
import config from './config.js';
import buildPageRouter from './build_page_router.js';

// 如果本地开发，启动express服务之前编译路由，确保路由能够注册上
// 如果发布代码，路由已经在npm run server中编译好，不需要启动服务前编译，这样可以快速重启
if (!config.env.env) {
  buildPageRouter();
}

// 创建一个新的bundleRenderer，需要50ms~200ms，不必要每次请求都创建
function bundleRendererFactory() {
  let setting = {
    runInNewContext: 'once',  // 只实例化一次，且业务代码不会污染global
    template: fs.readFileSync(`${__dirname}/../src/template.html`, 'utf-8'), // （可选）页面模板
    inject: false,
  };

  // 指定html中加载的client端JS（发布代码时必须加载，保证功能完整性；本地开发时有则加载，只开发html和css时可以不用编译client端JS）
  if (config.env.env || fs.existsSync('dist/static/vue-ssr-client-manifest.json')) {
    // 必须用实时读取文件方式（require方式有缓存，开发模式下不能拿实时更新）
    setting.clientManifest = JSON.parse(fs.readFileSync('dist/static/vue-ssr-client-manifest.json', 'utf-8')); // （可选）客户端构建 manifest
  }

  return createBundleRenderer(JSON.parse(fs.readFileSync('dist/static/vue-ssr-server-bundle.json', 'utf-8')), setting);
}

// 压缩html，去除冗余空格
function minifyHtml(html) {
  return htmlMinifier.minify(html, {
    removeComments: true,
    collapseWhitespace: true,
    minifyJS: true,
    minifyCSS: true,
  });
}

/************************************ 服务端启动任务 ************************************/
console.log(`>>>>>>>>>>>>>>> 服务端启动任务开始执行。${util.getNow()}`);

// 全局服务
let app = express();

// // 全局开启gzip
// if (config.env.mini) {
//   app.use(compression());
// }

// 全局cookie解析，为req增加cookies字段，可以使用req.cookies.xxx获取单个cookie
app.use(cookieParser());

// 设置全局response header
app.use((req, res, next) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  next();
});

// 全局异常处理，服务端发生异常时将错误返回给页面
app.use((err, req, res, next) => {
  console.error(err.stack, {req});
  res.status(500).send('服务器发生异常:\n' + err.stack);
});

// 处理favicon.ico请求
// app.use(favicon(__dirname + '/../favicon.ico'));

// 代理client端接口请求，本地开发模式独有
if (!config.env.env) {
  app.use('/api/*', (req, res, next) => {
    let func = httpProxy({
      // 请求后端，使用固定协议+协议默认端口
      // target: `${req.protocol}://${req.headers.host.split(':')[0]}`,
      target: `https://${req.headers.host.split(':')[0]}`,
    });
    func(req, res, next);
  });
}


// // post请求body解析，application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }));

// 预先创建渲染器
let bundleRenderer = config.env.env ? bundleRendererFactory() : null;

// 注册页面级路由，某些页面可能需要单独处理
glob.sync(`${__dirname}/../../../${config.path.router.replace('src/', 'dist/static/')}`).forEach(filePath => {
  // 引入router
  let router = require(filePath).default;

  router = router.create({
    bundleRenderer,
    bundleRendererFactory: config.env.env ? null : bundleRendererFactory,   // 如果是本地开发模式，保证每次修改代码生效
    minifyHtml,
    config,
  });

  // 使用router
  app.use(router);
  console.log(`发现并注册router：${filePath}`);
});

// 直接kill掉无用的请求
let invalidRouter = express.Router();
invalidRouter.get('/undefined', (req, res, next) => {
  console.log(`express收到请求：${req.url}`, {req});
  res.end();
  console.log(`已经结束掉无用的请求：${req.url}`, {req});
});
app.use(invalidRouter);

// 注册通用级get路由
let allGetRouter = express.Router();
allGetRouter.get('*', (req, res, next) => {

  // 不处理接口
  if (req.originalUrl.indexOf('/api/fe/getHybridConfig') === 0) {
    next();
    return;
  }

  console.log(`express收到请求`, {req});

  let start = Date.now();

  // 保证每次修改代码生效（本地开发模式）
  if (!config.env.env) {
    bundleRenderer = bundleRendererFactory();
  }

  // 解决不正常的请求
  let maxTime = 60000;
  let timeout = setTimeout(() => {
    let msg = `请求超过${maxTime / 1000}s，已主动结束：${req.url}`;
    res.end(msg);
    console.log(msg, {req});
  }, maxTime);

  // 开始渲染
  bundleRenderer.renderToString({
    req,
    res,
    config,
  }).then(html => {
    console.log(`页面渲染完成，时间消耗为：${Date.now() - start}`, {req});

    // res.end(config.env.mini ? minifyHtml(html) : html);
    res.end(html);

    clearTimeout(timeout);
  }).catch(err => {
    // 如果主动中断，不输出log
    if (err.message !== 'interrupt') {
      if (err.message === '404') {
        res.write(`404您请求的页面不存在`);
      } else {
        // res.end(`${err.message}<br>${err.stack.replace(/\n/g, '<br>')}`);
        res.write(`貌似出错了`);
      }
      res.end(`，即将跳转到店铺首页<script>setTimeout(function(){ location.href = '/'; }, 3000);</script>`);
      console.error(err, {req});
    }
  });


  /*// 流式渲染
   const stream = bundleRenderer.renderToStream({
   req,
   url: req.url,
   });

   stream.on('data', data => {
   res.write(data.toString());
   res.flush();
   });

   stream.on('end', () => {
   res.end();
   });

   stream.on('error', err => {
   console.error(err)
   res.end(`${err.message}<br>${err.stack.replace(/\n/g, '<br>')}`);
   });*/


});
app.use(allGetRouter);

// 创建全局http(s)服务
let httpServer = http.createServer(app);

// 启动全局http(s)服务并监听
// httpServer.listen(config.env.env ? 6080 : 80, () => {
// httpServer.listen(6080, () => {

// 启动端口号=项目配置文件中的基础号段+当前开发环境num
let port = config.pkg.port;
if (config.env.env) {
  port += config.env.num ? parseInt(config.env.num) : 0;

  // 本地开发模式启动端口号=项目配置文件中的基础号段+1
} else {
  port += 1;
}
httpServer.listen(port, () => {
  console.log(`http服务已启动 ${JSON.stringify(httpServer.address())}`);
});

/*// 服务端不用启动https
 if (!config.env.env) {
 // 创建全局http(s)服务，
 let httpsServer = https.createServer({
 key: fs.readFileSync(path.join(__dirname, '/../../cer/private.pem'), 'utf8'),
 cert: fs.readFileSync(path.join(__dirname, '/../../cer/file.crt'), 'utf8'),
 }, app);

 // httpsServer.listen(config.env.env ? 6443 : 443, () => {
 httpsServer.listen(6443, () => {
 console.log(`https服务已启动 ${JSON.stringify(httpsServer.address())}`);
 });
 }*/
