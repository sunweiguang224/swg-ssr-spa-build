import config from '../config.js';

/**
 * webpack文本替换插件
 */
export default class {
  apply(compiler) {
    compiler.plugin("compilation", function (compilation) {
      compilation.plugin('optimize-modules', function (modules) {
        modules.forEach(function (module, i) {
          if (module._source && module._source._value) {
            // console.log(module._source._value);
            module._source._value = module._source._value.replace(config.replacer.regex, (key) => config.replacer[key]);
            // console.log(module._source._value);
          }
        })
      });
    });
  }
}
