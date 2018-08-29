import loaderUtils from 'loader-utils';

/**
 * @module replace-loader
 * @author swg [源码地址]()
 */
export default function (source) {
  // 不对node_modules目录下的文件进行替换
  if (this.resourcePath && this.resourcePath.indexOf('node_modules') === -1 || this.resourcePath.indexOf('dvd-service-js-ajax') !== -1) {
    // 获取参数
    let options = loaderUtils.getOptions(this);

    // options.replacer是map类型的，map转regex进行替换
    if (typeof options.replacer == 'object') {
      // 生成正则字符串
      let regStr = '(';
      let replaceCount = 0;
      for (let i in options.replacer) {
        regStr += `${i.replace(/\[/g, '\\[')}|`;
        replaceCount++;
      }
      if (replaceCount > 0) {
        regStr = regStr.substr(0, regStr.length - 1);
      }
      regStr += ')';

      // 生成正则对象
      let regex = new RegExp(regStr, 'g');

      // 将key替换成value
      source = source.replace(regex, (matcher) => {
        return options.replacer[matcher];
      })
    }

    // console.log(this)
    // if (source.indexOf('scss') !== -1) {
    if (this.resourcePath.indexOf('index.scss') !== -1) {
      console.log(source)
    }
  }

  // 返回结果
  return source;
}
