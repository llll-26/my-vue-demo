<template>
  <div class="order-detail">

    <div v-if="loading">加载中...</div>
    <div v-else-if="!order || !order.id" class="not-found">订单不存在</div>
    <div v-else class="content">
      <h2>预约详情</h2>

      <!-- 技能信息 -->
      <div class="section">
        <h3>技能信息</h3>
        <p><strong>{{ order.skillTitle }}</strong></p>
        <p v-if="order.description">描述：{{ order.description }}</p>
        <div v-if="order.coverImg" class="cover-img">
          <img 
            :src="formatImageUrl(order.coverImg) || defaultCover" 
            alt="技能封面"
            class="cover-img"
          />
        </div>
        <!-- 学习者（预约者）看提供者 -->
<p v-if="isRequester">
  技能提供者：{{ order.providerNickName }}
</p>

<!-- 提供者（被预约者）看预约者 -->
<p v-else-if="isProvider">
  预约学习者：{{ order.requesterNickName }}
</p>
        <p v-if="isRequester">
          学习积分：{{ order.learnerPoints }} /小时
        </p>
        <p v-else-if="isProvider">
          服务积分：{{ order.providerPoints }} /小时
        </p>
      </div>

      <!-- 预约时间 -->
     <div class="section blue hidden">
        <h3>预约时间</h3>
        <p>{{ formatTime(order.appointmentTime) }}</p>
        <p>时长：1 小时</p>
      </div>

      <!-- 教学方式 & 地点 -->
      <div class="section pink hidden">
        <h3>教学安排</h3>
        <p>教学方式：{{ order.teachingMethod === 'ONLINE' ? '线上' : '线下' }}</p>
        <p v-if="order && order.locationDetail">
          具体地点/会议信息：{{ order.locationDetail }}
        </p>

        <!-- 凭证显示区 -->
        <div v-if="order && order.proofUrl" class="proof-info">
          <p><strong>完成凭证：</strong></p>

          <!-- 情况1：是图片（Base64 或 图片 URL） -->
          <template v-if="isImageUrl(order.proofUrl)">
            <p style="margin-top: 8px; color: #666;">
              <span 
                style="color: #409eff; text-decoration: underline; cursor: pointer;" 
                @click="showOriginalImage(order.proofUrl)"
              >
                点击查看原图
              </span>
            </p>
          </template>

          <!-- 情况2：不是图片（当作文字或链接处理） -->
          <template v-else>
            <p>{{ order.proofUrl }}</p>
            <p v-if="isHttpUrl(order.proofUrl)" style="margin-top: 8px;">
              <a 
                :href="order.proofUrl" 
                target="_blank" 
                style="color: #409eff; text-decoration: underline;"
              >
                点击打开链接
              </a>
            </p>
          </template>
        </div>
      </div>

      <!-- 联系方式 -->
<div v-if="isRequester && order && order.providerPhone" class="section">
  <h3>联系方式</h3>
  <p>提供者电话：{{ order.providerPhone }}</p>
