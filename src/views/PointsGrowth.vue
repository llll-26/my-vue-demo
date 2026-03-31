<template>
  <div class="points-growth">
    <h2>我的服务记录</h2>

    <el-button 
      type="success" 
      @click="generateAllProofs()" 
      style="margin-bottom: 16px; width: 100%;"
    >
      生成志愿服务证明
    </el-button>

    <el-empty v-if="orders.length === 0" description="暂无服务记录" />

    <!-- 响应式服务记录列表 -->
    <div v-else class="service-list">
      <div 
        v-for="(order, index) in orders" 
        :key="index"
        class="service-card"
      >
        <div class="card-row">
          <strong>服务名称：</strong>
          <span>{{ order.skillTitle }}</span>
        </div>
        <div class="card-row">
          <strong>服务对象：</strong>
          <span>{{ order.requesterNickName }}</span>
        </div>
        <div class="card-row">
          <strong>服务时间：</strong>
          <span>{{ formatDate(order.appointmentTime) }}</span>
        </div>
        <div class="card-row">
          <strong>订单日期：</strong>
          <span>{{ formatDate(order.createdAt) }}</span>
        </div>
        <div class="card-row points">
          <strong>积分奖励：</strong>
          <span>+{{ order.providerPoints }} 分</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { getPointsGrowthOrders, generateServiceProof } from '@/api/points'

export default {
  name: 'PointsGrowth',
  data() {
    return {
      orders: []
    }
  },
  async mounted() {
    await this.loadOrders()
  },
  methods: {
 async generateAllProofs() {
  try {
    const response = await generateServiceProof()

    // 响应是 blob，直接创建 URL
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank') // 新标签打开 PDF
    window.URL.revokeObjectURL(url) // 释放内存
  } catch (error) {
    console.error('生成失败:', error)

    if (error.response?.data instanceof Blob) {
      // 读取错误信息
      const text = await error.response.data.text()
      try {
        const json = JSON.parse(text)
        this.$message.error(json.message || '生成失败')
      } catch {
        this.$message.error('服务器返回异常数据')
      }
    } else {
      this.$message.error('网络错误，请重试')
    }
  }
},

    async loadOrders() {
      try {
        const response = await getPointsGrowthOrders()
        console.log('【growth 接口返回】', response)
        this.orders = response.data || []
      } catch (error) {
        console.error('加载服务记录失败:', error)
        this.$message?.error('加载失败')
      }
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
.points-growth {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.service-list {
  margin-top: 16px;
}

.service-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: #fafafa;
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

.points span {
  color: #e6a23c;
  font-weight: bold;
}

/* 手机端优化 */
@media (max-width: 768px) {
  .points-growth {
    padding: 15px;
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