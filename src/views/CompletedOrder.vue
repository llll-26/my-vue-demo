<template>

  <div class="orders-page">
    <div v-if="averageScore !== null" style="margin-bottom: 20px; font-size: 18px; color: #409eff;">
  您的平均评分：{{ averageScore }} 分
</div>
    <el-empty v-if="orders.length === 0" description="暂无已完成的订单" />

   <el-card
  v-for="order in orders"
  :key="order.id"
  class="order-card"
  :class="{
    'card-learner': isLearner(order),
    'card-provider': !isLearner(order)
  }"
  style="margin-bottom: 16px;"
>
      <!-- 对方用户信息 -->
      <div class="peer-info">
        <el-avatar :src="getPeerAvatar(order)" :size="40" />
        <div style="margin-left: 12px;">
          <p style="font-weight: bold; margin: 0;">
            {{ getPeerName(order) || '未知用户' }}
          </p>
          <p style="font-size: 12px; color: #999; margin: 4px 0 0;">
            {{ formatDate(order.appointmentTime) }}
          </p>
        </div>
      </div>

      <!-- 技能与教学安排 -->
      <div class="section" style="margin-top: 16px;">
        <p><strong>技能：</strong>{{ order.skillTitle || '未知技能' }}</p>
<p><strong>教学方式：</strong>
  <span v-if="order.teachingMethod === '线上'">线上</span>
  <span v-else-if="order.teachingMethod === '线下'">线下</span>
  <span v-else>未设置</span>
</p>
        <p v-if="order.locationDetail">
          <strong>地点/会议：</strong>{{ order.locationDetail }}
        </p>

        <!-- 凭证显示 -->
  <div v-if="order.proofUrl" class="proof-section" style="margin-top: 12px;">
  <p><strong>完成凭证：</strong></p>
  <template v-if="isImageUrl(order.proofUrl)">
    <!-- 只显示文字链接，不显示 img -->
    <p class="view-link" @click="showOriginalImage(order.proofUrl)">点击查看凭证图片</p>
  </template>
  <template v-else>
    <p>{{ order.proofUrl || '无凭证' }}</p>
    <p v-if="isHttpUrl(order.proofUrl)" class="view-link">
      <a :href="order.proofUrl" target="_blank" rel="noopener">点击打开链接</a>
    </p>
  </template>
</div>
      </div>
      <!-- 评论操作区 -->
      <div v-if="canComment(order)" style="margin-top: 16px; text-align: right;">
        <el-button
          v-if="!isCommented(order)"
          type="primary"
          size="small"
          @click="goToComment(order)"
        >
          去评论
        </el-button>
        <el-tag v-else type="success" size="small">已评论</el-tag>
      </div>

<!--评分 -->

<div v-if="getPeerComment(order)" class="rating-section">
  <p><strong>评分：</strong>{{ order.score }} 分</p>
  <p><strong>评价：</strong>{{ getPeerComment(order) }}</p>
</div>

    </el-card>
     <el-pagination
      v-if="total > 0"
      background
      layout="prev, pager, next, jumper, total"
      :total="total"
      :current-page.sync="pageNum"
      :page-size="pageSize"
      @current-change="handlePageChange"
      class="pagination-container"
    />
    <!-- 图片预览弹窗 -->
    <el-dialog
      :visible.sync="dialogVisible"
      width="80%"
      title="完成凭证"
      append-to-body
    >
      <img 
        :src="currentImageUrl" 
        alt="凭证" 
        style="max-width: 100%; height: auto; display: block; margin: 0 auto;"
      />
    </el-dialog>
  </div>
</template>

