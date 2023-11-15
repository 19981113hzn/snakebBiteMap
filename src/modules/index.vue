<template>
    <div id="Home" class="home-view">
        <div class="statistics-container">
            <StatisticsView ref="statisticsView"/>
        </div>

        <div class="map-container">
            <MapView ref="mapView"/>
        </div>
    </div>
</template>

<script>
import MapView from './map/index.vue'
import StatisticsView from './statistics/index.vue'

export default {
    name: 'HomeView',
    mixins: [],
    components: {
        MapView,
        StatisticsView
    },
    data() {
        return {

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
        }
    },
    computed: {

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