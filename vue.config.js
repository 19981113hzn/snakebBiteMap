const path = require('path')

module.exports = {
    publicPath: '/',
    outputDir: 'dist',
    assetsDir: 'static',
    productionSourceMap: false,
    devServer: {
        port: 8080,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
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