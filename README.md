# snakebite-map 蛇伤热力图

## Project scripts

```
yarn 安装
yarn serve 开发环境
yarn build 打包
```

## Project frame
- mock 模拟接口数据 
    - 启动 yarn mock 启动一个mock服务
    - api 定义接口 模拟返回数据
    - data 本地存储的数据  可自行清空为空数组 []
    - See [Configuration Reference](https://github.com/nuysoft/Mock/wiki/Getting-Started).
- public
- src
    - assets 静态资源
        - data 地图数据
    - components 公共组件
    - plugin 插件/公共组件/VUE拓展
        - api 公共api封装：通过class extends继承，参考modules
        
    - modules 模块
        - map 地图
        - statistics 数据
    - router 全局路由
    - store 全局store
- .env 是相关环境的配置文件

See [Configuration Reference](https://cli.vuejs.org/config/).