</div>

      <!-- 订单状态 -->
      <div class="section gray hidden">
        <h3>当前状态</h3>
        <el-tag :type="statusTagType" size="medium">{{ statusText }}</el-tag>
      </div>

      <!-- 同意/拒绝按钮 -->
      <div v-if="showActions" class="action-bar">
        <el-button 
          type="success" 
          @click="handleConfirm"
          :loading="confirming"
        >
          同意
        </el-button>
        <el-button 
          type="danger" 
          @click="handleReject"
          :loading="rejecting"
        >
          拒绝
        </el-button>
      </div>

      <!-- 上传凭证按钮（提供者，状态=1 或 3） -->
      <div v-if="canComplete" class="action-bar">
        <el-button type="primary" @click="openCompleteDialog">
          上传完成凭证
        </el-button>
      </div>

      <!-- 确认完成按钮（学习者，状态=3 且有凭证） -->
      <div v-if="canConfirmCompletion" class="action-bar">
        <el-button 
          type="success" 
          @click="handleConfirmCompletion"
          :loading="confirmingCompletion"
        >
          确认订单完成
        </el-button>
      </div>
    </div>

    <!-- 查看原图弹窗 -->
    <el-dialog
      :visible.sync="dialogVisible"
      width="80%"
      title="凭证图片"
    >
      <img 
        :src="currentImageUrl" 
        alt="原图" 
        style="max-width: 100%; height: auto; display: block; margin: 0 auto;"
      />
    </el-dialog>

    <!-- 上传凭证弹窗 -->
    <el-dialog
      title="提交完成凭证"
      :visible.sync="showCompleteDialog"
      width="500px"
      :modal-append-to-body="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="dialog-scroll-container">
        <el-form :model="completeForm" label-width="100px">
          <el-form-item label="地点信息">
            <el-input 
              v-model="completeForm.locationDetail" 
              placeholder="请输入具体地点或会议"
              clearable
            ></el-input>
          </el-form-item>

          <el-form-item label="凭证链接">
            <el-input 
              v-model="completeForm.proofUrl" 
              placeholder="请输入图片或URL"
              clearable
              style="width: 70%; display: inline-block;"
            ></el-input>
            <el-button 
              type="primary" 
              size="small" 
              @click="openFilePicker"
              style="margin-left: 8px; display: inline-block;"
            >
              上传图片
            </el-button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none;"
              @change="handleFileChange"
            />
          </el-form-item>
        </el-form>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="showCompleteDialog = false">取消</el-button>
        <el-button type="primary" @click="submitComplete" :loading="completing">提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import {
  getMyRequestedOrderDetail,
  getMyProvidedOrderDetail,
  confirmOrder,
  rejectOrder,
  completeOrder,
  confirmCompletion,
  markOrderAsRead
} from '@/api/skill'
import { userStore } from '@/store/user'
import { getFullImageUrl } from '@/utils/image'
import { uploadSkillCover } from '@/api/skill';
export default {
  name: 'OrderDetail',
  data() {
    return {
      orderId: null,
      order: null,
      loading: false,
      confirming: false,
      rejecting: false,
      completing: false,
      confirmingCompletion: false,
      showCompleteDialog: false,
      dialogVisible: false,
      currentImageUrl: '',
      completeForm: {
        locationDetail: '',
        proofUrl: ''
      }
    }
  },
  computed: {
    dialogWidth() {
    return window.innerWidth < 600 ? '90%' : '500px';
  },
    isRequester() {
      return this.order && userStore.info && userStore.info.userId === this.order.requesterId;
    },
    isProvider() {
      return this.order && userStore.info && userStore.info.userId === this.order.providerId;
    },
    statusText() {
      const map = { 
        0: '待确认', 
        1: '已同意', 
        2: '已拒绝', 
        3: '已完成（待确认）',
        4: '已结束' 
      };
      var status = -1;
      if (this.order) {
        status = this.order.status;
      }
      return map[status] || '未知';
    },
    statusTagType() {
      if (!this.order) return '';
      if (this.order.status === 0) return 'warning';
      if (this.order.status === 1) return 'success';
      if (this.order.status === 2) return 'danger';
      if (this.order.status === 3) return 'info';
      return '';
    },
    showActions() {
      return this.isProvider && this.order && this.order.status === 0;
    },
  canComplete() {
  // 状态为 "已同意" 或 "已完成（待确认）"
  return (
    this.isProvider &&
    this.order &&
    (this.order.status === 1 || this.order.status === 3)
  );
},
    canConfirmCompletion() {
      return (
        this.isRequester &&
        this.order &&
        this.order.status === 3 &&
        this.order.proofUrl &&
        this.order.proofUrl !== ''
      );
    }
  },
  async mounted() {
    this.orderId = this.$route.params.id;
    await this.loadDetail();
  },
 methods: {
 // 判断是否为图片（支持 Base64 和常见图片扩展名）
  isImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return (
      url.startsWith('data:image/') ||
      /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url)
    );
  },

  //判断是否为 HTTP/HTTPS 链接
  isHttpUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return /^https?:\/\//i.test(url);
  },

  //只有图片才弹窗
showOriginalImage(url) {
  if (this.isImageUrl(url)) {
    this.currentImageUrl = this.formatImageUrl(url);
    this.dialogVisible = true;
  }
},
    formatImageUrl(url) {
    return getFullImageUrl(url);
  },
  formatTime(timeStr) {
    if (!timeStr) return '';
    return timeStr.replace('T', ' ');
  },

