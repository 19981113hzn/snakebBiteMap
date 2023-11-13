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
            initialZoom: 4.8,
            option: null
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
         * 初始化地图
         */
        initMap() {
            let option = {
                animation: true,
                tooltip: {
                    trigger: 'item',
                    formatter: (params) => {
                        let content = '<div>' +
                            '<p>机构名称：' + params.data.name + '</p>' +
                            '<p>地址：' + params.data.address + '</p>'
                        // '<p>认证医生数：' + params.data.doctor_num + '</p>' +
                        // '<p>抗蛇毒血清计算库存数：' + params.data.antivenom_num + '</p>' +
                        return content
                    }
                },
                amap: {
                    viewMode: '3D',
                    center: [98.39, 33.9],
                    zoom: 4.8,
                    resizeEnable: true,
                    renderOnMoving: true,
                    animationDurationUpdate: 0,
                    mapStyle: 'amap://styles/fresh',
                    echartsLayerInteractive: true,
                    labelzIndex: 100,
                    roam: true,
                    // zoomstart: function (v) {
                    //     console.log('%c [ v ]-70', 'font-size:13px; background:pink; color:#bf2c9f;', v)
                    //     amap.setOptions({
                    //         labelzIndex: 100 // 开始缩放时显示文字标注
                    //     })
                    // },
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
                    }
                ],
            }

            this.option = option

            if (!this.echartsMap) this.echartsMap = echarts.init(this.$refs.mapContainer)

            this.echartsMap.setOption(option)

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
            // amapComponent.setEChartsLayerInteractive(false)
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

            this.initMap()
        },

        handleZoom() {
            if (!this.echartsMap) return

            const amapComponent = this.echartsMap.getModel().getComponent('amap')
            const amap = amapComponent.getAMap()
            const center = amap.getCenter()

            this.currentZoom = amap.getZoom()
            this.option.amap.zoom = amap.getZoom()
            this.option.amap.center = [center.lng, center.lat] 

            this.setOption()
        },

        handleSymbolSize(zoom, value) {
            // 获取 ECharts 高德地图组件
            const amapComponent = this.echartsMap.getModel().getComponent('amap')

            // 获取高德地图实例，使用高德地图自带的控件(需要在高德地图js API script标签手动引入)
            const amap = amapComponent.getAMap()
            console.log('%c [ amap ]-222', 'font-size:13px; background:pink; color:#bf2c9f;', amap)

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
        }
    }
}
</script>
  
<style scoped>
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