import Vue from 'vue'

const saved = localStorage.getItem('userInfo')
let initialInfo = null
if (saved) {
  try {
    initialInfo = JSON.parse(saved)
  } catch (e) {
    console.warn('Failed to parse userInfo')
  }
}

export const userStore = new Vue({
  data() {
    return {
      info: initialInfo
    }
  },
  methods: {
    setInfo(user) {
      this.info = user
      localStorage.setItem('userInfo', JSON.stringify(user))
    },
    clear() {
      this.info = null
      localStorage.removeItem('userInfo')
      localStorage.removeItem('token')
      
    }
  }
})