import Vue from 'vue'
import Vuex from 'vuex'

const state = {
    data: null,
    cityData: null,
    basicData: null,
}

const mutations = {
    SET_DATA(state, data) {
        state.data = data
    },
    SET_DATA_CITY(state, data) {
        state.cityData = data
    },
    SET_DATA_BASIC(state, data) {
        state.basicData = data
    },
}

const actions = {
    setData({ commit }, data) {
        commit('SET_DATA', data)
    },
    setCityData({ commit }, data) {
        commit('SET_DATA_CITY', data)
    },
    setBasicData({ commit }, data) {
        commit('SET_DATA_BASIC', data)
    },
}

Vue.use(Vuex)

export default new Vuex.Store({
    state,
    mutations,
    actions
})