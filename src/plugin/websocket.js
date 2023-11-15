const wsUrl = process.env.VUE_APP_WS_SERVE_URL
export default class SocketService {
    constructor(againConnect = true, url) {
        this.url = url
        this.againConnect = againConnect
    }
    instance = null //页面中使用的SocketService实例
    ws = null // 和服务端连接的socket对象
    url //地址
    againConnect = true //断开是否重连
    connected = false // 标识是否连接成功
    sendRetryCount = 0 // 记录重试的次数
    connectRetryCount = 0 // 重新连接尝试的次数
    messages = [] //接收的消息/数据
    callback = null //接收数据的回调
    reconnectTimeout = 10000 // 连接失败重连的间隔时间

    //单例模式保证只有一个SocketService实例
    static get Instance() {
        if (!this.instance) {
            this.instance = new SocketService(true, wsUrl)
        }
        return this.instance
    }

    //  定义连接服务器的方法
    connect() {
        // 判断览器是否支持websocket
        if (!window.WebSocket) {
            throw new Error('您的浏览器不支持WebSocket')
        }

        // 自动重连
        // this.ws = new Rwebsocket(this.url, null, {debug: false, reconnectInterval: 4000})
        this.ws = new WebSocket(this.url)

        //连接
        this.ws.onopen = () => {
            console.log('websocket连接成功!')
            this.connected = true
            // 重置重新连接的次数
            this.connectRetryCount = 0
        }

        //连接关闭了，设置标识值为false
        this.ws.onclose = (e) => {
            console.log(`websocket断开: ${e.code} ${e.reason} ${e.wasClean}`)
            this.connected = false
            this.connectRetryCount++

            // 如果断开需要重连
            if (this.againConnect) {
                console.log('websocket重连...')
                setTimeout(() => {
                    this.connect()
                }, this.reconnectTimeout)
            } else {
                sessionStorage.clear()
                localStorage.clear()
                console.log("websocket正在建立连接中...，无需重新连接，下次断开需重新连接")
            }
        }

        this.ws.onerror = () => {
            console.log("websocket连接失败!")
            this.connected = false
            this.connectRetryCount++
            if (this.againConnect) {
                setTimeout(() => {
                    this.connect()
                }, 500 * this.connectRetryCount)
            }
        }

        this.ws.onmessage = (e) => {
            console.log("客户端接收到了websocket消息!")
            this.messages = JSON.parse(e.data)
            if (this.callback) this.callback(this.messages)
        }
    }

    //关闭连接 停止发送消息
    unSubscribe() {
    console.log('%c [ 关闭连接 ]-85', 'font-size:13px; background:pink; color:#bf2c9f;')
        this.ws.close()
        this.ws = null
    }

    // 发送数据的方法
    sendMessage(data, callback) {
        this.callback = callback
        //判断此时有没有ws
        if (!this.ws) {
            this.connect()
            this.sendMessage(data, callback)
        } else {
            // 判断此时此刻有没有连接成功
            if (this.connected) {
                this.sendRetryCount = 0
                // 使用连接发送数据
                this.ws.send(JSON.stringify(data))
                // this.callback = callback
            } else {
                this.sendRetryCount++
                setTimeout(() => {
                    this.sendMessage(data, callback)
                }, this.sendRetryCount * 500)
            }
        }
    }
}