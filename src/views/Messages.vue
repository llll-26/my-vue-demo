<template>
  <div class="messages-container">
    <!-- 页面标题 -->
    <h2 class="page-title">我的消息</h2>

    <!-- 消息列表 -->
    <div class="message-list">
      <div 
        v-for="item in notifications" 
        :key="item.id"
        class="message-item"
        :class="{ 'unread': item.isRead !== 1 }"
        @click="viewDetail(item)"
      >
        <div class="message-content">
          {{ item.content }}
        </div>
        <div class="message-meta">
          <div class="time">{{ formatDate(item.createdAt) }}</div>
          <el-button size="small" type="text" @click.stop="markAsRead(item)">标记已读</el-button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗-->
    <el-dialog
      :title="getTypeName(detail.type) || '消息详情'" 
      :visible.sync="dialogVisible"
      width="600px"
      custom-class="detail-dialog"
    >
      <div class="detail-body">
        <p><strong>内容：</strong></p>
        <p>{{ detail.content }}</p>
      </div>
      <p class="detail-time">时间：{{ formatDate(detail.createdAt) }}</p>
      <div slot="footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getMyNotifications, markNotificationAsRead } from '@/api/notification';

export default {
  name: "Messages",
  data() {
    return {
      notifications: [],
      dialogVisible: false,
      detail: {},
      typeMap: {
        1: '预约提醒',
        2: '评价提醒',
        3: '审核提醒'
      }
    };
  },
  async created() {
    await this.loadNotifications();
  },
  methods: {
    async loadNotifications() {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const userName = userInfo.userName;
        if (!userName) {
          this.$message.warning('未获取到登录用户信息');
          return;
        }

        const res = await getMyNotifications(userName);
        if (res.code === 200) {
          this.notifications = res.data || [];
          this.$root.$emit('refresh-unread-notification');
        } else {
          this.$message.error(res.msg || '加载失败');
        }
      } catch (error) {
        console.error('加载通知失败:', error);
        this.$message.error('网络错误，请重试');
      }
    },

    viewDetail(row) {
      if (row.isRead !== 1) {
        this.markAsRead(row);
      }
      this.detail = { ...row };
      this.dialogVisible = true;
    },

    async markAsRead(row) {
      const oldStatus = row.isRead;
      row.isRead = 1;
      try {
        const res = await markNotificationAsRead(row.id);
        if (res.code !== 200) throw new Error();
        this.$root.$emit('refresh-unread-notification');
      } catch (err) {
        row.isRead = oldStatus;
        this.$message.error('标记已读失败');
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleString("zh-CN");
    },

    getTypeName(typeId) {
      return this.typeMap[typeId] || '未知通知';
    }
  }
};
</script>

<style scoped>
.messages-container {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #303133;
  margin-bottom: 24px;
}

.message-list {
  margin-top: 20px;
}

.message-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 16px;
}

.message-item:hover {
  background-color: #f5f7fa;
}

.message-item.unread .message-content {
  font-weight: 600;
  color: #303133;
}

.message-content {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.message-meta .el-button {
  padding: 6px 12px;
  font-size: 12px;
  min-width: 70px;
  color: #409eff;
}

/* 弹窗内部样式 */
.detail-dialog {
  border-radius: 8px;
}

.detail-body {
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap; /* 保留换行 */
}

.detail-time {
  font-size: 13px;
  color: #909399;
  margin-top: 16px;
  text-align: right;
}
</style>