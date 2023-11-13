<template>
    <div class="map-view" ref="mapContainer" style="width: 100%;height: 100%;">

    </div>
</template>
  
<script>
import * as echarts from 'echarts'
import "echarts-extension-amap"
import SocketService from "@/plugin/websocket"

const AMap = window.AMap || null

export default {
    name: 'MapView',
    data() {
        return {
            echartsMap: null,
            cityHospitals: [],
            basicHospitals: null,
            newScatters: [],
            ws: null,
            hospitalInfos: [],
            statisticsInfo: null,
            currentZoom: 4.8,
            option: null,
            markers: [], // 存储自定义图片的marker
            isScatterShown: true,
            currentCenter: [98.39, 33.9],
        }
    },
    computed: {
    },
    mounted() {
        this.getData()
    },
    beforeDestroy() {
        // 销毁webscoket实例
        this.ws.unSubscribe()
    },
    methods: {
        /**
         * 初始化
         */
        init() {
            this.initOptions()
            this.initMap()
        },

        /**
         * websocket
         */
        getData() {
            this.ws = SocketService.Instance

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
            this.hospitalInfos = data.hospitalInfos
            this.statisticsInfo = data.statisticsInfo

            // 过滤无效经纬度
            this.hospitalInfos = this.hospitalInfos.filter(item => {
                return !isNaN(item.latitude) && !isNaN(item.longitude)
            })

            this.hospitalInfos.forEach((item, index) => {
                item.value = [Number(item.longitude), Number(item.latitude)]
            })

            this.$store.dispatch('setData', data)

            this.newScatters = this.hospitalInfos.filter(item => {
                return item.flickerFlag
            })

            this.cityHospitals = this.hospitalInfos.filter((item, index) => {
                return item.region === 1
            })

            this.$store.dispatch('setCityData', this.cityHospitals)

            this.basicHospitals = this.hospitalInfos.filter((item, index) => {
                return item.region === 0
            })

            this.$store.dispatch('setBasicData', this.basicHospitals)

            this.init()
        },

        /**
         * 处理地图缩放
         */
        handleZoom() {
            if (!this.echartsMap) return

            const amapComponent = this.echartsMap.getModel().getComponent('amap')
            const amap = amapComponent.getAMap()
            const center = amap.getCenter()

            this.currentZoom = amap.getZoom()

            this.currentCenter = [center.lng, center.lat]

            // this.setOption()
            console.log('%c [ this.currentZoom ]-212', 'font-size:13px; background:pink; color:#bf2c9f;', this.currentZoom)

            if (this.currentZoom <= 10) {
                this.hideMarkers()
                if (!this.isScatterShown) {
                    this.isScatterShown = true
                    this.initOptions()
                }
            } else {
                this.showMarkers()
                this.hideScatters()
                this.isScatterShown = false
            }
        },

        handleSymbolSize(zoom, value) {
            // 获取 ECharts 高德地图组件
            const amapComponent = this.echartsMap.getModel().getComponent('amap')

            // 获取高德地图实例，使用高德地图自带的控件(需要在高德地图js API script标签手动引入)
            const amap = amapComponent.getAMap()
            // return this.currentZoom * 2
            // this.echartsMap.setOption(this.option)
        },

        //set option
        setOption() {
            this.option.series.forEach((series) => {
                series.symbolSize = (value, params) => {
                    const type = params.data.region,
                        originSize = type == 1 ? 6 : 4

                    const size = originSize * Math.pow(2, this.currentZoom - 4.8)
                    return size
                }
            })

            this.echartsMap.setOption(this.option)
        },

        /**
         * marker
         */
        addMarkers() {
            const markers = []
            this.hospitalInfos.forEach((item, index) => {
                const icon = new AMap.Icon({
                    size: new AMap.Size(18, 18),
                    image: 'https://bn.devfp.ps.netease.com/file/65523f2528dafdbe7170e872RaA8XQXL02',
                    imageSize: new AMap.Size(18, 18)
                })

                const marker = new AMap.Marker({
                    position: item.value,
                    icon: icon,
                    offset: new AMap.Pixel(-12, -36),
                    zIndex: 101,
                    map: this.echartsMap.getModel().getComponent('amap').getAMap()
                })
                marker.on('click', () => {
                    this.showTooltip(item)
                })
                markers.push(marker)
            })
            this.markers = markers
        },

        showTooltip(item) {
            const content = '<div class="info_window">' +
                '<p class="info_name">机构名称：' + item.name + '</p>' +
                '<p class="info_address">地址：' + item.address + '</p>' +
                '</div>'

            const infoWindow = new AMap.InfoWindow({
                content: content,
                offset: new AMap.Pixel(0, -30),
                closeWhenClickMap: true,
                isCustom: false, //使用默认样式
                autoMove: true,
                showShadow: false,
                zIndex: 102,
                position: item.value
            })

            infoWindow.open(this.echartsMap.getModel().getComponent('amap').getAMap(), item.value)

        },

        hideMarkers() {
            console.log('%c [ hideMarkers ]-204', 'font-size:13px; background:pink; color:#bf2c9f;')
            this.markers.forEach(marker => {
                marker.hide()
            })
        },

        showMarkers() {
            this.markers.forEach(marker => {
                marker.show()
            })
        },

        hideScatters() {
            let option = {
                amap: {
                    viewMode: '3D',
                    center: this.currentCenter,
                    zoom: this.currentZoom,
                    resizeEnable: true,
                    renderOnMoving: true,
                    animationDurationUpdate: 0,
                    mapStyle: 'amap://styles/fresh',
                    echartsLayerInteractive: true,
                    labelzIndex: 100,
                    roam: true,

                },
                series: [
                    {
                        type: 'effectScatter',
                        coordinateSystem: 'amap',
                        data: [],
                    },
                    {
                        type: 'scatter',
                        coordinateSystem: 'amap',
                        data: [],
                    },
                    {
                        type: 'scatter',
                        coordinateSystem: 'amap',
                        data: [],
                    },
                ],
            }

            this.option = option

            if (!this.echartsMap) this.echartsMap = echarts.init(this.$refs.mapContainer)

            this.echartsMap.setOption(option)
            
            this.initMap()
        },

        /**
         * 初始化Ehechart+地图配置
         */
        initOptions() {
            let options = {
                amap: {
                    viewMode: '3D',
                    center: this.currentCenter,
                    zoom: this.currentZoom,
                    resizeEnable: true,
                    renderOnMoving: true,
                    animationDurationUpdate: 0,
                    mapStyle: 'amap://styles/fresh',
                    echartsLayerInteractive: true,
                    labelzIndex: 100,
                    roam: true,

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
                        symbolSize: function (value, params) {
                            const type = params.data.region
                            return type == 1 ? 6 : 4
                        },
                        rippleEffect: {
                            number: 5,
                            period: 3,
                            scale: 6.5,
                            brushType: 'stroke'
                        }
                    },
                    {
                        type: 'scatter',
                        coordinateSystem: 'amap',
                        data: this.cityHospitals,
                        itemStyle: {
                            color: '#4577ba',
                        },
                        symbolSize: 6,
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
                        symbolSize: 4,
                        large: true,
                        largeThreshold: 100
                    },

                ],
            }

            if (!this.echartsMap) this.echartsMap = echarts.init(this.$refs.mapContainer)
            this.echartsMap.setOption(options)
        },

        /**
         * 初始化高德地图
         */
        initMap() {
            // 获取 ECharts 高德地图组件
            const amapComponent = this.echartsMap.getModel().getComponent('amap')

            // 获取高德地图实例，使用高德地图自带的控件(需要在高德地图js API script标签手动引入)
            const amap = amapComponent.getAMap()

            // 添加控件  放大缩小
            amap.addControl(new AMap.Scale())

            // 监听地图缩放
            amap.on("zoomchange", this.handleZoom)
            amap.on("zoomend", this.handleSymbolSize)

            // 禁用 ECharts 图层交互，从而使高德地图图层可以点击交互
            amapComponent.setEChartsLayerInteractive(false)

            this.addMarkers()
            // 初始化地图的时候 先隐藏marker
            this.hideMarkers()
        }
    }
}
</script>
  
<style scoped>
@import url('./index.less');

.map-view {}

#container {
    cursor: grabbing;
}

#container:hover {
    cursor: grabbing;
}

#container .amap-marker-label {
    cursor: pointer;
}
</style>