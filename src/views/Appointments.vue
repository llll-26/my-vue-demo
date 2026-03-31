<template>
  <div class="appointments-page">
    <!-- 统一容器 -->
    <div class="container">
      <h2>我的预约</h2>

      <!-- 我预约的别人 -->
      <div class="section">
        <h3>我预约的技能</h3>
        <div v-if="loadingRequester" class="loading">加载中...</div>
        <div v-else-if="myOrders.length === 0" class="no-data">暂无预约记录</div>
        <div v-else class="order-list">
          <!-- 添加动态状态类名 -->
          <div 
            v-for="order in myOrders" 
            :key="order.id" 
            class="order-item"
            :class="`status-${order.status}`"
            @click="viewDetail(order)"
          >
            <div class="info">
              <div class="title">{{ order.skillTitle }}</div>
              <div class="provider">提供者：{{ order.providerNickName }}</div>
              <div class="time">时间：{{ formatTime(order.appointmentTime) }}</div>
         <div class="location">教学方式：{{ getTeachingMethod(order.method) }}</div>
              <div class="status">{{ getStatusText(order.status) }}</div>
            </div>
            <div class="points">+{{ order.learnerPoints }} 学习积分</div>
          </div>
        </div>
        <div v-if="!loadingRequester && myOrders.length > 0" class="pagination">
          <el-pagination
            @current-change="handleRequesterCurrentChange"
            :current-page="requesterPage.pageNum"
            :page-size="requesterPage.pageSize"
            layout="total, prev, pager, next, jumper"
            :total="requesterPage.total"
          />
        </div>
      </div>

      <!-- 别人预约我的技能 -->
      <div class="section">
        <h3>别人预约我的技能</h3>
        <div v-if="loadingProvider" class="loading">加载中...</div>
        <div v-else-if="providerOrders.length === 0" class="no-data">暂无被预约记录</div>
        <div v-else class="order-list">
          <!-- 添加动态状态类名 -->
          <div 
            v-for="order in providerOrders" 
            :key="order.id" 
            class="order-item"
            :class="`status-${order.status}`"
          >
            <!-- 点击 info 区域进入详情 -->
            <div class="info" @click="viewDetail(order)">
              <div class="title">{{ order.skillTitle }}</div>
              <div class="requester">预约者：{{ order.requesterNickName }}</div>
              <div class="time">时间：{{ formatTime(order.appointmentTime) }}</div>
            <div class="location">教学方式：{{ getTeachingMethod(order.method) }}</div>
              <div class="status">{{ getStatusText(order.status) }}</div>
            </div>
            <div class="points">+{{ order.providerPoints }} 服务积分</div>

            <!--仅当状态为"待确认"时显示操作按钮 -->
            <div v-if="order.status === 0" class="actions">
              <el-button size="mini" type="success" @click.stop="handleConfirm(order)">同意</el-button>
              <el-button size="mini" type="danger" @click.stop="handleReject(order)">拒绝</el-button>
            </div>
          </div>
          <div v-if="!loadingProvider && providerOrders.length > 0" class="pagination">
            <el-pagination
              @current-change="handleProviderCurrentChange"
              :current-page="providerPage.pageNum"
              :page-size="providerPage.pageSize"
              layout="total, prev, pager, next, jumper"
              :total="providerPage.total"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  getMyAppointmentsAsRequester,
  getMyAppointmentsAsProvider,
  confirmOrder,
  rejectOrder,
} from '@/api/skill'

