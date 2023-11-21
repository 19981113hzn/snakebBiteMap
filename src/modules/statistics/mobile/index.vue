<template>
    <!-- :class="{ 'expanded': expanded, 'collapsed': collapsed }" -->
    <div class="statistics-view statistics-view-mobile" >
        <div class="handle" @click.stop @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd" ref="handle">
            <div class="handle-bar"></div>
        </div>

        <div class="statistics-info" ref="content">
            <h2 class="title">赛伦100蛇伤急救网络</h2>
            <div class="data-group" v-if="statisticsInfo">
                <div class="data-item">
                    <div class="data-label">蛇伤数</div>
                    <div class="data-value"><span class="value-number">
                            <CountUp :endVal="statisticsInfo.blzs || 0" />
                        </span><span class="data-label">例</span>
                    </div>
                </div>
                <div class="data-item">
                    <div class="data-label">其中使用抗蛇毒血清</div>
                    <div class="data-value"><span class="value-number">
                            <CountUp :endVal="statisticsInfo.blxqzs || 0" />
                        </span><span class="data-label">例</span>
                    </div>
                </div>
                <div class="data-item">
                    <div class="data-label">城区救治点</div>
                    <div class="data-value"><span class="value-number">
                            <CountUp :endVal="statisticsInfo.cqjzd || 0" />
                        </span><span class="data-label">家</span>
                    </div>
                </div>
                <div class="data-item">
                    <div class="data-label">基层救治点</div>
                    <div class="data-value"><span class="value-number">
                            <CountUp :endVal="statisticsInfo.jcjzd || 0" />
                        </span><span class="data-label">家</span>
                    </div>
                </div>
                <div class="data-item">
                    <div class="data-label">认证医生</div>
                    <div class="data-value"><span class="value-number">
                            <CountUp :endVal="statisticsInfo.rzys || 0" />
                        </span><span class="data-label">位</span>
                    </div>
                </div>
            </div>

            <div class="tips">
                <div class="tip tip-city">城区救治点</div>
                <div class=" tip tip-basic">基层救治点</div>
                <div class="tip-note">注：数据截止至{{ formatDate }}</div>
            </div>
        </div>

        <div class="back-to-home" v-if="showBackToHome" @click="backToHome">
            <img width="20" height="20" src="../../../assets/images/home.png" alt="">
        </div>
    </div>
</template>

<script>
import CountUp from '@/components/IcountUp.vue'

export default {
    name: 'StatisticsViewMobile',
    mixins: [],
    components: { CountUp },
    data() {
        return {
            showBackToHome: false,
            expanded: false,
            collapsed: false,
            startY: 0,
            lastY: 0,
            handleHeight: 0,
            windowHeight: 0,
            contentHeight: 0,
            maxContentHeight: 0,
            minContentHeight: 0,
        }
    },
    methods: {
        backToHome() {
            this.showBackToHome = false
            this.$parent.resetMap()
        },
        isShowBackToHome(show) {
            this.showBackToHome = show
        },
        touchStart(e) {
            this.startY = e.touches[0].clientY
            console.log('%c [ startY ]-92', 'font-size:13px; background:pink; color:#bf2c9f;', this.startY)
            this.lastY = this.startY
            this.contentHeight = this.$refs.content.offsetHeight
            console.log('%c [ this.contentHeight ]-93', 'font-size:13px; background:pink; color:#bf2c9f;', this.contentHeight)

        },
        touchMove(e) {
            const deltaY = e.touches[0].clientY - this.lastY
            console.log('%c [ deltaY ]-99', 'font-size:13px; background:pink; color:#bf2c9f;', deltaY)
            this.lastY = e.touches[0].clientY
            let newHeight = this.contentHeight - deltaY
            if (newHeight > this.maxContentHeight) {
                newHeight = this.maxContentHeight
            } else if (newHeight < this.minContentHeight) {
                newHeight = this.minContentHeight
            }
            this.$refs.content.style.height = `${newHeight}px`
            // if(deltaY < 0 && this.contentHeight)
            // this.expanded = newHeight === this.maxContentHeight
            this.expanded = deltaY < 0
            // this.collapsed = newHeight === this.minContentHeight
            this.collapsed = deltaY > 0
        },
        touchEnd() {
            if (this.expanded) {
                if (this.minContentHeight < this.contentHeight && this.contentHeight < this.maxContentHeight) {
                    console.log('到最大')
                    this.$refs.content.style.height = this.maxContentHeight + 'px'
                }
                if ((Math.abs(this.contentHeight - Math.floor(this.minContentHeight)) < 10)) this.$refs.content.style.height = 'auto'
            } else if (this.collapsed) {
                if ((Math.abs(this.contentHeight - Math.floor(this.maxContentHeight)) < 10)) this.$refs.content.style.height = 'auto'
                if (this.minContentHeight < this.contentHeight && this.contentHeight < this.maxContentHeight) this.$refs.content.style.height = this.minContentHeight + 'px'
            }
        },
    },
    computed: {
        statisticsInfo() {
            if (!this.$store.state.data || !this.$store.state.data.statisticsInfo) return null
            return this.$store.state.data.statisticsInfo
        },
        formatDate() {
            if (!this.$store.state.data) return null
            const formattedDate = this.$store.state.data.date
            return formattedDate
        }
    },
    mounted() {
        this.windowHeight = window.innerHeight
        this.handleHeight = this.$refs.handle.offsetHeight
        this.contentHeight = this.$refs.content.offsetHeight

        this.maxContentHeight = this.windowHeight * 0.8
        this.minContentHeight = this.windowHeight * 0.2
    },
    created() {

    },
    filters: {
        formatNumber(value) {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
    },
}
</script>

<style lang="less" scoped>
@import url('./index.less');
</style>