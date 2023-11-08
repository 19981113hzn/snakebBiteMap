<template>
    <div class="map-view" ref="mapContainer" style="width: 80%;height: 80%;">

    </div>
</template>
  
<script>
import * as echarts from 'echarts'
import chinaGeoJSON from '../../assets/data/chinaMap.json'
import api from '@/plugin/api'

export default {
    name: 'MapView',
    data() {
        return {
            map: null,
            hospitals: null,
            cityHospitals: [],
            basicHospitals: null,
            timer: null,
            refreshTime: 3000,
            newScatters: []
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
                geo: {
                    map: "china",
                    roam: true,
                    zoom: 1.63,
                    center: [105, 36],
                    scaleLimit: {
                        min: 1,
                        max: 15
                    },
                    normal: {
                        position: 'inside',
                        align: 'center',
                        show: true,
                        fontSize: "10",
                        color: "#696969"
                    },
                    emphasis: {
                        show: false,
                        itemStyle: {
                            areaColor: "pink",

                        }
                    },
                    itemStyle: {
                        areaColor: "#eeeeee",
                    },
                    show: true
                },
                series: [
                    {
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
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
                        coordinateSystem: 'geo',
                        data: this.cityHospitals,
                        itemStyle: {
                            color: '#4577ba',
                        },
                        symbolSize: 8,
                    },
                    {
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: this.basicHospitals,
                        itemStyle: {
                            color: '#1dc254',
                        },
                        symbolSize: 6,
                    }
                ],
                // visualMap: {
                //     show: true,
                //     type: 'continuous',
                //     min: 0,
                //     max: 10000,
                //     name: '抗毒血清库存数',
                //     inRange: {
                //         color: ['#f0f0f0', '#006edd'],
                //         symbolSize: [100, 100]
                //     },
                //     seriesIndex: 2
                // },
                toolbox: {
                    show: true,
                    feature: {
                        dataZoom: {
                            show: true,
                            title: '缩放'
                        },
                        restore: {
                            show: true,
                            title: '刷新'
                        },
                        saveAsImage: {
                            show: true,
                            title: '下载图片'
                        }
                    }
                },
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
                }
            }

            if (!this.map) this.map = echarts.init(this.$refs.mapContainer)
            this.map.setOption(option)
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
                    console.log('%c [ now ]-189', 'font-size:13px; background:pink; color:#bf2c9f;', now)
                    const untilToday = new Date().setHours(23, 16, 0, 0),
                        startToday = new Date().setHours(0, 0, 0, 0)
                        // console.log('%c [ startToday ]-191', 'font-size:13px; background:pink; color:#bf2c9f;', untilToday, startToday)

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
                this.$toast('error')
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
        }
    }
}
</script>
  
<style scoped>
.map-view {}
</style>