export default {
  name: 'Appointments',
  data() {
    return {
      // 分页控制-我预约的
      requesterPage: {
        pageNum: 1,
        pageSize: 2,
        total: 0
      },
      // 分页控制-别人预约我的
      providerPage: {
        pageNum: 1,
        pageSize: 2,
        total: 0
      },
      loadingRequester: true,   // 我预约的
      loadingProvider: true,    // 别人预约我的
      myOrders: [],             // 我预约的
      providerOrders: [],       // 别人预约我的
    }
  },
  async mounted() {
    await Promise.all([
      this.fetchMyOrders(),
      this.fetchProviderOrders()
    ])
  },
  methods: {
    getTeachingMethod(method) {
  if (method === 0) return '线上';
  if (method === 1) return '线下';
  return '未设置';
},
    // 我预约的分页
    async fetchMyOrders() {
      try {
        const res = await getMyAppointmentsAsRequester({
          pageNum: this.requesterPage.pageNum,
          pageSize: this.requesterPage.pageSize
        })
        this.myOrders = res.data.list || []
        this.requesterPage.total = res.data.total || 0
      } catch (error) {
        console.error('获取"我预约的"失败:', error)
        this.$message.error('获取预约记录失败')
      } finally {
        this.loadingRequester = false
      }
    },
    
    handleRequesterCurrentChange(val) {
      this.requesterPage.pageNum = val
      this.fetchMyOrders()
    },

    // 别人预约我的分页
    async fetchProviderOrders() {
      try {
        const res = await getMyAppointmentsAsProvider({
          pageNum: this.providerPage.pageNum,
          pageSize: this.providerPage.pageSize
        })
        this.providerOrders = res.data.list || []
        this.providerPage.total = res.data.total || 0
      } catch (error) {
        console.error('获取"别人预约我的"失败:', error)
        this.$message.error('获取被预约记录失败')
      } finally {
        this.loadingProvider = false
      }
    },
    
    handleProviderCurrentChange(val) {
      this.providerPage.pageNum = val
      this.fetchProviderOrders()
    },
    
    formatTime(time) {
      return new Date(time).toLocaleString()
    },
    
    getStatusText(status) {
      const map = {
        0: '待确认',
        1: '已同意',
        2: '已拒绝',
        3: '已完成（待确认）',
        4: '已结束'
      }
      return map[status] || '未知'
    },
    
    viewDetail(order) {
      this.$router.push(`/order/${order.id}`)
    },
    
    async handleConfirm(order) {
      try {
        await this.$confirm('确定要同意该预约吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await confirmOrder(order.id)
        this.$message.success('已同意该预约')
        await this.fetchProviderOrders()
      } catch (err) {
        if (err !== 'cancel') {
          this.$message.error(err.msg || '操作失败')
        }
      }
    },
    
    async handleReject(order) {
      try {
        await this.$confirm('确定要拒绝该预约吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await rejectOrder(order.id)
        this.$message.success('已拒绝该预约')
        await this.fetchProviderOrders()
      } catch (err) {
        if (err !== 'cancel') {
          this.$message.error(err.msg || '操作失败')
        }
      }
    }
  }
}
</script>

<style scoped>
/* 统一容器，确保所有内容宽度一致 */
.appointments-page {
  background-color: #f8fafc;
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 24px;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section h3::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 16px;
  background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
  border-radius: 2px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 订单项样式 */
.order-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.order-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

/* 状态条 */
.order-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 4px;
  background: #cbd5e1; /* 默认颜色 */
}

/* 动态状态颜色*/
.order-item.status-0::before { background: #f59e0b; }
.order-item.status-1::before { background: #10b981; }
.order-item.status-2::before { background: #ef4444; }
.order-item.status-3::before { background: #8b5cf6; }
.order-item.status-4::before { background: #64748b; }

.info {
  min-width: 0;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 4px;
  word-break: break-word;
}

.provider,
.requester,
.time,
.location {
  font-size: 13px;
  color: #475569;
  margin-bottom: 3px;
}

/* 状态标签样式 */
.order-item .status {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}

/* 动态状态背景色 */
.order-item.status-0 .status { background: #fffbeb; color: #d97706; }
.order-item.status-1 .status { background: #ecfdf5; color: #047857; }
.order-item.status-2 .status { background: #fef2f2; color: #b91c1c; }
.order-item.status-3 .status { background: #f5f3ff; color: #7c3aed; }
.order-item.status-4 .status { background: #f1f5f9; color: #475569; }

.points {
  font-weight: 700;
  font-size: 14px;
  text-align: right;
  color: #3b82f6;
  white-space: nowrap;
}

/* 操作按钮区 */
.actions {
  display: flex;
  gap: 8px;
  grid-column: span 2;
  justify-self: end;
}

.actions .el-button {
  border-radius: 6px;
  font-weight: 600;
  padding: 5px 15px;
  font-size: 12px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.no-data,
.loading {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 14px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>