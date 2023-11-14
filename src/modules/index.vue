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
.home-view {
    position: relative;
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
}

.map-container {
    flex: 1;
    height: 100%;
}

.statistics-container {
    position: fixed;
    z-index: 999;
    left: 0;
    bottom: 0;
    height: 100%;
    min-width: 300px;
    padding-left: 60px;
    .statistics-view {
        z-index: 99;
    }

    &::after {
        content: '';
        position: absolute;
        z-index: 10;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        // background: #A4D4D2;
        // background: linear-gradient(to right, #F7F6F0 0%, #F7F6F0 70%, #A4D4D2 70%, #A4D4D2 100%);
        background: linear-gradient(90deg,#c8f5f5,rgba(200,245,245,.98),rgba(226,248,248,0));
        opacity: .6;

    }
}
</style>