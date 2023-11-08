import Vue from 'vue'
import VueToastify from 'vue-toastification'
import 'vue-toastification/dist/index.css'

const toastInstance = new Vue({
  plugins: [VueToastify],
})

export function showToast(message, type = 'success') {
  toastInstance.$toast[type](message)
}