<template>
    <div id="Home" class="home-view">
        <template v-if="!isAdapter">
            <div class="home-pc">
                <div class="statistics-container">
                    <StatisticsViewPC ref="statisticsView" />
                </div>

                <div class="map-container">
                    <MapViewPC ref="mapView" />
                </div>
            </div>
        </template>

        <template v-else>
            <!-- PC端 -->
            <div class="home-pc" v-if="adapter === 'PC'">
                <div class="statistics-container">
                    <StatisticsViewPC ref="statisticsView" />
                </div>

                <div class="map-container">
                    <MapViewPC ref="mapView" />
                </div>
            </div>

            <!-- 移动端 -->
            <div class="home-mobile" v-else>
                <div class="map-container">
                    <MapViewMobile ref="mapView" />
                </div>
                <div class="statistics-container">
                    <StatisticsViewMobile ref="statisticsView" />
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import MapViewPC from './map/PC/index.vue'
import StatisticsViewPC from './statistics/PC/index.vue'
import MapViewMobile from './map/mobile/index.vue'
import StatisticsViewMobile from './statistics/mobile/index.vue'
import Ua from '@/plugin/ua'

export default {
    name: 'HomeView',
    mixins: [],
    components: {
        MapViewPC,
        StatisticsViewPC,
        MapViewMobile,
        StatisticsViewMobile
    },
    data() {
        return {
            isAdapter: false,
        }
    },
    methods: {
        /**
         * 监听地图大小变化，实现全屏自适应大小的效果
         */
        handleResize() {
            const mapContainer = this.$el.querySelector('.map-container')
            const statisticsContainer = this.$el.querySelector('.statistics-container')
            const height = window.innerHeight - 20
            mapContainer.style.height = `${height}px`
            statisticsContainer.style.height = `${height}px`
        },

        /**
         * 初始化地图
         */
        resetMap() {
            this.$refs.mapView.backToHome()
        },

        /**
         * changeshowback
         */
        changeShowBackToHome(show) {
            this.$refs.statisticsView.isShowBackToHome(show)
        },
        showHhyline() {
            this.$refs.mapView.showHhyline()
        }
    },
    computed: {
        adapter() {
            let result = 'PC'
            const screenWidth = window.innerWidth

            if (Ua.isAndroid() || Ua.isIos()) {
                result = 'MOBILE'
            } else {
                if (screenWidth <= 767) {
                    result = 'MOBILE'
                } else if (screenWidth <= 1039) {
                    result = 'PC'
                } else {
                    result = 'PC'
                }
            }
            return result
        }
    },
    mounted() {
        // 监听窗口大小变化，实现全屏自适应大小的效果
        // window.addEventListener('resize', this.handleResize)
        // this.handleResize()
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize)
    },
    created() {

    }
}
</script>

<style lang="less" scoped>
@import url('./index.less');
</style>