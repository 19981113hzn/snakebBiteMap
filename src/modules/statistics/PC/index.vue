<template>
    <div class="statistics-view">
        <div class="statistics-info">
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
                <div class="tip-note">数据更新日期：{{ formatDate }}</div>
            </div>
        </div>

        <div class="back-to-home" v-if="showBackToHome" @click="backToHome">
            <img width="20" height="20" src="../../../assets/images/home.png" alt="">
        </div>

        <div class="show-hhyline" @click="showHhyline">
            <img :title="lineTips" width="20" height="20" :src="showHhylineImage" alt="">
        </div>
    </div>
</template>
  
<script>
import CountUp from '@/components/IcountUp.vue'

export default {
    name: 'StatisticsViewPC',
    components: {
        CountUp
    },
    data() {
        return {
            showBackToHome: false,
            isShowLine: false
        }
    },
    computed: {
        statisticsInfo() {
            if (!this.$store.state.data || !this.$store.state.data.statisticsInfo) return null
            return this.$store.state.data.statisticsInfo
        },
        formatDate() {
            if(!this.$store.state.data) return null
            const formattedDate = this.$store.state.data.date 
            return formattedDate
        },
        showHhylineImage() {
            let result = 'https://bn.devfp.ps.netease.com/file/655c52c49b5c74597b256d5fKUxEPOi702'

            if(!this.isShowLine) result = 'https://bn.devfp.ps.netease.com/file/655c52d26f193499fc4e2439P5IUQ0ld02'

            return result
        },
        lineTips() {
            let result = '显示中国人口划分线：胡焕庸线'

            if(this.isShowLine) result = '隐藏中国人口划分线：胡焕庸线'

            return result
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
        showHhyline() {
            this.$parent.showHhyline()
            this.isShowLine =!this.isShowLine
        }

    },
    filters: {
        formatNumber(value) {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
    },
    mounted() {
        
    }
}
</script>
  
<style lang="less" scoped>
@import url('./index.less');
</style>