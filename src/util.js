import fs from 'fs';
import path from 'path';
import moment from 'moment';		// 时间格式化
import through from 'through2';

export default {
  /* 获取当前格式化时间 */
  getNow() {
    return moment().format(`YYYY-MM-DD HH:mm:ss ${moment().millisecond()}`);
  },
  /* 获取被格式化当前时间作为静态资源版本号 */
  getTimeFormatVersion() {
    return moment().format("YYYY-MM-DD_HH:mm:ss");
  },
  /* 获取工程路径。注意：服务器端编译时取的是编译时的目录名，和本地不一致 */
  getProjectPath() {
    return path.resolve(__dirname, '../../../');
  },
  /* 获取工程名称。注意：服务器端编译时取的是编译时的目录名，和本地不一致 */
  getProjectName() {
    return path.basename(this.getProjectPath());
  },
  // 对象格式化
  stringifyFormat(obj) {
    return JSON.stringify(obj, ' ', 2);
  },
  /* gulp插件，什么也不做 */
  gulpNothing() {
    return through.obj(function (file, enc, cb) {
      this.push(file);
      cb();
    });
  },
  /**
   * 如果没有目标路径不存在，自动创建路径所需文件夹
   * @param dest
   */
  autoMkDir(dest) {
    // 计算dest每一级目录的路径
    let dirArr = dest.split('/');
    dirArr.forEach((item, i) => {
      dirArr[i] = `${i > 0 ? dirArr[i - 1] + '/' : ''}${item}`;
    });

    // 检查每级路径是否存在，不存在则创建文件夹
    for (let i = 0; i < dirArr.length - 1; i++) {
      let dirName = dirArr[i];
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
      }
    }
  },
  copyFile(src, dest) {
    this.autoMkDir(dest);
    // 开始复制
    fs.copyFileSync(src, dest);
  }
}
