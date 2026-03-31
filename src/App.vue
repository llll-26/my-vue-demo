<!-- App.vue -->
<template>
  <div id="app" class="app-root">
    <!-- PC 端提示遮罩（仅非移动端显示） -->
    <div v-if="showPcHint" id="pc-hint-overlay">
      <div class="hint-content">
        <p>📱 本平台为移动端设计，请使用手机浏览器打开</p>
        <img src="@/assets/logo.png" alt="扫码访问" class="qrcode" />
        <button @click="forceShowApp" class="continue-btn">
          继续在电脑上查看（体验可能不佳）
        </button>
      </div>
    </div>

    <!-- 正常应用内容（可被遮罩覆盖） -->
    <AppHeader v-if="!showPcHint && showHeader" />
    <main 
      class="main-content" 
      :class="{ 'with-tabbar': showTabBar && !showPcHint }"
      v-show="!showPcHint"
    >
      <router-view />
    </main>
    
    <AppTabBar v-if="!showPcHint && showTabBar" />
  </div>
</template>

<script>
import AppHeader from '@/components/AppHeader.vue'
import AppTabBar from '@/components/AppTabBar.vue'

export default {
  name: 'App',
  components: { AppHeader, AppTabBar },
  data() {
    return {
      isMobile: false,
      forceDisplay: false // 用户点击“继续查看”后设为 true
    }
  },
  computed: {
    // 是否显示 PC 提示（仅当非移动设备 + 未强制显示）
    showPcHint() {
      return !this.isMobile && !this.forceDisplay
    },

    showHeader() {
      return !['Login', 'Register'].includes(this.$route.name)
    },

    showTabBar() {
      const path = this.$route.path;
      const tabBarPaths = [
        '/home',
        '/publishSkill',
        '/publishedSkills',
        '/profile',
        '/pointsManagement',
        '/points/growth',
        '/points/summary',
        '/points/redeem',
        '/chatList',
        '/chat'
      ];
      return (
        tabBarPaths.includes(path) ||
        path.startsWith('/profile/') ||
        path.startsWith('/points/')
      );
    }
  },
  mounted() {
    this.checkDevice()
    // 可选：监听窗口 resize（应对开发者工具切换设备）
    window.addEventListener('resize', this.checkDevice)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkDevice)
  },
  methods: {
    checkDevice() {
      const userAgent = navigator.userAgent
      const mobileKeywords = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      this.isMobile = !!mobileKeywords.test(userAgent)
    },
    forceShowApp() {
      this.forceDisplay = true
    }
  }
}
</script>

<style>
/* 原有样式保留 */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}
.main-content {
  flex: 1;
  padding-top: 20px;
  box-sizing: border-box;
}
.main-content.with-tabbar {
  padding-bottom: 70px;
}

/* ===== 新增：PC 提示遮罩样式 ===== */
#pc-hint-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.hint-content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  max-width: 90%;
  width: 320px;
}

.hint-content p {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
}

.qrcode {
  width: 180px;
  height: 180px;
  margin-bottom: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.continue-btn {
  background: #0066cc;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.continue-btn:hover {
  background: #0052a3;
}
</style>