async loadDetail() {
  this.loading = true;
  const userId = userStore.info?.userId;
  if (!userId) {
    this.$message.error('未登录');
    this.$router.push('/login');
    this.loading = false;
    return;
  }

  let found = false;

  // 尝试作为 requester
  try {
    const res1 = await getMyRequestedOrderDetail(this.orderId);
    if (res1?.code === 200 && res1.data) {
      this.order = res1.data;
      found = true;
    }
  } catch (err) {}

  // 尝试作为 provider
  if (!found) {
    try {
      const res2 = await getMyProvidedOrderDetail(this.orderId);
      if (res2?.code === 200 && res2.data) {
        this.order = res2.data;
        found = true;
      }
    } catch (err) {}
  }

  //标记已读
  if (
    this.order &&
    this.isRequester &&
    this.order.status === 1
  ) {
    try {
      await markOrderAsRead(this.orderId);
      console.log('已标记订单为已读:', this.orderId);
    } catch (err) {
      console.warn('标记已读失败:', err);
    }
  }

  this.loading = false;

  if (!found) {
    this.$message.error('订单不存在或无权查看');
    this.$router.push('/profile/orders');
  }
},

  async handleConfirm() {
    this.confirming = true;
    try {
      await confirmOrder(this.orderId);
      this.$message.success('已同意该预约');
      await this.loadDetail();
    } catch (err) {
      this.$message.error(err.msg || '操作失败');
    } finally {
      this.confirming = false;
    }
  },

  async handleReject() {
    let reason = null;
    try {
      reason = await this.$prompt('请输入拒绝原因', '拒绝预约', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '拒绝原因不能为空'
      });
    } catch (e) {
      return;
    }

    if (!reason || !reason.value) return;

    this.rejecting = true;
    try {
      await rejectOrder(this.orderId, reason.value);
      this.$message.success('已拒绝该预约');
      await this.loadDetail();
    } catch (err) {
      this.$message.error(err.msg || '操作失败');
    } finally {
      this.rejecting = false;
    }
  },

  openCompleteDialog() {
    const loc = this.order && this.order.locationDetail ? this.order.locationDetail : '';
    const proof = this.order?.proofUrl || ''; // 保留上次的凭证
    this.completeForm.locationDetail = loc;
    this.completeForm.proofUrl = proof;
    this.showCompleteDialog = true;
  },

async submitComplete() {
  const url = this.completeForm.proofUrl?.trim();
  if (!url) {
    this.$message.warning('请填写凭证链接');
    return;
  }

  this.completing = true;
  try {

    const response = await completeOrder(this.orderId, {
      locationDetail: this.completeForm.locationDetail,
      proofUrl: url
    });

    this.$message.success('凭证提交成功！');
    this.showCompleteDialog = false;
    await this.loadDetail();
  } catch (err) {
    this.$message.error(err.msg || '提交失败');
  } finally {
    this.completing = false;
  }
},
  async handleConfirmCompletion() {
    this.confirmingCompletion = true;
    try {
      await confirmCompletion(this.orderId);
      this.$message.success('订单已完成！');
      await this.loadDetail();
    } catch (err) {
      this.$message.error(err.msg || '确认失败');
    } finally {
      this.confirmingCompletion = false;
    }
  },
  openFilePicker() {
  // 触发隐藏的文件输入框点击
  this.$refs.fileInput.click();
},

async handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    this.$message.warning('请选择图片文件');
    event.target.value = '';
    return;
  }

  this.$message.info('正在上传图片...');
  try {
    const res = await uploadSkillCover(file);
    console.log('上传响应:', res); // 调试用

    if (res.code === 200 && res.url) {
      this.completeForm.proofUrl = res.url;
      this.$message.success('图片上传成功！');
    } else {
      this.$message.error(res.msg || '上传失败');
    }
  } catch (err) {
    console.error('上传异常:', err);
    this.$message.error('上传失败，请重试');
    this.completeForm.proofUrl = '';
  } finally {
    event.target.value = '';
  }
}
 }
}
</script>

<style>
.dialog-scroll-container {
  max-height: 60vh; 
  overflow-y: auto;
  padding-right: 8px; /* 防止滚动条遮挡内容 */
}


.dialog-scroll-container::-webkit-scrollbar {
  width: 6px;
}
.dialog-scroll-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}
.el-dialog__wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-dialog {
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 12px;
}
.el-form-item .el-input {
  width: 100%;
}
.el-input__inner {
  padding: 8px 12px;
  font-size: 14px;
}
.cover-img {
  text-align: center;
  margin-bottom: 12px;
}
.cover-img img {
  width: 300px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.order-detail {
  position: relative;
  padding: 20px;
  max-width: none;
  width: 90%;
  margin: 0 auto;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.section {
  margin: 12px 0;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eee;
}
.content h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
}
.action-bar {
  text-align: center;
  margin-top: 20px;
}
.proof-info {
  margin-top: 8px;
  color: #606266;
}
.proof-info a {
  color: #409eff;
  text-decoration: underline;
}
.section.pink  { background-color: #f3e5f5; }
.section.blue { background-color: #e3f2fd; }
.section.gray { background-color: #f5f5f5; }
</style>