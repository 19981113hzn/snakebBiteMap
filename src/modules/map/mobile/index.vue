<template>
    <div class="map-view" ref="mapContainer">

    </div>
</template>

<script>
import * as echarts from 'echarts'
import "echarts-extension-amap"
import SocketService from "@/plugin/websocket"

const AMap = window.AMap || null

let initZoom = 5.0,
    initCitySymbolSize = 6,
    initBasicSymbolSize = 4,
    initCenter = [98.39, 37.4]

export default {
    name: 'MapViewMobile',
    mixins: [],
    components: {},
    data() {
        return {
            echartsMap: null,
            amap: null,
            cityHospitals: [],
            basicHospitals: null,
            newScatters: [],
            ws: null,
            hospitalInfos: [],
            originalCenter: initCenter,
            currentCenter: initCenter,
            originalZoom: initZoom,
            currentZoom: initZoom,
            option: null,
            markers: [], // 存储自定义图片的marker
            isScatterShown: true,
            isMarkerShown: false,
            showBackToHome: true,
            initAmapOption: {
                viewMode: '3D',
                center: initCenter,
                zoom: initZoom,
                resizeEnable: true,
                renderOnMoving: true,
                // animationDurationUpdate: 0,
                mapStyle: 'amap://styles/fresh',
                features: ['bg', 'road', 'building', 'point'],
                zooms: [initZoom, 18],
                // showLabel: false,
                // echartsLayerInteractive: true,

            },
            citySymbolSize: initCitySymbolSize,
            basicSymbolSize: initBasicSymbolSize,
            infoWindow: null,
            isInit: false,
            lastZoomTime: null,
            lastZoom: null,
        }
    },
    methods: {
        /**
         * 初始化
         */
        init() {
            this.isInit = true
            this.initMap()
        },
        /**
         * 连接websocket
         */
        getData() {
            this.ws = SocketService.Instance
            console.log('主动连接websocket发送消息')
            this.ws.sendMessage(
                {},
                this.handledata
            )
        },

        /**
         * 处理数据
         * @param {object} data -- websocket 服务器返回的数据
         */
        handledata(data) {
            // 增量数据
            if (data.dataType === 1 && this.$store.state.data && (data.statisticsInfo || data.hospitalInfos)) {
                // this.addData(data)

                let newData = this.$store.state.data || {}

                // 如果有信息返回，刷新数据
                if (data.statisticsInfo) {
                    newData.statisticsInfo = data.statisticsInfo
                    newData.date = data.date
                }

                // 没有医院信息返回，则只刷新统计信息
                if (!data.hospitalInfos) {
                    this.$store.dispatch('setData', newData)
                    return
                }

                // 过滤掉相同的医院，获取新的hospitalInfos
                const newHospitals = data.hospitalInfos.filter((hospital) => {
                    return !this.hospitalInfos.some((info) => {
                        return info.id === hospital.id
                    })
                })

                // 相同的医院 可能有不同的数据
                const sameHospitals = data.hospitalInfos.filter((hospital) => {
                    return this.hospitalInfos.some((info) => {
                        return info.id === hospital.id
                    })
                })

                // 相同的医院
                if (sameHospitals && sameHospitals.length !== 0) {
                    // 将相同医院的不同数据更新
                    this.hospitalInfos.forEach((item, index) => {
                        sameHospitals.forEach((itm, idx) => {
                            if (item.id === itm.id) {
                                this.hospitalInfos[index] = sameHospitals[idx]
                            }
                        })
                    })
                }

                // 如果有新的医院 将其添加 
                if (newHospitals && newHospitals.length !== 0) {
                    newHospitals.forEach((newInfo) => {
                        this.hospitalInfos.push(newInfo)
                    })
                }

                // 刷新数据
                newData.hospitalInfos = this.hospitalInfos
                this.$store.dispatch('setData', newData)

                this.classifyData()

                return
            }

            // 全量数据，完全替换
            this.$store.dispatch('setData', data)

            this.hospitalInfos = data.hospitalInfos
            this.classifyData()
            if (!this.isInit) this.init()
        },
        /**
        * 处理数据分类
        */
        classifyData() {
            // 过滤无效经纬度
            this.hospitalInfos = this.hospitalInfos.filter(item => {
                return !isNaN(item.latitude) && !isNaN(item.longitude)
            })

            this.hospitalInfos.forEach((item, index) => {
                item.value = [Number(item.longitude), Number(item.latitude)]
            })

            this.newScatters = this.hospitalInfos.filter(item => {
                return item.flickerFlag
            })

            this.cityHospitals = this.hospitalInfos.filter((item, index) => {
                return item.region === 1
            })

            this.basicHospitals = this.hospitalInfos.filter((item, index) => {
                return item.region === 0
            })
        },

        /**
         * 初始化整个地图 
         */
        initMap() {
            const initOPtion = {
                amap: this.initAmapOption
            }
            this.setOptions(initOPtion)
        },
        /**
         * 设置Ehechart+地图配置
         */
        setOptions(data) {
            //    if(this.echartsMap) this.echartsMap.clear()
            const initOptions = {
                amap: {
                    viewMode: '3D',
                    center: this.currentCenter,
                    zoom: this.currentZoom,
                    resizeEnable: true,
                    renderOnMoving: true,
                    animationDurationUpdate: 0,
                    mapStyle: 'amap://styles/fresh',
                    echartsLayerInteractive: true,
                    labelzIndex: -1,
                    roam: true,
                    // showLabel: false,
                    features: ['bg', 'road', 'building', 'point'],
                    zooms: [initZoom, 18],
                    // layers: [disCountry, disProvince],
                },
                series: [
                    {
                        type: 'effectScatter',
                        coordinateSystem: 'amap',
                        data: this.newScatters,
                        itemStyle: {
                            color: function (params) {
                                const type = params.data.region
                                return type == 1 ? '#4577ba' : '#1dc254'
                            }
                        },
                        symbolSize: this.handleSymbolSize,
                        rippleEffect: {
                            number: 3,
                            period: 2,
                            scale: 6,
                            brushType: 'fill'
                        },
                    },
                    {
                        type: 'scatter',
                        coordinateSystem: 'amap',
                        data: this.cityHospitals,
                        itemStyle: {
                            color: '#4577ba',
                        },
                        symbolSize: this.citySymbolSize,
                        large: true,
                        largeThreshold: 100,


                    },
                    {
                        type: 'scatter',
                        coordinateSystem: 'amap',
                        data: this.basicHospitals,
                        itemStyle: {
                            color: '#1dc254',
                        },
                        symbolSize: this.basicSymbolSize,
                        large: true,
                        largeThreshold: 100
                    },

                ],
            }

            // 不传data  则使用可跟随视图的option
            const option = Object.assign({}, initOptions, data)

            this.option = option

            if (!this.echartsMap) this.echartsMap = echarts.init(this.$refs.mapContainer)

            // 等待canvas渲染完成
            setTimeout(() => {
                this.addEchartsEvents()
            }, 500)

            // 防止上个渲染未完成进行下一个渲染报错
            // setTimeout(() => {
            this.echartsMap.setOption(option)
            this.initAMap()
            // }, 100)
        },

        /**
         * 初始化高德地图
         */
        initAMap() {
            // 获取 ECharts 高德地图组件
            const amapComponent = this.echartsMap.getModel().getComponent('amap')

            // 获取高德地图实例，使用高德地图自带的控件(需要在高德地图js API script标签手动引入)
            const amap = amapComponent.getAMap()

            this.amap = amap

            // 添加控件  放大缩小
            amap.addControl(new AMap.Scale())
            amap.addControl(new AMap.ToolBar({
                position: 'RB',
                // liteStyle: true
                // direction: false
            }))

            // 监听地图缩放 移动
            amap.on("zoomend", this.handleZoom)
            amap.on("zoomchange", this.handleZoomStart)
            amap.on("moveend", this.handleMove)

            // 胡焕庸线-黑河腾冲线
            const polyline = new AMap.Polyline({
                path: [
                    [127.500704, 50.252449],
                    [98.490382, 25.020147]
                ],
                strokeColor: '#E4BD9D',
                strokeWeight: 2,
                strokeOpacity: 1
            })
            polyline.setMap(amap)
        },

        /**
         * 添加echarts事件监听
         */
        addEchartsEvents() {
            const canvas = document.getElementsByTagName('canvas')[1]
            if (!canvas || !this.echartsMap) return

            const isScatter = (params) => {
                return params.componentType === 'series' && (params.seriesType === 'scatter' || params.seriesType === 'effectScatter')
            }
            canvas.style.cursor = 'grabbing'
            // 添加echarts点位交互
            this.echartsMap.on('click', (params) => {
                if (isScatter) {
                    this.showTooltip(params.data)
                }
            })

            this.echartsMap.on('mouseover', 'series', (params) => {
                if (isScatter) {
                    canvas.style.cursor = 'pointer'
                }
            })

            this.echartsMap.on('mouseout', 'series', (params) => {
                if (isScatter) {
                    canvas.style.cursor = 'grabbing'
                }
            })

        },
    },
    computed: {

    },
    created() {

    },
    mounted() {
        this.getData()
    },
    destroyed() {
    },
    beforeDestroy() {
        // 销毁webscoket实例
        this.ws.unSubscribe()
    }
}
</script>

<style lang="less" scoped>
@import url('./index.less');
</style>