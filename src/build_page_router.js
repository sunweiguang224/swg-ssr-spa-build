// 第三方
import fs from 'fs';
import glob from 'glob';
import path from 'path';
import * as babel from 'babel-core';

// 自定义
import util from './util.js';
import config from './config.js';
import eslintrc from './eslintrc.js';

/************************************ 页面级express路由编译 ************************************/
export default () => {
  console.log(`>>>>>>>>>>>>>>> 页面级express路由编译开始。${util.getNow()}`);

  glob.sync(config.path.router).forEach(filePath => {
    // 读取并babel
    let result = babel.transform(fs.readFileSync(filePath, 'utf-8'), {
      extends: path.resolve('.babelrc'),
    });

    // 常量替换
    for (let i in config.replacer) {
      // 只替换[[开头的
      if (i.indexOf('[[') === 0) {
        // [ 转 \[
        let regex = i.replace(/\[/g, '\\[');
        // 替换
        result.code = result.code.replace(new RegExp(regex, 'g'), config.replacer[i]);
      }
    }

    // 输出到dist
    let destFilePath = `${filePath.replace('src', 'dist')}`;
    util.autoMkDir(destFilePath);
    fs.writeFileSync(destFilePath, result.code);

    console.log(`[${util.getNow()}] 页面级express路由编译完成 ${destFilePath}: ${Math.floor(result.code.length / 1024)}KB`)
  });

  console.log(`>>>>>>>>>>>>>>> 页面级express路由编译结束。${util.getNow()}`);
};
