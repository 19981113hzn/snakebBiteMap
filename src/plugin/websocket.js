import Rwebsocket from 'reconnecting-websocket'

export default class SocketService {
    constructor(againConnect = true, url) {
        this.url = url
        this.againConnect = true
    }
    instance = null //页面中使用的SocketService实例
    ws = null // 和服务端连接的socket对象
    url = 'ws://47.102.20.181:22120/ws/case' //地址
    againConnect = true //断开是否重连
    connected = false // 标识是否连接成功
    sendRetryCount = 0 // 记录重试的次数
    connectRetryCount = 0 // 重新连接尝试的次数
    messages = [] //接收的消息/数据
    callback = null //接收数据的回调

    //单例模式保证只有一个SocketService实例
    static get Instance() {
        if (!this.instance) {
            this.url = 'ws://47.102.20.181:22120/ws/case'
            this.instance = new SocketService(false, this.url)
        }
        return this.instance
    }

    //  定义连接服务器的方法
    connect() {
        // 判断览器是否支持websocket
        if (!window.WebSocket) {
            return console.log("您的浏览器不支持WebSocket")
        }

        // 自动重连
        this.ws = new Rwebsocket(this.url, null, {debug: false, reconnectInterval: 4000})
        
        //连接
        this.ws.onopen = () => {
            this.connected = true
            // 重置重新连接的次数
            this.connectRetryCount = 0
        }

        //连接关闭了，设置标识值为false
        this.ws.onclose = () => {
            this.connected = false
            this.connectRetryCount++

            // 如果断开需要重连
            if (this.againConnect) {
                setTimeout(() => {
                    this.connect()
                }, 10000)
            } else {
                sessionStorage.clear()
                localStorage.clear()

                console.error("登录超时")
            }
        }

        this.ws.onerror = () => {
            console.log("socket连接失败")
            this.connected = false
            this.connectRetryCount++
            if (this.againConnect) {
                setTimeout(() => {
                    this.connect()
                }, 500 * this.connectRetryCount)
            }
        }

        this.ws.onmessage = (e) => {
            this.messages = JSON.parse(e.data)
            if (this.callback) this.callback(this.messages)
        }
    }

    //关闭连接 停止发送消息
    unSubscribe() {
        this.ws.close()
        this.ws = null
    }

    // 发送数据的方法
    sendMessage(data, callback) {
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
                this.callback = callback
            } else {
                this.sendRetryCount++
                setTimeout(() => {
                    this.sendMessage(data, callback)
                }, this.sendRetryCount * 500)
            }
        }
    }
}