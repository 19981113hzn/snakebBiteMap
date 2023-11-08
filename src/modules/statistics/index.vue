<template>
    <div class="statistics-view">
        <h2 class="title">赛伦100蛇伤急救网络</h2>
        <div class="data-group">
            <div class="data-item">
                <div class="data-label">蛇伤数</div>
                <div class="data-value"><span class="value-number">
                    <CountUp :endVal="snakeCount" />
                </span><span
                        class="data-label">例</span>
                </div>
            </div>
            <div class="data-item">
                <div class="data-label">其中使用抗蛇毒血清</div>
                <div class="data-value"><span class="value-number">
                    <CountUp :endVal="serumCount" />
                </span><span
                        class="data-label">例</span>
                </div>
            </div>
            <div class="data-item">
                <div class="data-label">城区救治点</div>
                <div class="data-value"><span class="value-number">
                    <CountUp :endVal="urbanCount" />
                </span><span
                        class="data-label">家</span>
                </div>
            </div>
            <div class="data-item">
                <div class="data-label">基层救治点</div>
                <div class="data-value"><span class="value-number">
                    <CountUp :endVal="ruralCount" />
                </span><span
                        class="data-label">家</span>
                </div>
            </div>
            <div class="data-item">
                <div class="data-label">认证医生</div>
                <div class="data-value"><span class="value-number">
                    <CountUp :endVal="doctorCount" />
                </span><span
                        class="data-label">位</span>
                </div>
            </div>
        </div>

        <div class="tips">
            <div class="tip tip-city">城区救治点</div>
            <div class=" tip tip-basic">基层救治点</div>
            <div class="tip-note">注：数据截止至今日</div>
        </div>
    </div>
</template>
  
<script>
// import CountUp from 'countup.js'
// import ICountUp from 'vue-countup-v2'

import CountUp from '@/components/IcountUp.vue'

export default {
    name: 'StatisticsView',
    components: {
        CountUp
    },
    data() {
        return {
        }
    },
    computed: {
        snakeCount() {
            if (!this.$store.state.data) return 0
            return this.$store.state.data[0].snakebite_num
        },
        serumCount() {
            if (!this.snakeCount) return 0
            return Math.floor(this.snakeCount * 0.85)
        },
        urbanCount() {
            if (!this.$store.state.cityData) return 0
            return this.$store.state.cityData.length
        },
        ruralCount() {
            if (!this.$store.state.basicData) return 0
            return this.$store.state.basicData.length
        },
        doctorCount() {
            if (!this.$store.state.data) return 0
            return this.$store.state.data[0].doctor_num
        }
    },
    methods: {
    },
    filters: {
        formatNumber(value) {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
    },
    mounted() {
        // TODO: 获取统计数据的代码
    }
}
</script>
  
<style lang="less" scoped>
@import url('./index.less');
</style>