import Vue from 'vue'
import Vuex from 'vuex'

const state = {
    data: null
}

const mutations = {
    SET_DATA(state, data) {
        state.data = data
    }
}

const actions = {
    setData({ commit }, data) {
        commit('SET_DATA', data)
    }
}

Vue.use(Vuex)

export default new Vuex.Store({
    state,
    mutations,
    actions
})