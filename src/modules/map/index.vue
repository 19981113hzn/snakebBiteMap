<template>
    <div class="map-view" ref="mapContainer" style="width: 100%;height: 100%;">

    </div>
</template>
  
<script>
import * as echarts from 'echarts'
import "echarts-extension-amap"
import SocketService from "@/plugin/websocket"

const AMap = window.AMap || null
const screenWidth = window.innerWidth

let initZoom = 4.2,
    initCitySymbolSize = 6,
    initBasicSymbolSize = 4

if (screenWidth < 768) {

    initZoom = 3.5
} else if (screenWidth < 992) {
    initZoom = 4
} else if (screenWidth < 1200) {
    initCitySymbolSize = 4
    initBasicSymbolSize = 2
    initZoom = 4
} else if (screenWidth > 1920) {
    initZoom = 4.8
}

export default {
    name: 'MapView',
    data() {
        return {
            echartsMap: null,
            amap: null,
            cityHospitals: [],
            basicHospitals: null,
            newScatters: [],
            ws: null,
            hospitalInfos: [],
            originalCenter: [98.39, 33.9],
            currentCenter: [98.39, 33.9],
            originalZoom: initZoom,
            currentZoom: initZoom,
            option: null,
            markers: [], // 存储自定义图片的marker
            isScatterShown: true,
            isMarkerShown: false,
            showBackToHome: true,
            initAmapOption: {
                viewMode: '3D',
                center: [98.39, 33.9],
                zoom: initZoom,
                resizeEnable: true,
                renderOnMoving: true,
                animationDurationUpdate: 0,
                mapStyle: 'amap://styles/fresh',
                echartsLayerInteractive: true,
                labelzIndex: 100,
                roam: true
            },
            citySymbolSize: initCitySymbolSize,
            basicSymbolSize: initBasicSymbolSize,
            infoWindow: null,
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
            this.initMap()
            this.initAMap()
        },

        /**
         * 连接websocket
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
            // 增量数据
            if (data.dataType === 1 && this.$store.state.data && (data.statisticsInfo || data.hospitalInfos)) {
                let newData = this.$store.state.data || {},
                    IsStatisticsInfoEqual = false

                // 如果有统计信息返回，判断统计信息是否有更新
                if (data.statisticsInfo) {
                    // 判断statisticsInfo是否相同
                    IsStatisticsInfoEqual = JSON.stringify(data.statisticsInfo) === JSON.stringify(newData.statisticsInfo)
                    // 如果统计信息相同并且没有返回医院数据 则直接返回
                    if (IsStatisticsInfoEqual && !data.hospitalInfos) return
                    newData.statisticsInfo = data.statisticsInfo
                }

                // 如果统计信息更新了，并且没有医院信息返回，则只刷新统计信息
                if (!data.hospitalInfos && !IsStatisticsInfoEqual) {
                    this.$store.dispatch('setData', newData)
                    return
                }

                // 过滤掉相同的医院，获取新的hospitalInfos
                const newHospitals = data.hospitalInfos.filter((hospital) => {
                    return !this.hospitalInfos.some((info) => {
                        return info.latitude === hospital.latitude && info.longitude === hospital.longitude
                    })
                })

                // 相同的医院 可能有不同的数据
                const sameHospitals = data.hospitalInfos.filter((hospital) => {
                    return this.hospitalInfos.some((info) => {
                        return info.latitude === hospital.latitude && info.longitude === hospital.longitude
                    })
                })

                // 相同的医院
                if (sameHospitals && sameHospitals.length !== 0) {
                    // 将相同医院的不同数据更新
                    this.hospitalInfos.forEach((item, index) => {
                        sameHospitals.forEach((itm, idx) => {
                            if (item.latitude === itm.latitude && item.longitude === itm.longitude) {
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

            this.init()
        },

        /**
         * 处理地图缩放
         */
        handleZoom() {
            if (!this.echartsMap || !this.amap) return

            const center = this.amap.getCenter()

            this.currentZoom = this.amap.getZoom()
            this.currentCenter = [center.lng, center.lat]

            this.citySymbolSize = 6 * (Math.pow(1.3, this.currentZoom - this.originalZoom))
            this.basicSymbolSize = 4 * (Math.pow(1.3, this.currentZoom - this.originalZoom))

            //marker 和 scatters 的显隐
            if (this.currentZoom <= 10) {
                this.setOptions()
                if (!this.isScatterShown) {
                    this.isScatterShown = true
                }

                if (this.isMarkerShown) {
                    this.isMarkerShown = false
                    this.removeMarker()
                }
            } else {
                if (!this.isMarkerShown) {
                    this.isMarkerShown = true
                    this.addMarkers()
                }

                if (this.isScatterShown) {
                    this.isScatterShown = false
                    this.hideScatters()
                }
            }

            if (this.currentZoom !== this.originalZoom) this.$parent.changeShowBackToHome(true)
        },

        /**
         * handleMove 移动结束时
         */
        handleMove() {
            const amapComponent = this.echartsMap.getModel().getComponent('amap')
            const amap = amapComponent.getAMap()

            const center = amap.getCenter()

            if (center.lng !== this.originalCenter[0] || center.lat !== this.originalCenter[1]) {
                this.$parent.changeShowBackToHome(true)
            }
        },

        /**
         * 处理散点大小
         */
        handleSymbolSize(value, params) {
            const type = params.data.region
            return type == 1 ? this.citySymbolSize : this.basicSymbolSize
        },

        /**
         * 添加marker
         */
        addMarkers() {
            let icon = null
            const markers = []

            const setIconSize = (size) => {
                icon = new AMap.Icon({
                    size: new AMap.Size(size, size),
                    image: 'https://bn.devfp.ps.netease.com/file/65523f2528dafdbe7170e872RaA8XQXL02',
                    imageSize: new AMap.Size(size, size)
                })
            }

            this.hospitalInfos.forEach((item, index) => {
                setIconSize(36)

                const marker = new AMap.Marker({
                    position: item.value,
                    icon: icon,
                    offset: new AMap.Pixel(-12, -36),
                    zIndex: 100,
                    map: this.amap
                })
                marker.on('click', () => {
                    setIconSize(48)
                    marker.setIcon(icon)
                    this.showTooltip(item)

                    this.infoWindow.on('close', () => {
                        setIconSize(36)
                        marker.setIcon(icon)
                    })
                })

                markers.push(marker)
            })
            this.markers = markers
        },

        /**
         * 移除marker
         */
        removeMarker() {
            this.markers.forEach(marker => {
                marker.setMap(null)
            })
            this.markers = []
        },

        /**
         * 展示tooltip
         */
        showTooltip(item) {
            const authNum = item.authNum ? item.authNum : 0,
                calculatelnventory = item.calculatelnventory ? item.calculatelnventory : 0

            const content = '<div class="info_window">' +
                '<p class="info_name">机构名称：' + item.name + '</p>' +
                '<p class="info_address info_second">地址：' + item.address + '</p>' +
                '<p class="info_docnum info_second">医生数量：' + authNum + '</p>' +
                '<p class="info_lnventory info_second">抗蛇毒血清计算库存数：' + calculatelnventory + '</p>' +
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

            this.infoWindow = infoWindow


            infoWindow.open(this.amap, item.value)
        },

        /**
         * 隐藏散点
         */
        hideScatters() {
            // 设置散点数据为空
            const emptyScatterData = {
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

            this.setOptions(emptyScatterData)
        },

        /**
         * 设置Ehechart+地图配置
         */
        setOptions(data) {
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
                        symbolSize: this.handleSymbolSize,
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
            this.echartsMap.setOption(option)
            this.initAMap()
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

            // 监听地图缩放 移动
            amap.on("zoomend", this.handleZoom)
            amap.on("moveend", this.handleMove)

            // 禁用 ECharts 图层交互，从而使高德地图图层可以点击交互
            amapComponent.setEChartsLayerInteractive(false)

            // 初始化地图的时候 先隐藏marker
            // this.hideMarkers()
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
         * 回到初始状态
         */
        backToHome() {
            this.amap.setZoomAndCenter(this.originalZoom, this.originalCenter)
        }
    }
}
</script>
  
<style scoped>
@import url('./index.less');
</style>