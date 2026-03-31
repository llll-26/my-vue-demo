<template>
  <div class="activity-detail-container">
    <!-- 活动封面 -->
    <div class="banner">
      <img :src="activity.coverImg || defaultCover" alt="活动封面" />
    </div>

    <!-- 活动信息卡片 -->
    <div class="info-card">
      <h1 class="title">{{ activity.title }}</h1>

      <div class="detail-item">
        <i class="icon el-icon-time"></i>
        <span class="label">时间：</span>
        <span class="value">{{ activity.startTime }} - {{ activity.endTime }}</span>
      </div>

      <div class="detail-item">
        <i class="icon el-icon-location-outline"></i>
        <span class="label">地点：</span>
        <span class="value">{{ activity.location }}</span>
      </div>

      <div class="detail-item">
        <i class="icon el-icon-s-flag"></i>
        <span class="label">状态：</span>
        <span :class="['status-badge', statusClass]">{{ statusText }}</span>
      </div>

      <div class="detail-item">
        <i class="icon el-icon-user"></i>
        <span class="label">报名状态：</span>
        <span class="enroll-status" :class="{ enrolled: activity.isEnrolled }">
          {{ activity.isEnrolled ? '已报名' : '未报名' }}
        </span>
      </div>

      <div class="detail-item">
        <i class="icon el-icon-medal"></i>
        <span class="label">积分奖励：</span>
        <span class="value">{{ activity.pointsReward || 0 }} 分</span>
      </div>

      <!-- 活动描述 -->
      <div v-if="activity.description" class="description" v-html="activity.description"></div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button
        v-if="canEnroll"
        type="primary"
        size="large"
        class="enroll-btn"
        @click="enroll"
        :loading="enrolling"
        round
      >
        {{ enrolling ? '报名中...' : '立即报名' }}
      </el-button>
      <el-button
        v-else
        size="large"
        disabled
        round
      >
        {{ enrollButtonText }}
      </el-button>
    </div>
  </div>
</template>

<script>
import { getActivityDetail, enrollActivity, checkEnrolled } from '@/api/activity'
import { getFullImageUrl } from '@/utils/image'

export default {
  name: 'ActivityDetail',
  data() {
    return {
      activityId: this.$route.params.id,
      activity: {},
      enrolling: false,
      defaultCover: 'https://via.placeholder.com/300x150'
    }
  },
  async created() {
    await this.loadActivity()
  },
  computed: {
    statusText() {
      const now = new Date()
      const start = new Date(this.activity.startTime)
      const end = new Date(this.activity.endTime)

      if (now < start) return '未开始'
      if (now > end) return '已结束'
      return '进行中'
    },
    statusClass() {
      const now = new Date()
      const start = new Date(this.activity.startTime)
      const end = new Date(this.activity.endTime)
      if (now < start) return 'status-future'
      if (now > end) return 'status-ended'
      return 'status-active'
    },
   canEnroll() {
  const now = new Date()
  const activityStart = new Date(this.activity.startTime)
  const isEnrolled = this.activity.isEnrolled
  return now < activityStart && !isEnrolled
},
   enrollButtonText() {
  if (this.activity.isEnrolled) {
    return '已报名'
  }
  
  const now = new Date()
  const activityStart = new Date(this.activity.startTime)

  if (now >= activityStart) {
    return '报名已截止'
  }
  return '立即报名'
}
  },
  methods: {
    goHome() {
    this.$router.push('/home') 
  },
    formatImageUrl(url) {
      return getFullImageUrl(url)
    },
    async loadActivity() {
  try {
    //加载活动详情
    const detailRes = await getActivityDetail(this.activityId)
    if (detailRes.code !== 200 || !detailRes.data) {
      this.$message.error('活动不存在')
      this.$router.push('/home')
      return
    }
    this.activity = { ...detailRes.data }

    //查询是否已报名
    const checkRes = await checkEnrolled(this.activityId)
    this.activity.isEnrolled = checkRes.data 
    //处理封面图
    if (this.activity.coverImg && !this.activity.coverImg.startsWith('http')) {
      this.activity.coverImg = this.formatImageUrl(this.activity.coverImg)
    }
  } catch (error) {
    console.error('加载活动失败', error)
    this.$message.error('活动不存在或已下架')
    this.$router.back()
  }
},
async enroll() {
  if (!localStorage.getItem('token')) {
    this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    return
  }

  this.enrolling = true
  try {
    await enrollActivity(this.activityId)
    this.$message.success('报名成功！')
    this.activity.isEnrolled = true
  } catch (error) {
    const msg = error.message || '报名失败'
    this.$message.error(msg)
  } finally {
    this.enrolling = false
  }
}
  }
}
</script>

<style scoped>
.activity-detail-container {
  background: #f9fafb;
  min-height: 100vh;
  padding: 0 16px 80px;
}

/* 封面 */
.banner img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-top: 12px;
}

/* 信息卡片 */
.info-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-top: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 24px;
  line-height: 1.4;
}

/* 详情项 */
.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
  gap: 8px;
}

.icon {
  font-size: 18px;
  color: #6b7280;
  min-width: 20px;
  text-align: center;
}

.label {
  font-weight: 600;
  color: #374151;
  min-width: 80px;
}

.value {
  color: #4b5563;
  flex: 1;
}

/* 状态徽章 */
.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}
.status-active { background: #52c41a; }
.status-future { background: #faad14; }
.status-ended { background: #ff4d4f; }

/* 报名状态 */
.enroll-status {
  font-weight: 600;
  color: #faad14;
}
.enroll-status.enrolled {
  color: #52c41a;
}

/* 描述 */
.description {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  color: #4b5563;
  line-height: 1.6;
  font-size: 0.95rem;
}
.description ::v-deep p {
  margin: 8px 0;
}

/* 操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

::v-deep .enroll-btn {
  width: 100%;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border: none;
  font-weight: 600;
  letter-spacing: 1px;
}
::v-deep .enroll-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #1890ff);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}
::v-deep .el-button--large {
  height: 50px;
  font-size: 1.1rem;
}

/* 响应式 */
@media (min-width: 768px) {
  .activity-detail-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 24px 100px;
  }
  .banner img {
    height: 240px;
    border-radius: 16px;
  }
  .info-card {
    padding: 32px;
  }
  .title {
    font-size: 1.8rem;
  }
}
</style>