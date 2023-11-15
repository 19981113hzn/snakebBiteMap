const wsUrl = process.env.VUE_APP_WS_SERVE_URL
const lockReconnect = false //避免ws重复连接
const ws = null // 判断当前浏览器是否支持WebSocket
//心跳检测
const heartCheck = {
    timeout: 1000, //1分钟发一次心跳
    timeoutObj: null,
    serverTimeoutObj: null,
    reset: function() {
        clearTimeout(this.timeoutObj)
        clearTimeout(this.serverTimeoutObj)
        return this
    },
    start: function() {
        const self = this
        this.timeoutObj = setTimeout(function() {
            //这里发送一个心跳，后端收到后，返回一个心跳消息，
            //onmessage拿到返回的心跳就说明连接正常
            ws.send("ping")
            console.log("ping!")
            self.serverTimeoutObj = setTimeout(function() { //如果超过一定时间还没重置，说明后端主动断开了
                ws.close() //如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
            }, self.timeout)
        }, this.timeout)
    }
}

export default class SocketService {
    constructor() {
        this.ws = null
    }

    static get Instance() {
        if (!this.instance) {
            const url = 'ws://47.102.20.181:22120/ws/case'
            this.instance = new SocketService(true, wsUrl)
        }
        return this.instance
    }

    createWebSocket() {
        try {
            if ('WebSocket' in window) {
                ws = new WebSocket(url)
            }
            initEventHandle()
        } catch (e) {
            reconnect(url)
            console.log(e)
        }
    }

    reconnect(url) {
        if (lockReconnect) return
        lockReconnect = true
        setTimeout(function() { //没连接上会一直重连，设置延迟避免请求过多
            createWebSocket(url)
            lockReconnect = false
        }, 2000)
    }

    initEventHandle() {
        ws.onclose = function() {
            reconnect(wsUrl)
            console.log("llws连接关闭!" + new Date().toLocaleString())
        }
        ws.onerror = function() {
            reconnect(wsUrl)
            console.log("llws连接错误!")
        }
        ws.onopen = function() {
            heartCheck.reset().start() //心跳检测重置
            console.log("llws连接成功!" + new Date().toLocaleString())
        }
        ws.onmessage = function(event) { //如果获取到消息，心跳检测重置
            heartCheck.reset().start() //拿到任何消息都说明当前连接是正常的
            console.log("llws收到消息啦:" + event.data)
            if (event.data != 'pong') {
                let data = JSON.parse(event.data)
            }
        }
    }
}
