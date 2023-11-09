import axios from "axios"

const mock_host = `http://${location.hostname}:3800`
const host = process.env.VUE_APP_SERVE_URL

const http = axios.create({
    // baseURL: process.env.VUE_APP_MOCK ?  mock_host : host + '/snakebite',
    baseURL: mock_host + '/snakebite',
})

class Api {
    static Storage = {
        TOKEN: 'token'
    }

    static httpHeaders = {
        'Content-Type': 'multipart/form-data'
    }

    static httpCode = {
        OK: 200,
        INFO: 201,
    }

    static domain = document.domain || window.location.host

    constructor() {
        this.init()
    }

    init() {
        // 设置token
        this.authorization = {}
        Object.defineProperty(this.authorization, 'token', {
            set: (t) => {
                if (!localStorage) return
                localStorage.setItem(Api.Storage.TOKEN, t)
            },

            get: () => {
                if (!localStorage) return null
                return localStorage.getItem(Api.Storage.TOKEN)
            }
        })

        // 请求拦截
        http.interceptors.request.use((config) => {
            if (this.authorization.token) document.cookie = `sid=${this.authorization.token}`
            config.headers = Object.assign({}, config.headers, Api.httpHeaders)

            return config
        }, (error) => {
            return Promise.reject(error.data)
        })

        // 响应设置：防止多次设置
        if (http.interceptors.response.handlers.length) http.interceptors.response.handlers = []

        http.interceptors.response.use((response) => {
            // 返回默认格式
            const statusCode = response.status,
                OK = Api.httpCode.OK,
                INFO = Api.httpCode.INFO
            if (statusCode != OK && statusCode != INFO) return Promise.reject(response.data || 'error')

            return response.data
        }, (error) => {
            return Promise.reject(error.data)
        })
    }

    /**
     * Get提交
     * 
     * @param {String} url 地址
     * @param {Object} params 参数
     */
    httpGet(url = '', params = {}, headers = Api.httpHeaders) {
        if (this.authorization.token) params['session'] = this.authorization.token

        return http.get(url, {
                params,
                headers
            })
            .catch(err => {
                Promise.reject(err)
            })
    }

    /**
     * Post提交
     * 
     * @param {String} url 地址
     * @param {Object} data 数据
     */
    httpPost(url = '', data = {}) {
        const formData = new FormData()
        for (let key in data) {
            formData.append(key, data[key])
        }

        if (this.authorization.token) {
            data['session'] = this.authorization.token

            if (url.match(/\?/)) {
                url += `&session=${this.authorization.token}`
            } else {
                url += `?session=${this.authorization.token}`
            }
        }

        return http.post(url, formData)
            .catch(err => Promise.reject(err))
    }

    getHospitals(param) {
        return this.httpGet(`/hospitals`, param)
    }

    getHospitalByName (param) {
        const name = param.name
        return this.httpGet(`/hospitals/${name}`, param)
    }

    getHospitalCountByArea (param) {
        return this.httpGet(`/hospitals/count?area=${param.area}`, param)
    }

    getSnakebiteCount (param) {
        return this.httpGet(`/hospitals/count`, param)
    }

    getAntivenomCount (param) {
        return this.httpGet(`/hospitals/antivenom/count`, param)
    }
}

const api = new Api()

export default api
