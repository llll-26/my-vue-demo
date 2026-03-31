<template>
  <!-- 根元素 -->
  <div>
    <!-- 头部区域 -->
    <header class="header">
      <div 
        v-if="!isHomePage" 
        class="hamburger-menu" 
        @click="toggleMobileMenu"
      >
        <div></div>
        <div></div>
        <div></div>
      </div>

      <div class="logo">
        <img src="@/assets/技能.png" alt="平台图标" class="logo-icon" />
        <span class="logo-text">大学生技能交换平台</span>
      </div>

      <div 
        v-if="!userStore.info" 
        class="user-actions guest"
        @click="$router.push('/login')"
      >
        登录/注册
      </div>
      <div 
        v-else 
        class="user-actions logged-in"
        @click="$router.push('/profile')"
      >
        欢迎，{{ userStore.info.nickName || '用户' }}
      </div>
    </header>

    <!-- 移动端侧边菜单 -->
    <div 
      v-if="isMobileMenuOpen" 
      class="mobile-menu"
      :class="{ open: isMobileMenuOpen }"
    >
      <div 
        v-for="(item, index) in mobileMenuItems" 
        :key="index" 
        class="menu-item"
        @click="handleMenuItemClick(item)"
      >
        <span>{{ item.label }}</span>
        
        <!-- “我的预约”红点 -->
        <span 
          v-if="item.route === '/profile/appointments' && totalUnread > 0" 
          class="unread-badge"
        >
          {{ totalUnread > 99 ? '99+' : totalUnread }}
        </span>
        
        <!-- “我的消息”红点 -->
        <span 
          v-else-if="item.route === '/profile/messages' && unreadNotificationCount > 0" 
          class="unread-badge"
        >
          {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { userStore } from '@/store/user'
import { getUnreadAppointmentCount, getConfirmedUnreadCount } from '@/api/skill'
import { getUnreadNotificationCount } from '@/api/notification'

export default {
  name: 'AppHeader',
  data() {
    return {
      isMobileMenuOpen: false,
      unreadCount: 0,
      confirmedUnreadCount: 0,
      polling: null,
      unreadNotificationCount: 0
    }
  },
  async mounted() {
    await this.fetchAllUnread();
    this.polling = setInterval(this.fetchAllUnread, 30000);
  },
  beforeDestroy() {
    if (this.polling) clearInterval(this.polling)
  },
  computed: {
    totalUnread() {
      return this.unreadCount + this.confirmedUnreadCount;
    },
    userStore() {
      return userStore
    },
    isHomePage() {
      return this.$route.name === 'Home'
    },
    mobileMenuItems() {
      if (this.isHomePage) return [];
      
      switch (this.$route.name) {
        case 'PublishSkill':
        case 'PublishedSkills':
          return [
            { label: '已发布', route: '/publishedSkills' },
            { label: '去发布', route: '/publishSkill' }
          ];
        case 'Profile':
        case 'ResetPassword':     
        case 'Appointments':
        case 'CompletedOrder': 
        case 'Enrollments':
        case 'Messages':
        case 'Feedback':
          return [
            { label: '个人信息', route: '/profile' },
            { label: '重置密码', route: '/profile/resetpassword' },
            { label: '我的预约', route: '/profile/appointments' },
            { label: '我的订单', route: '/profile/completedorder' },
            { label: '我的活动', route: '/profile/enrollments' },
            { label: '我的消息', route: '/profile/messages' },
            { label: '我的反馈', route: '/profile/feedback' }
          ];
        case 'PointsManagement':
        case 'PointsGrowth':
        case 'PointsSummary':
        case 'PointsRedeem':  
        case 'Rank':
          return [
            { label: '已兑换奖品', route: '/points/summary' },
            { label: '积分兑换', route: '/points/redeem' },
            { label: '服务汇总', route: '/points/growth' },
            { label: '互助排行榜', route: '/rank' }
          ];
        default:
          return [];
      }
    }
  },
  methods: {
    async fetchAllUnread() {
      try {
        const [res1, res2, res3] = await Promise.all([
          getUnreadAppointmentCount(),
          getConfirmedUnreadCount(),
          getUnreadNotificationCount()
        ]);
        
        this.unreadCount = res1.data || 0;
        this.confirmedUnreadCount = res2.data || 0;
        this.unreadNotificationCount = res3.data || 0;
      } catch (err) {
        console.warn('获取未读数失败', err);
      }
    },
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },
    handleMenuItemClick(item) {
      if (item.route && this.$route.path !== item.route) {
        this.$router.push(item.route);
      }
      this.isMobileMenuOpen = false;
    }
  },
  watch: {
    '$route'() {
      this.isMobileMenuOpen = false;
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #b3d9ff;
  color: #333;
  padding: 10px 16px;
  border-bottom: 1px solid #ccc;
  position: relative;
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 28px;
  height: 28px;
}

.logo-text {
  font-size: 1.2rem;
  font-weight: bold;
  white-space: nowrap;
}

/* 用户操作区：统一处理溢出 */
.user-actions {
  cursor: pointer;
  max-width: 150px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  text-align: right;
}

.user-actions.guest {
  color: #1890ff;
}

.user-actions.logged-in {
  color: #6a5acd; /* 紫色，替代无效的 #purple */
}

.hamburger-menu {
  width: 24px;
  height: 24px; 
  display: flex;
  flex-direction: column;
  justify-content: center; 
  gap: 4px;
  cursor: pointer;
  padding: 6px 0; 
}

.hamburger-menu div {
  width: 100%;
  height: 2px;
  background-color: #000;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.mobile-menu {
  position: absolute;
  top: 50px;
  left: 16px;
  width: 100px;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  max-height: 0;
  opacity: 0;
}

.mobile-menu.open {
  max-height: 400px;
  opacity: 1;
}

.mobile-menu .menu-item {
  padding: 12px 16px;
  margin: 0;
  border: none;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border-bottom: 1px solid #eee;
}

.mobile-menu .menu-item:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .hamburger-menu {
    display: flex;
  }

  .user-actions {
    max-width: 120px;
    font-size: 13px;
  }
}

@media (max-width: 375px) {
  .user-actions {
    max-width: 100px;
    font-size: 12px;
  }

  .mobile-menu {
    left: 12px;
    width: calc(100% - 24px);
  }
}

.unread-badge {
  display: inline-block;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background-color: #ff4d4f;
  color: white;
  font-size: 10px;
  line-height: 16px;
  border-radius: 8px;
  margin-left: 6px;
  text-align: center;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>