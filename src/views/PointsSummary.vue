<template>
  <div class="redeemed-rewards">
    <h2 style="color: #333; font-weight: bold;">我的已兑换奖品</h2>

    <!-- 加载中 -->
    <div v-if="loading" style="text-align: center; padding: 40px;">
      <i class="el-icon-loading" style="font-size: 24px; color: #409EFF;"></i>
      <p style="margin: 10px 0; color: #666;">加载中...</p>
    </div>

    <!-- 无数据 -->
    <div v-else-if="redeemedList.length === 0" style="text-align: center; padding: 40px; color: #999;">
      暂无已兑换奖品
    </div>

    <!-- 已兑换奖品列表 -->
    <div v-else class="reward-list">
      <div 
        v-for="(item, index) in redeemedList"
        :key="index"
        class="reward-card"
      >
        <div class="card-header">
          <strong>奖品名称：</strong>
          <span>{{ item.name }}</span>
        </div>
        <div class="card-body">
          <div class="card-row">
            <strong>消耗积分：</strong>
            <span>{{ item.pointsUsed }}</span>
          </div>
          <div class="card-row">
            <strong>数量：</strong>
            <span>{{ item.quantity }}</span>
          </div>
          <div class="card-row status-row">
            <strong>状态：</strong>
            <span :class="'status-' + item.status">{{ getStatusText(item.status) }}</span>
          </div>
          <div class="card-row">
            <strong>兑换时间：</strong>
            <span>{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="card-row">
            <strong>兑换码：</strong>
            <span>{{ item.code }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getRedeemedRewards } from '@/api/redeem'

export default {
  data() {
    return {
      redeemedList: [],
      loading: false
    }
  },
  created() {
    this.loadRedeemedRewards()
  },
  methods: {
    async loadRedeemedRewards() {
      this.loading = true
      try {
        const res = await getRedeemedRewards()
        this.redeemedList = res.data || []
      } finally {
        this.loading = false
      }
    },
    getStatusText(status) {
      const map = { 0: '待发放', 1: '已发放', 2: '已使用' }
      return map[status] || '未知'
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      const h = String(date.getHours()).padStart(2, '0')
      const min = String(date.getMinutes()).padStart(2, '0')
      return `${y}-${m}-${d} ${h}:${min}`
    }
  }
}
</script>

<style scoped>
.redeemed-rewards {
  padding: 20px;
}

.reward-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.reward-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform .2s ease-in-out;
  width: calc(50% - 10px); /* 半屏宽度减去间距 */
}

.reward-card:hover {
  transform: translateY(-4px);
}

.card-header {
  padding: 16px;
  background-color: #f7f8fa;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.card-body {
  padding: 16px;
}

.card-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.card-row strong {
  min-width: 80px;
  color: #555;
}

.card-row span {
  flex: 1;
  word-wrap: break-word;
  line-height: 1.4;
}

/* 状态样式 */
.status-row span {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-0 {
  background-color: #ffebeb;
  color: #ff6c6c;
}

.status-1 {
  background-color: #e1ffc9;
  color: #6dd230;
}

.status-2 {
  background-color: #fff0c9;
  color: #ffaa1e;
}

/* 手机端优化 */
@media (max-width: 768px) {
  .reward-card {
    width: 100%; /* 全屏宽度 */
  }
  .card-row {
    flex-direction: column;
    gap: 4px;
  }
  .card-row strong {
    min-width: auto;
  }
}
</style>