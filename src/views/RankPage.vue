<template>
  <div class="rank-page">
    <div class="rank-header">
        
      <h1>
        <img src="@/assets/太阳.png" alt="太阳" class="sun-icon" />
        互助成长榜</h1>
      <p class="subtitle">助人者自助，榜样的力量</p>
  
    </div>

    <div class="rank-container">
      <!-- 加载中 -->
      <div v-if="loading" class="rank-loading">
        <div class="spinner"></div>
        <p>正在加载榜单...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="rankList.length === 0" class="rank-empty">
        <img src="" alt="暂无数据" />
        <p>暂无上榜同学，快去帮助他人吧！</p>
      </div>

      <!-- 榜单内容：全部纵向 -->
      <div v-else class="rank-content">
        <ul class="rank-list full-list">
          <li
            v-for="(item, index) in rankList"
            :key="item.userId"
            class="rank-item"
            :class="{ 'top3-item': index < 3 }"
          >
            <!-- 前3名显示奖牌 -->
           <span v-if="index < 3" class="medal-icon">
  <img 
    :src="require(`@/assets/${['第一名', '第二名', '第三名'][index]}.png`)" 
    alt="奖牌"
    class="medal-img"
  />
</span>
            <!-- 第4名起显示数字 -->
            <span v-else class="rank-index">{{ index + 1 }}</span>

            <img
              :src="getFullCoverUrl(item.avatar) || defaultCover"
              :alt="item.nickName"
              class="rank-avatar"
            />
            <span class="rank-name">{{ item.nickName }}</span>
            <span class="rank-points">{{ item.totalPoints }} 分</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { getTop10Rank } from '@/api/points'

export default {
  name: 'RankPage',
  data() {
    return {
      loading: true,
      rankList: [],
      defaultCover: 'https://via.placeholder.com/80?text=No+Photo',
    }
  },
  async mounted() {
    await this.loadRankList()
  },
  methods: {
    getFullCoverUrl(url) {
      if (!url) return this.defaultCover
      if (url.startsWith('http')) return url
      let clean = url.replace(/\/+/g, '/')
      if (!clean.startsWith('/')) clean = '/' + clean
      return (process.env.VUE_APP_BASE_API || '') + clean
    },

    async loadRankList() {
      this.loading = true
      try {
        const res = await getTop10Rank()
        if (res.code === 200 && Array.isArray(res.data)) {
          this.rankList = res.data.slice(0, 10)
        } else {
          this.rankList = []
        }
      } catch (error) {
        console.error('加载排行榜失败', error)
        this.rankList = []
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.rank-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9ff 0%, #e6f7ff 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.rank-header {
  text-align: center;
  margin-bottom: 30px;
}

.rank-header h1 {
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 8px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 16px;
}

.rank-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  padding: 24px;
}

/* 加载状态 */
.rank-loading {
  text-align: center;
  padding: 40px 0;
  color: #7f8c8d;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #ecf0f1;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.rank-empty img {
  width: 120px;
  opacity: 0.6;
  margin-bottom: 16px;
}
.rank-empty p {
  color: #95a5a6;
}

/* 全榜单列表 */
.full-list {
  width: 100%;
  list-style: none;
  padding: 0;
  margin: 0;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f1f2f6;
  position: relative;
}

.rank-item:last-child {
  border-bottom: none;
}

/* 前3名高亮样式 */
.top3-item {
  background: linear-gradient(to right, #f8f9ff, #f0f4ff);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #eef2ff;
}

.medal-icon {
  font-size: 24px;
  margin-right: 12px;
  min-width: 32px;
  text-align: center;
}

.rank-index {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ecf0f1;
  color: #7f8c8d;
  border-radius: 50%;
  font-size: 14px;
  margin-right: 12px;
  font-weight: bold;
  min-width: 28px;
}

.rank-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 14px;
  border: 2px solid #eee;
}

.rank-name {
  flex: 1;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-points {
  color: #e74c3c;
  font-weight: bold;
  font-size: 16px;
  white-space: nowrap;
}

/* 返回按钮 */
.back-home {
  text-align: center;
  margin-top: 24px;
  color: #3498db;
  cursor: pointer;
  font-size: 15px;
}

.back-home:hover {
  text-decoration: underline;
}

/* 响应式优化 */
@media (max-width: 600px) {
  .rank-container {
    padding: 16px;
  }
  .rank-avatar {
    width: 40px;
    height: 40px;
  }
  .rank-name {
    font-size: 15px;
  }
  .rank-points {
    font-size: 15px;
  }
}
.medal-img {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  object-fit: cover;
}
.sun-icon {
  width: 36px;
  height: 36px;
  vertical-align: middle;
  opacity: 1; /*去掉透明度 */
}
</style>