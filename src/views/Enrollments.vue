<template>
  <div class="enrollments-page">
    <h2 class="page-title">我的活动</h2>

    <!-- 加载中 -->
    <div v-if="loading" class="status-message">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 暂无记录 -->
    <div v-else-if="list.length === 0" class="status-message">
      <p>暂无报名记录</p>
    </div>

    <!-- 活动列表 -->
    <div v-else class="activity-list">
      <div
        v-for="item in list"
        :key="item.id"
        class="activity-item"
        @click="goDetail(item.id)"
      >
        <img :src="getFullImageUrl(item.coverImg)" alt="封面" class="cover" />

      <div class="info">
  <h3 class="title">{{ item.title }}</h3>

  <div class="detail-row">
    <i class="icon el-icon-time"></i>
    <span class="text">{{ formatDate(item.startTime) }} - {{ formatDate(item.endTime) }}</span>
  </div>

  <div class="detail-row">
    <i class="icon el-icon-location-outline"></i>
    <span class="text">{{ item.location }}</span>
  </div>

  <div class="detail-row">
    <i class="icon el-icon-medal"></i>
    <span class="text"><strong>积分奖励：</strong>{{ item.pointsReward || 0 }} 分</span>
  </div>

  <!-- 修改：状态标签不再用 absolute，而是放在最后一行 -->
  <span class="status-tag" :class="{ 'status-completed': item.params?.completedAt }">
    {{ item.params?.completedAt ? '已完成' : '已报名' }}
  </span>
</div>
      </div>
    </div>

    <!-- 分页器 -->
    <el-pagination
      v-if="total > 0"
      background
      layout="prev, pager, next, jumper, total"
      :total="total"
      :current-page.sync="pageNum"
      :page-size="pageSize"
      @current-change="handlePageChange"
      class="pagination"
    />
  </div>
</template>

<script>
import { getMyEnrollmentsPage } from '@/api/activity'
import { getFullImageUrl } from '@/utils/image'

export default {
  name: 'Enrollments',
  data() {
    return {
      list: [],
      loading: false,
      total: 0,
      pageNum: 1,
      pageSize: 5
    }
  },
  async created() {
    await this.loadList()
  },
  methods: {
    handlePageChange(page) {
      this.pageNum = page
      this.loadList()
    },
    getFullImageUrl,
    async loadList() {
      this.loading = true
      try {
        const res = await getMyEnrollmentsPage({
          pageNum: this.pageNum,
          pageSize: this.pageSize
        })
        if (res.code === 200) {
          this.list = res.data.list || []
          this.total = res.data.total || 0
        } else {
          this.list = []
          this.total = 0
        }
      } catch (err) {
        this.$message.error('加载失败')
        this.list = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },
    goDetail(id) {
      this.$router.push(`/student/activity/${id}`)
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }
  }
}
</script>

<style scoped>
/* 全局变量 */
:root {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --text-primary: #1f2937;
  --text-secondary: #4b5563;
  --border-color: #e5e7eb;
  --card-bg: #ffffff;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --radius-lg: 16px;
}

/* 页面容器 */
.enrollments-page {
  padding: 0 16px;
  margin-top: 0;
  padding-top: 60px;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
  min-height: calc(100vh - 120px);
}

.page-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  padding-top: 16px;
}

/* 状态提示 */
.status-message {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 1rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
/* 活动项 */
.activity-item {
  display: flex;
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 16px;
}

.activity-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.cover {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 12px;
  margin-right: 16px;
  flex-shrink: 0;
  background-color: #f8fafc;
}

.info {
  flex: 1;
  position: relative;
  min-width: 0; /* 防止文字溢出 */
}

.title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
  line-height: 1.4;
  word-break: break-word;
}

/* 详情行：允许换行 + 更合理截断 */
.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.icon {
  font-size: 16px;
  color: #6b7280;
  min-width: 18px;
  margin-top: 2px;
  flex-shrink: 0; /* 图标不被压缩 */
}

.text {
  flex: 1;
  overflow: hidden;
  line-height: 1.4;
  /* 允许最多两行，超出显示省略号 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

/* 状态标签 - 改为 inline-block，避免绝对定位遮挡 */
.status-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: #e6f7ff;
  color: var(--primary-color);
  margin-left: 8px;
  vertical-align: middle;
}

.status-completed {
  background: #f6ffed;
  color: var(--success-color);
}

/* 分页器 */
.pagination {
  text-align: center;
  margin-top: 24px;
  margin-bottom: 30px;
}

/* 响应式 */
@media (min-width: 768px) {
  .enrollments-page {
    padding: 0 24px;
  }
  .activity-item {
    padding: 20px;
  }
  .cover {
    width: 100px;
    height: 100px;
  }
  .title {
    font-size: 1.25rem;
  }
}
</style>