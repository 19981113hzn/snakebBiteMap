<template>
    <div id="Home" class="home-view">
        <div class="statistics-container">
            <StatisticsView />
        </div>

        <div class="map-container">
            <MapView />
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
        // 处理窗口大小变化事件
        handleResize() {
            const mapContainer = this.$el.querySelector('.map-container')
            const statisticsContainer = this.$el.querySelector('.statistics-container')
            const height = window.innerHeight - 20
            mapContainer.style.height = `${height}px`
            statisticsContainer.style.height = `${height}px`
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
    padding-left: 100px;
}
</style>