<template>
  <div class="home-container">
    <!-- 公告区 -->
    <section class="notice-section">
      <div class="notice-container">
        <div class="notice-content" v-if="notices.length > 0">
          <marquee behavior="scroll" direction="left" scrollamount="3">
            <span v-for="item in notices" :key="item.noticeId" class="notice-item">
              {{ item.displayText }}
            </span>
          </marquee>
        </div>
        <div v-else class="no-notice">暂无公告</div>
      </div>
    </section>

    <!-- 轮播图区域 -->
    <section class="banner-section"
  ref="bannerSection"
  @mousedown="handleDragStart"
  @touchstart="handleDragStart"
  @mouseleave="handleDragEnd"
  @mouseup="handleDragEnd"
  @touchend="handleDragEnd"
  @mousemove="handleDragMove"
  @touchmove="handleDragMove">
       <!-- 包裹容器：用于横向滚动 -->
<div 
  class="banner-wrapper" 
  ref="bannerWrapper"
>
    <div
      v-for="(banner, index) in banners"
      :key="index"
      class="banner-slide"
      @click="handleBannerClick(banner)"
    >
      <img :src="getFullCoverUrl(banner.coverImg)" :alt="banner.title" />
      <div class="banner-text">{{ banner.title }}</div>
    </div>
  </div>
      <!-- 底部指示器 -->
      <div class="carousel-indicators">
        <span
          v-for="(_, index) in banners"
          :key="index"
          class="indicator"
          :class="{ active: index === currentIndex }"
          @click="goTo(index)"
        ></span>
      </div>
    </section>

    <!-- 技能卡片区域 -->
    <section class="skills-section">
      <div class="search-box">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索技能名称或教学方式..."
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">🔍</button>
      </div>
      <h2>热门技能</h2>

      <!-- 空状态提示 -->
      <div v-if="skillList.length === 0" class="no-skills">暂无匹配的技能</div>

      <div class="skills-grid">
        <div
          v-for="skill in skillList"
          :key="skill.id"
          class="skill-card"
          @click="viewSkill(skill.id)"
        >
          <img :src="getFullCoverUrl(skill.coverImg)" alt="技能封面" class="card-img" />
          <div class="card-content">
            <h3>{{ skill.title }}</h3>
            <p class="user">{{ skill.nickName || '匿名用户' }}</p>
            <span
              class="method"
              :class="skill.teachingMethod === '线上' ? 'online' : 'offline'"
            >
              {{ skill.teachingMethod || '未设置' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 加载提示 -->
      <div v-if="loading && skillList.length > 0" class="loading-tip">加载中...</div>
      <div v-else-if="!hasMore && skillList.length > 0" class="no-more">没有更多了</div>
    </section>

    <!-- 回到顶部按钮 -->
    <div v-if="showBackToTop" class="back-to-top" @click="scrollToTop">↑ 首页</div>
  </div>
</template>

<script>
import { getUserProfile } from '@/api/user'
import { getSkillList } from '@/api/skill'
import { listNotices } from '@/api/notice'
import { stripHtml } from '@/utils/html'
import { getBannerList } from '@/api/activity'
export default {
  name: 'Home',
  data() {
    return {
      defaultCover: 'https://via.placeholder.com/150',//默认图片
      userInfo: null,
      currentIndex: 0,
      intervalId: null,
      searchKeyword: '',
      banners: [],
      notices: [],
      isDragging: false,    // 是否正在拖拽
      dragStartX: 0,
      dragStartTime: 0,
      // === 懒加载相关 ===
      skillList: [],
      loading: false,
      hasMore: true,
      loadSize: 20,
      showBackToTop: false,
      scrollTimer: null,
      currentOrder: 'hot',
    }
  },
  async mounted() {
    await this.checkAuth()
    await this.loadNotices()
    await this.loadBanners()
    await this.loadSkills() // 初始加载
    window.addEventListener('scroll', this.onScroll)// 监听全局滚动
    this.startAutoPlay()
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.onScroll)
    this.stopAutoPlay()
  },
  methods: {
handleDragStart(e) {
    this.stopAutoPlay();
    this.dragStartX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    this.dragStartTime = Date.now(); // 记录开始时间
    this.isDragging = true;
  },

  handleDragMove(e) {
    // 不再更新 transform！不预览！
    if (!this.isDragging) return;
    e.preventDefault(); // 阻止页面滚动（移动端）
  },

  handleDragEnd(e) {
    if (!this.isDragging) return;

   let currentX;
if (e.type.includes('mouse')) {
  currentX = e.clientX;
} else {
  // 兼容处理 touchend
  if (e.changedTouches && e.changedTouches.length > 0) {
    currentX = e.changedTouches[0].clientX;
  } else {
    currentX = this.dragStartX;
  }
}

    const diff = this.dragStartX - currentX; // 向左拖为正
    const timeElapsed = Date.now() - this.dragStartTime;
    const absDiff = Math.abs(diff);

    //仅用距离判断
    const containerWidth = this.$refs.bannerSection?.clientWidth || window.innerWidth;
    const minDistance = containerWidth * 0.15;

    let shouldSwitch = false;
    let direction = 0; // 1: next, -1: prev

    if (absDiff > minDistance /* && velocity > minVelocity */) {
      shouldSwitch = true;
      direction = diff > 0 ? 1 : -1; //向左拖（diff>0）下一张
    }

    if (shouldSwitch) {
      if (direction === 1) {
        this.next();
      } else {
        this.prev();
      }
    } else {
      // 如果没达到阈值，回弹
      this.goTo(this.currentIndex);
    }

    this.isDragging = false;
    this.startAutoPlay();
  },
    getFullCoverUrl(url) {
  if (!url) return this.defaultCover; // 保持默认图
  if (url.startsWith('http')) return url;
  
  // 标准化路径：合并多个斜杠，确保以单斜杠开头
  let clean = url.replace(/\/+/g, '/');
  if (!clean.startsWith('/')) clean = '/' + clean;
  
  return (process.env.VUE_APP_BASE_API || '') + clean;
},

    async loadBanners() {
      try {
        const res = await getBannerList()
        if (res.code === 200 && Array.isArray(res.data)) {
          this.banners = res.data.map(item => ({
            activityId: item.activityId,
            title: item.title,
            coverImg: item.coverImg
          }))
        } else {
          this.banners = []
        }
      } catch (error) {
        console.error('加载轮播图失败', error)
        this.banners = []
      }
    },

    handleSearch() {
      this.resetAndReload()
    },

    resetAndReload() {
      this.skillList = []
      this.hasMore = true
      this.loading = false
      this.loadSkills()
      this.scrollToTop()
    },

   async loadSkills(isLoadMore = false) {
  if (this.loading || !this.hasMore) return

  this.loading = true
  try {
    const params = {//分页加载
      keyword: this.searchKeyword.trim() || undefined,
      orderBy: this.currentOrder, //传排序方式
      offset: isLoadMore ? this.skillList.length : 0,
      limit: this.loadSize
    }

    const res = await getSkillList(params)
    let newSkills = Array.isArray(res.data) ? res.data : (res.rows || [])

    if (newSkills.length === 0) {
      this.hasMore = false // 没数据了，停止加载
    } else {
      if (isLoadMore) {
        const loadedIds = new Set(this.skillList.map(s => s.id))//用 Set 记录已加载的 id，过滤掉重复项 ，数据不重复显示
        newSkills = newSkills.filter(skill => !loadedIds.has(skill.id))// 如果返回数量 < limit，说明到底了

        this.skillList.push(...newSkills)
        this.hasMore = newSkills.length >= this.loadSize
      } else {
        this.skillList = newSkills
        this.hasMore = newSkills.length >= this.loadSize
      }
    }
  } catch (error) {
    console.error('加载技能失败', error)
    this.hasMore = false
  } finally {
    this.loading = false
  }
},

    async checkAuth() {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const res = await getUserProfile()
          this.userInfo = res.user
        } catch (e) {
          if ((e.response && e.response.status === 401) || (e.message && e.message.includes('token'))) {
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            this.userInfo = null
          }
        }
      }
    },

    async loadNotices() {
      try {
        const res = await listNotices({ status: '0' })
        if (res && res.rows && Array.isArray(res.rows)) {
          this.notices = res.rows.map(item => {
            let title = stripHtml(item.noticeTitle || '')
            let content = stripHtml(item.noticeContent || '')
            let text = ''
            if (title && content) {
              text = `${title}：${content}`
            } else if (title) {
              text = title
            } else {
              text = content || '无内容'
            }
            if (text.length > 100) {
              text = text.substring(0, 100) + '...'
            }
            return { ...item, displayText: text }
          })
        } else {
          this.notices = []
        }
      } catch (error) {
        console.error('加载公告失败', error)
        this.notices = []
      }
    },

    onScroll() {
      if (this.scrollTimer) return
      this.scrollTimer = setTimeout(() => {
        this.scrollTimer = null

        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
        const clientHeight = document.documentElement.clientHeight
        const scrollHeight = document.documentElement.scrollHeight

        // 触发加载更多
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          if (this.hasMore && !this.loading) {
            this.loadSkills(true)
          }
        }

        // 控制回到顶部按钮
        this.showBackToTop = scrollTop > 400
      }, 150)
    },

    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    // 轮播图控制
