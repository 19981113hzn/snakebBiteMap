<template>
    <div class="map-view" ref="mapContainer" style="width: 100%;height: 100%;">

    </div>
</template>
  
<script>
import * as echarts from 'echarts'
import chinaGeoJSON from '../../assets/data/chinaMap.json'
import api from '@/plugin/api'
import "echarts-extension-amap"

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
        this.getHospitals()
        this.initMapData()
        if (!this.timer) this.onTimeReresh()
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
            
            let option = {
                animation: true,
                tooltip: {
                    trigger: 'item',
                    formatter: (params) => {
                        let content = '<div>' +
                            '<p>机构名称：' + params.data.adress.name + '</p>' +
                            '<p>地址：' + params.data.adress.address + '</p>' +
                            '<p>认证医生数：' + params.data.doctor_num + '</p>' +
                            '<p>抗蛇毒血清计算库存数：' + params.data.antivenom_num + '</p>' +
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
                    labelzIndex: -100,
                    zoomstart: function () {
                        amap.setOptions({
                            labelzIndex: 100 // 开始缩放时显示文字标注
                        })
                    },
                    // label: 100,
                    // showLabel: false,
                },
                series: [
                    {
                        type: 'effectScatter',
                        coordinateSystem: 'amap',
                        data: this.newScatters,
                        itemStyle: {
                            // color: '#4577ba',
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
            this.echartsMap.setOption(option)

            // 获取 ECharts 高德地图组件
            const amapComponent = this.echartsMap.getModel().getComponent('amap')

            // 获取高德地图实例，使用高德地图自带的控件(需要在高德地图js API script标签手动引入)
            const amap = amapComponent.getAMap()

            // 添加控件
            amap.addControl(new AMap.Scale())
            amap.addControl(new AMap.ToolBar())
            // 添加图层
            var satelliteLayer = new AMap.TileLayer.Satellite()
            var roadNetLayer = new AMap.TileLayer.RoadNet()
            // amap.add([satelliteLayer, roadNetLayer]);
            //  添加一个 Marker
            amap.add(new AMap.Marker({
                position: [115, 35]
            }))

            // 禁用 ECharts 图层交互，从而使高德地图图层可以点击交互
            amapComponent.setEChartsLayerInteractive(false)
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
         * 获取中国地图边界数据
         */
        initMapData() {
            this.opts = {
                subdistrict: 1,   //返回下一级行政区
                showbiz: false  //最后一级返回街道信息
            }

            this.district = new AMap.DistrictSearch(this.opts)

            this.district.search("中国", (status, result) => {
                if (status == "complete") {
                    console.log('%c [ result ]-242', 'font-size:13px; background:pink; color:#bf2c9f;', result)

                    this.getData(result.districtList[0], "", 100000)
                }
            })
        },

        /**
         * 处理数据
         */
        getData(data, level, adcode) {
            const bounds = data.boundaries
            if (bounds) {
                for (var i = 0, l = bounds.length; i < l; i++) {
                    var polygon = new AMap.Polygon({
                        map: this.map,
                        strokeWeight: 1,
                        strokeColor: "#0091ea",
                        fillColor: "#80d8ff",
                        fillOpacity: 0.2,
                        path: bounds[i],
                    });
                    this.polygons.push(polygon);
                }
                this.map.setFitView(); //地图自适应
            }
        }
    }
}
</script>
  
<style scoped>
.map-view {}
</style>