class Ua {
    get agent() {
        console.log('%c [ navigator.userAgent ]-4', 'font-size:13px; background:pink; color:#bf2c9f;', navigator.userAgent)
        return navigator.userAgent
    }

    constructor() {}

    /**
     * 是否安卓
     */
    isAndroid() {
        return this.agent.indexOf('Android') > -1 || this.agent.indexOf('Linux') > -1
    }

    /**
     * 是否IOS
     */
    isIos() {
        return this.agent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)
    }

    /**
     * 是否Mac
     */
    isMac() {
        return this.agent.indexOf('Mac') > -1
    }

    /**
     * 是否移动端
     */
    isMobile() {
        let flag = navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)
        return flag
    }

    /**
     * 是否Windows
     */
    isWindows() {
        return this.agent.indexOf('Windows') > -1
    }
}

export default new Ua()