goTo(index) {
  // 防止越界
  const safeIndex = Math.max(0, Math.min(index, this.banners.length - 1));
  this.currentIndex = safeIndex;
  //强制刷新 DOM，避免样式未生效
  this.$nextTick(() => {
    const wrapper = this.$refs.bannerWrapper;
    if (wrapper) {
      // 使用 transform 移动，但确保值是精确的
      wrapper.style.transform = `translateX(${-safeIndex * 100}%)`;
    }
  });
},

next() {
  if (this.banners.length <= 1) return;
  const nextIndex = (this.currentIndex + 1) % this.banners.length;
  this.goTo(nextIndex);
},

prev() {
  if (this.banners.length <= 1) return;
  const prevIndex = (this.currentIndex - 1 + this.banners.length) % this.banners.length;
  this.goTo(prevIndex);
},
    startAutoPlay() {
      this.intervalId = setInterval(() => {
        this.next()
      }, 4000)
    },
    stopAutoPlay() {
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
    },

    viewSkill(id) {
      this.$router.push(`/skill/${id}`)
    },

    handleBannerClick(banner) {
      if (!banner.activityId) {
        console.warn('该轮播图未配置活动ID')
        return
      }
      const isLoggedIn = !!localStorage.getItem('token')
      if (isLoggedIn) {
        this.$router.push(`/activity/${banner.activityId}`)
      } else {
        this.$router.push(`/login?redirect=/activity/${banner.activityId}`)
      }
    }
  }
}
</script>

