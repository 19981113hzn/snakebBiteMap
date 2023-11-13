const path = require('path')

module.exports = {
    publicPath: '/',
    outputDir: process.env.outputDir,
    assetsDir: 'static',
    productionSourceMap: false,
    devServer: {
        port: 8080,
    },
    configureWebpack: {
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src')
            }
        },
        module: {
            rules: [{
                test: /\.js$/,
                loader: 'babel-loader',
                include: [path.resolve(__dirname, 'node_modules/echarts')]
            }]
        }
    },
    chainWebpack: config => {
        config.plugin('provide')
            .use(require('webpack').ProvidePlugin, [{
                echarts: 'echarts'
            }])
    }
}