<script>
import { getCompletedOrders } from '@/api/skill'
import { Message } from 'element-ui'
import { userStore } from '@/store/user'
import { getFullImageUrl } from '@/utils/image'
export default {
  name: 'CompletedOrder',
    mounted() {
   console.log('【当前用户】', userStore.info)
  },
  data() {
    return {
      orders: [],
      dialogVisible: false,
      currentImageUrl: '',
      total: 0,        // 总记录数
      pageNum: 1,      // 当前页码
      pageSize: 2    // 每页条数
    }
  },
 async activated() {
    await this.loadOrders()
  },
   async created() {
    await this.loadOrders()
  },
  computed: {
    currentUser() {
      return userStore.info
    },
    //计算当前用户作为 provider 收到的所有评分的平均分
  averageScore() {
    // 只统计“对方给我打的分” 
    const myReceivedScores = this.orders
      .filter(order => {
        // 当前用户是 provider
        return (
          this.currentUser &&
          order.providerId === this.currentUser.userId &&
          typeof order.score === 'number' &&
          order.score >= 0
        )
      })
      .map(order => order.score)

    if (myReceivedScores.length === 0) return null

    const sum = myReceivedScores.reduce((a, b) => a + b, 0)
    return parseFloat((sum / myReceivedScores.length).toFixed(1))
  }
  },
  methods: {
    getTeachingMethodText(method) {
  const num = parseInt(method);
  if (num === 0) return '线上';
  if (num === 1) return '线下';
  return '未设置';
},
    handlePageChange(page) {
    this.pageNum = page
    this.loadOrders()
  },
    goToComment(order) {
    if (!order || !order.id) {
      Message.warning('无效订单')
      return
    }
    // 跳转到 WriteReview 页面，并传参
    this.$router.push({
      name: 'WriteReview',
      query: {
        orderId: order.id,
        skillTitle: order.skillTitle || '该服务'
      }
    })
  },
    formatImageUrl(url) {
  return getFullImageUrl(url);
},
    isLearner(order) {
  return this.currentUser && order.requesterId === this.currentUser.userId
},
    async loadOrders() {
  try {
    const res = await getCompletedOrders({
      pageNum: this.pageNum,
      pageSize: this.pageSize
    })

    if (res.code === 200) {
      this.orders = Array.isArray(res.data.list) ? res.data.list : []
      this.total = res.data.total || 0
      console.log('加载到的已完成订单:', this.orders)
    } else {
      Message.error('加载订单失败：' + (res.msg || '未知错误'))
      this.orders = []
      this.total = 0
    }
  } catch (error) {
    console.error('请求失败:', error)
    Message.error('网络错误，请重试')
    this.orders = []
    this.total = 0
  }
},

    getPeerName(order) {
      if (!this.currentUser) {
        return order.providerNickName || order.requesterNickName || ''
      }
      // 当前用户是学员 → 显示老师昵称；否则显示学员昵称
      return order.requesterId === this.currentUser.userId
        ? order.providerNickName || ''
        : order.requesterNickName || ''
    },

   getPeerAvatar(order) {
  if (!this.currentUser || !this.currentUser.userId) {
    return '/avatar-default.png'
  }

  if (order.requesterId === this.currentUser.userId) {
    return getFullImageUrl(order.providerAvatar) || '/avatar-default.png'
  }

  else {
    return getFullImageUrl(order.requesterAvatar) || '/avatar-default.png'
  }
},

    isImageUrl(url) {
      if (!url || typeof url !== 'string') return false
      return url.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
    },

    isHttpUrl(url) {
      if (!url || typeof url !== 'string') return false
      return /^https?:\/\//i.test(url)
    },

showOriginalImage(url) {
  if (this.isImageUrl(url)) {
    this.currentImageUrl = this.formatImageUrl(url);
    this.dialogVisible = true;
  }
},

    formatDate(value) {
      if (!value) return '未知时间'
      const date = new Date(value)
      if (isNaN(date.getTime())) return '无效时间'
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    },

    canComment(order) {
      if (!this.currentUser || !this.currentUser.userId || !order) {
        return false
      }
      // 只有订单的 requester
      return order.requesterId === this.currentUser.userId
    },

  isCommented(order) {
  return this.isLearner(order) && order.hasCommented === 1;
},

// 获取对方对我的评价
getPeerComment(order) {
  if (!this.isLearner(order)) {
    return order.comment || order.commentContent || '';
  }
  return '';
}
  }
}
</script>

<style scoped>
.orders-page {
  padding: 20px;
}
.order-card {
  border-radius: 12px;
}
.peer-info {
  display: flex;
  align-items: center;
}
.proof-img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-link {
  margin-top: 8px;
  font-size: 12px;
  color: #409eff;
  text-decoration: underline;
  cursor: pointer;
}
::v-deep(.card-learner) {
  background-color: #f0fff0 ; 
  border-left: 5px solid #2e8b57;
}

::v-deep(.card-provider) {
  background-color: #e6f7ff ;
  border-left: 5px solid #1890ff;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>