<template>
    <div class="map-view" ref="mapContainer" style="width: 100%;height: 100%;">

    </div>
</template>
  
<script>
import * as echarts from 'echarts'
import chinaGeoJSON from '../../assets/data/chinaMap.json'
import api from '@/plugin/api'
import "echarts-extension-amap"
import SocketService from "@/plugin/websocket"

const AMap = window.AMap || null

export default {
    name: 'MapView',
    data() {
        return {
            echartsMap: null,
            hospitals: null,
            cityHospitals: [],
            basicHospitals: null,
            timer: null,
            refreshTime: 300000,
            newScatters: [],
            opts: {},
            district: [],
            ws: null,
            hospitalInfos: [],
            statisticsInfo: null
        }
    },
    computed: {
        newCreateHosiptals() {
            let result = []

            if (!this.hospitals) return result

            result = this.hospitals.filter(item => {
                const now = new Date().setHours(0, 0, 0, 0)
                return item.adress.createTime < now * 1000
            })

            return result
        }
    },
    mounted() {
        // this.getHospitals()
        // if (!this.timer) this.onTimeReresh()

        this.getData()
    },
    destroyed() {
        // this.ws.unSubscribe()
    },
    beforeDestroy() {
        clearInterval(this.timer)
    },
    methods: {
        /**
         * 初始化地图
         */
        initMap() {

            echarts.registerMap('china', chinaGeoJSON)
            console.log('%c [ this.cityHospitals ]-125', 'font-size:13px; background:pink; color:#bf2c9f;', this.cityHospitals, typeof this.cityHospitals)

            let option = {
                animation: true,
                tooltip: {
                    trigger: 'item',
                    formatter: (params) => {
                        let content = '<div>' +
                            '<p>机构名称：' + params.data.name + '</p>' +
                            '<p>地址：' + params.data.address + '</p>' +
                            // '<p>认证医生数：' + params.data.doctor_num + '</p>' +
                            // '<p>抗蛇毒血清计算库存数：' + params.data.antivenom_num + '</p>' +
                            '<p>经纬度坐标' + params.data.value[0] + ',' + params.data.value[1] + '</p>' +
                            '</div>'
                        return content
                    }
                },
                amap: {
                    viewMode: '3D',
                    center: [108.39, 39.9],
                    zoom: 4,
                    resizeEnable: true,
                    renderOnMoving: true,
                    mapStyle: 'amap://styles/fresh',
                    echartsLayerInteractive: true,
                    echartsLayerZIndex: 2019,
                    labelzIndex: 100,
                    zoomstart: function () {
                        amap.setOptions({
                            labelzIndex: 100 // 开始缩放时显示文字标注
                        })
                    },
                },
                series: [
                    {
                        type: 'effectScatter',
                        coordinateSystem: 'amap',
                        data: this.newScatters,
                        itemStyle: {
                            color: function (params) {
                                const type = params.data.type
                                return type == 1 ? '#4577ba' : '#1dc254'
                            }
                        },
                        symbolSize: function (value, params) {
                            const type = params.data.type

                            return type == 1 ? 8 : 6
                        },
                        rippleEffect: {
                            number: 5,
                            period: 3,
                            scale: 3.5,
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
                        symbolSize: 8,
                    },
                    {
                        type: 'scatter',
                        coordinateSystem: 'amap',
                        data: this.basicHospitals,
                        itemStyle: {
                            color: '#1dc254',
                        },
                        symbolSize: 6,
                    }
                ],
            }

            if (!this.echartsMap) this.echartsMap = echarts.init(this.$refs.mapContainer)
            console.log('%c [ option ]-146', 'font-size:13px; background:pink; color:#bf2c9f;', option)

            this.echartsMap.setOption(option)

            // 获取 ECharts 高德地图组件
            const amapComponent = this.echartsMap.getModel().getComponent('amap')

            // 获取高德地图实例，使用高德地图自带的控件(需要在高德地图js API script标签手动引入)
            const amap = amapComponent.getAMap()

            // 添加控件
            amap.addControl(new AMap.Scale())
            amap.addControl(new AMap.ToolBar())

            //  添加一个 Marker
            amap.add(new AMap.Marker({
                position: [115, 35]
            }))

            // 禁用 ECharts 图层交互，从而使高德地图图层可以点击交互
            // amapComponent.setEChartsLayerInteractive(false)
        },

        /**
         * 获取数据
         */
        getHospitals() {
            api.getHospitals().then(res => {
                this.hospitals = res.data.result

                this.hospitals.forEach(item => {
                    item.value = item.adress.location
                })

                this.newScatters = this.hospitals.filter(item => {
                    const now = new Date().getTime()
                    const untilToday = new Date().setHours(23, 16, 0, 0),
                        startToday = new Date().setHours(0, 0, 0, 0)

                    // return startToday <= item.adress.createTime && item.adress.createTime <= untilToday
                    return item.adress.createTime + 3000 >= now
                })

                this.$store.dispatch('setData', this.hospitals)

                this.cityHospitals = res.data.result.filter(item => {
                    return item.type === 1
                })

                this.$store.dispatch('setCityData', this.cityHospitals)

                this.basicHospitals = res.data.result.filter(item => {
                    return item.type === 2
                })
                this.$store.dispatch('setBasicData', this.basicHospitals)

                this.initMap()
            }).catch(err => {
                console.error('%c [ err ]-260', 'font-size:13px; background:pink; color:#bf2c9f;', err)
            })
        },

        /**
         * 定时器
         */
        onTimeReresh() {
            clearInterval(this.timer)

            this.timer = setInterval(() => {
                this.getHospitals()
            }, this.refreshTime)
        },

        /**
         * websocket
         */
        getData() {
            this.ws = SocketService.Instance

            this.ws.sendMessage(
                {},
                (data) => {
                    console.log('%c [ data ]-226', 'font-size:13px; background:pink; color:#bf2c9f;', data)
                    this.hospitalInfos = data.hospitalInfos
                    this.statisticsInfo = data.statisticsInfo

                    this.hospitalInfos.forEach((item, index) => {
                        if (!item.latitude || !item.longitude) {
                            console.log(66666, item.latitude, item.longitude, index);
                            item.longitude = '104.949528'
                            item.latitude = '33.372832'
                        }
                        item.longitude = Number(item.longitude)
                        item.latitude = Number(item.latitude)
                        item.value = [Number(item.longitude), Number(item.latitude)]
                    })

                    this.$store.dispatch('setData', data)

                    this.newScatters = this.hospitalInfos.filter(item => {
                        return item.flickerFlag
                    })

                    // this.$store.dispatch('setData', this.hospitals)

                    this.cityHospitals = this.hospitalInfos.filter((item, index) => {
                        // return item.id % 3 !== 0
                        // return (index <= 100 && index !== 140)
                        return index === 105
                    })
                    this.$store.dispatch('setCityData', this.cityHospitals)

                    this.basicHospitals = this.hospitalInfos.filter((item, index) => {
                        // return item.id % 3 === 0
                        // return (100 < index && index <= 360 && index !== 140)
                        return index === 101
                    })
                    this.$store.dispatch('setBasicData', this.basicHospitals)

                    this.initMap()

                }
            )

        }
    }
}
</script>
  
<style scoped>
.map-view {}
</style>