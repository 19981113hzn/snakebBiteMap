<template>
    <div class="map-view" ref="mapContainer">

    </div>
</template>
  
<script>
import * as echarts from 'echarts'
import "echarts-extension-amap"
import SocketService from "@/plugin/websocket"
import LabelsData from '@/assets/data/provinces'


const AMap = window.AMap || null
const screenWidth = window.innerWidth

let initZoom = 5.0,
    initCitySymbolSize = 6,
    initBasicSymbolSize = 4,
    initCenter = [98.39, 37.4]

if (screenWidth <= 768) {
    initZoom = 3.5
}
else if (screenWidth <= 992) {
    initZoom = 4.2
}
else if (screenWidth <= 1280) {
    initCitySymbolSize = 4
    initBasicSymbolSize = 2
    initCenter = [98.39, 33.9]
    initZoom = 4.5
}
else if (screenWidth <= 1680) {
    initCenter = [98.39, 35.9]
    initZoom = 4.5
}
else if (screenWidth <= 1920) {
    initCenter = [98.39, 37.9]
    initZoom = 4.8
}
else if (screenWidth > 1920) {
    initCenter = [98.39, 37.4]
    initZoom = 5.2
}

// 移动端暂不处理
else if (screenWidth <= 375) {
    initCitySymbolSize = 2
    initBasicSymbolSize = 1
    initCenter = [98.39, 33.9]
    initZoom = 0.1
}

export default {
    name: 'MapViewPC',
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
            layerProvince: {},
            showProvince: true,
            showMapLine: false,
            polyline: null
        }
    },
    computed: {
    },
    mounted() {
        this.getData()
    },
    destroyed() {
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
                const amapComponent = this.echartsMap.getModel().getComponent('amap')
                const canvas = document.getElementsByTagName('canvas')[1]
                canvas.style.cursor = 'pointer'
                amapComponent.setEChartsLayerInteractive(false)

                if (!this.isMarkerShown) {
                    this.isMarkerShown = true
                    this.addMarkers()
                }

                if (this.isScatterShown) {
                    this.isScatterShown = false
                    this.hideScatters()
                }
            }

            // 回到首页按钮的显隐
            if (this.currentZoom !== this.originalZoom) this.$parent.changeShowBackToHome(true)
        },

        /**
         * ZoomMore
         */
        handleZoomMore() {
            // 增大缩放和放大的步进
            const now = new Date().getTime()
            // 判断两次缩放的时间间隔是否太短
            if (this.lastZoomTime && now - this.lastZoomTime < 800) {
                return
            }
            this.lastZoomTime = now
            const zoomStep = 0.5
            const maxZoom = this.amap.getZooms()[1],
                minZoom = this.amap.getZooms()[0]

            const zoom = this.amap.getZoom()

            if (this.lastZoom <= this.originalZoom || this.lastZoom >= maxZoom) return

            const zoomOffset = this.currentZoom - this.lastZoom
            const nextZoom = zoomOffset > 0 ? zoom + zoomStep : zoom - zoomStep

            // 判断最新缩放的下限和上限
            if (nextZoom >= maxZoom) {
                return this.amap.setZoomAndCenter(maxZoom, this.currentCenter)
            } else if (nextZoom <= minZoom) {
                return this.amap.setZoomAndCenter(this.originalZoom, this.currentCenter)
            }

            this.amap.setZoomAndCenter(nextZoom, this.currentCenter)
        },
        /**
         * 加大缩放
         */
        handleZoomStart(e) {
            const zoom = this.amap.getZoom()
            this.lastZoom = zoom
        },

        /**
         * handleMove 移动结束时
         */
        handleMove() {
            const amapComponent = this.echartsMap.getModel().getComponent('amap'),
                amap = amapComponent.getAMap(),
                center = amap.getCenter()

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

            const setIconSize = (size, image) => {
                icon = new AMap.Icon({
                    size: new AMap.Size(size, size),
                    image: image,
                    imageSize: new AMap.Size(size, size)
                })
            }

            const normalScatters = this.hospitalInfos.filter(item => {
                return !item.flickerFlag
            })

            const image = 'https://bn.devfp.ps.netease.com/file/65548f47671882f53acecab51Lw2U74x02'

            normalScatters.forEach((item, index) => {
                setIconSize(36, image)
                const marker = new AMap.Marker({
                    position: item.value,
                    icon: icon,
                    zIndex: 100,
                    map: this.amap,
                    topWhenClick: true,
                })
                marker.on('click', () => {
                    this.showTooltip(item)
                    marker.setAnimation('AMAP_ANIMATION_DROP')
                    this.infoWindow.on('close', () => {
                        setIconSize(36, image)
                        marker.setIcon(icon)
                    })
                })

                markers.push(marker)
            })

            // 闪烁点
            this.newScatters.forEach((item, index) => {
                const content = `
                        <img class="custom_marker_icon" width="36" height="36" src="${image}"/>    
                `
                setIconSize(36, image)
                const marker = new AMap.Marker({
                    position: item.value,
                    content: content,
                    zIndex: 100,
                    map: this.amap,
                    topWhenClick: true,
                })
                marker.on('click', () => {
                    // setIconSize(48, image)
                    // marker.setIcon(icon)
                    this.showTooltip(item)

                    this.infoWindow.on('close', () => {
                        setIconSize(36, image)
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
                calculateInventory = item.calculateInventory ? item.calculateInventory : 0
            // '<p class="info_docnum info_second">医生数量：' + authNum + '</p>' +

            const content = '<div class="info_window">' +
                '<p class="info_name">机构名称：' + item.name + '</p>' +
                '<p class="info_address info_second">地址：' + item.address + '</p>' +
                '<p class="info_lnventory info_second">抗蛇毒血清计算库存数：' + calculateInventory + '</p>' +
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
        },

        /**
         * 显示隐藏胡焕庸线
         */
        showHhyline() {
            this.showMapLine = !this.showMapLine
            if (!this.showMapLine) {
                this.polyline.hide()
            } else {
                if (!this.polyline) {
                    const polyline = new AMap.Polyline({
                        path: [
                            [127.500704, 50.252449],
                            [98.490382, 25.020147]
                        ],
                        cursor: 'pointer',
                        strokeColor: '#E4BD9D',
                        strokeWeight: 2,
                        strokeOpacity: 1
                    })
                    this.polyline = polyline
                    this.amap.add(this.polyline)
                }
                this.polyline.show()
            }
        }
    }
}
</script>
  
<style scoped>
@import url('./index.less');
</style>