<template>
    <div class="">
        <ICountUp :delay="delay" :endVal="endVal" :options="options" />
    </div>
</template>

<script>
import CountUp from 'countup.js'
import ICountUp from 'vue-countup-v2'

export default {
    name: 'CountUp',
    mixins: [],
    components: {
        ICountUp
    },
    data() {
        return {
        }
    },
    props: {
        endVal: {
            type: Number,
            default: 0
        },
        delay: {
            type: Number,
            default: 1000
        },
        options: {
            type: Object,
            default: () => {
                return {
                    useEasing: true,
                    useGrouping: true,
                    separator: ',',
                    decimal: '.',
                    prefix: '',
                    suffix: ''
                }
            }
        }
    },
    methods: {
        // onReady() {
        //     this.$emit('ready')
        // }
    },
    computed: {

    },
    mounted() {

    },
    created() {

    }
}
</script>

<style lang="less" scoped></style>