<style scoped>
.home-container {
  font-family: Arial, sans-serif;
  padding: 0;
  margin: 0;
}

/* 公告区 */
.notice-section {
  padding: 5px 5px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.notice-container {
  display: flex;
  align-items: center;
  height: 30px;
  overflow: hidden;
}

.notice-content {
  flex: 1;
  font-size: 0.9rem;
  color: #0f0d0d;
  white-space: nowrap;
}

.notice-item {
  margin-right: 20px;
  font-weight: 500;
}

.no-notice {
  color: #999;
  font-size: 0.9rem;
}

/* 轮播图容器 */
.banner-section {
  position: relative;
  width: 100%;
  max-width: 800px;
  height: 180px;
  margin: 5px auto;
  overflow: hidden;
  border-radius: 8px;
  cursor: grab;
}

.banner-section:active {
  cursor: grabbing;
}

.banner-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.4s ease-out;
}

.banner-slide {
  width: 100%;     
  height: 100%;
  position: relative;
  flex-shrink: 0;
  flex-grow: 0;         /* 禁止伸缩 */
  box-sizing: border-box; /* 防止 padding/margin 干扰 */
}
.banner-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-text {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 1rem;
  white-space: nowrap;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.prev-btn {
  left: 10px;
}

.next-btn {
  right: 10px;
}

.carousel-indicators {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 10;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.indicator.active {
  background: white;
}

/* 技能卡片 */
.skills-section {
  padding: 0 16px 20px;
}

.skills-section h2 {
  margin-left: 8px;
  margin-bottom: 12px;
  font-size: 1.2rem;
  color: #333;
}

.skills-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skill-card {
  min-width: 160px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.skill-card:hover {
  transform: translateY(-4px);
}

.card-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.card-content {
  padding: 10px;
}

.card-content h3 {
  font-size: 0.95rem;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user {
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 6px;
}

.method {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 10px;
}

.method.online {
  background: #e6f7ff;
  color: #1890ff;
}

.method.offline {
  background: #fff7e6;
  color: #fa8c16;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  padding: 0 8px 12px;
  gap: 8px;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 20px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #409eff;
}

.search-btn {
  width: 36px;
  height: 36px;
  background: #f0f2f5;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  outline: none;
  transition: all 0.2s;
}

.search-btn:hover {
  background: #e6e8eb;
  color: #606266;
}

.no-skills, .loading-tip, .no-more {
  text-align: center;
  padding: 16px 0;
  color: #999;
  font-size: 0.95rem;
}

.back-to-top {
  position: fixed;
  bottom: 80px;
  right: 16px;
  background: #409eff;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.banner-section {
  cursor: grab;
}

.banner-section:active {
  cursor: grabbing;
}
</style>