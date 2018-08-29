## dvd-base-build-node-ssr
**Author:** sunweiguang [源码地址](http://gitlab.rd.vyohui.com/FE-Service/dvd-service-scss-common.git)

## 使用方法：
#### 1.在gulpfile.babel.js文件中引入dvd-base-build-node-ssr。
#### 2.在package.json文件中加入
    "scripts": {
       "create": "gulp task_create",
       "start": "gulp"
     },


#### 3.设置构建方式：
  在项目的package.json中指定 "type": "spa" 即可使用spa构建方式（参照book小书库项目）；不指定则默认为mpa构建方式。


## 启动方式：
    * 启动命令：npm start
    * 功能: 开发者编译参数配置
    * 说明: 将编译参数配置到当前配置文件后，无需手动从命令行输入编译参数
    * 命令行指定编译参数规范: env=xxx num=xxx mini=xxx npm start
    * 命令行指定编译参数示例: env=dev num=6 mini=true npm start
    * config参数说明：
    * env    当前开发阶段，取值范围: [''|'dev'|'beta'|'gray'|'prod']，默认''
    * num    当前开发分支，取值范围: [''|数字]，默认''
    * mini   是否资源优化，取值范围: [false|true]，默认false
    * page   src/page/目录下需要编译的页面，如'*'表示所有页面，'center'表示单页面，
