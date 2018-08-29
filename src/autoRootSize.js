/** 实时设置页面根元素font-size */
(function () {
  // 获取页面中的自定义设计稿宽度（需要在本段代码之前设定），如果设计稿宽度为375则无需指定
  var designWidth = window.designWidth;

  // 释放全局变量
  delete window.designWidth;

  /** 设置页面根元素font-size */
  function setRootSize(width) {
    width = width || designWidth || 375;

    // 重置应用宽度
    var clientWidth = document.documentElement.clientWidth;
    if (clientWidth > 640) {
      clientWidth = 640;
    } else if (clientWidth < 320) {
      clientWidth = 320;
    }

    // 设置根元素font-size
    var targetFontSize = (clientWidth / width) * 100;
    document.documentElement.style.fontSize = targetFontSize + "px";
    var actualFontSize = window.getComputedStyle(document.documentElement).fontSize.replace('px', '');
    if (actualFontSize !== targetFontSize) {
      document.documentElement.style.fontSize = targetFontSize * targetFontSize / actualFontSize + 'px';
    }
  }

  // 立即设置
  setRootSize();

  // 每当容器尺寸发生变化，重新设置
  window.addEventListener("resize", setRootSize, false);
})();
