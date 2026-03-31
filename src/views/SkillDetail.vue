<template>
  <div class="skill-detail">

    <div v-if="loading">加载中...</div>
    <div v-else-if="!skill" class="not-found">技能不存在</div>
   <div v-else>
  <div class="cover-container">
    <img :src="formatImageUrl(skill.coverImg)" alt="封面" class="cover" />
    <div class="title-section">
      <h1>{{ skill.title }}</h1>
      <p class="user">
        发布者：
        <span 
          class="nickname-link" 
          @click="showPublisherInfo(skill.userId)"
        >
          {{ skill.nickName }}
        </span>
      </p>
    </div>
  </div>

  <!-- 可提供时间 -->
<div v-if="hasAvailableTimes" class="section pink">
      <div class="section-header">
  <h3>提供者可提供时间</h3>
      </div>
        <div class="section-content">
  <ul style="margin: 8px 0; padding-left: 16px;">
    <li v-for="(time, i) in availableTimes" :key="i" style="margin: 4px 0; color: #333;">
      {{ time }}
    </li>
  </ul>
  <p class="hint">以上为参考时间，您可填写其他时间尝试预约。</p>
        </div>
</div>

<!-- 用户手动输入预约时间 -->
<div class="section white">
    <div class="section-header">
  <h3>请输入您的预约时间</h3>
    </div>
         <div class="section-content">
  <el-input
    v-model="selectedTime"
    placeholder="例如：2025-12-30 14:00"
    style="width: 100%;"
  />
  <p class="hint">格式：yyyy-MM-dd HH:mm（如 2025-12-30 14:00）</p>
         </div>
</div>

<!-- 服务方式 -->
<div class="section blue">
  <div class="section-header">
  <h3>服务方式</h3>
  </div>
  <div class="section-content">
  <p>{{ skill.teachingMethod || '未设置' }}</p>
</div>
</div>

<!-- 技能描述 -->
<div class="section gray">
    <div class="section-header">
  <h3>技能描述</h3>
    </div>
    <div class="section-content">
  <p>{{ skill.description || '暂无描述' }}</p>
</div>
</div>

<!-- 学习积分奖励 -->
<div class="section orange">
    <div class="section-header">
  <h3>学习积分奖励</h3>
    </div>
       <div class="section-content">
  <p>参与此技能学习，每小时可获得 <strong>{{ skill.pointsPerHour || 0 }}</strong> 学习积分</p>
       </div>
</div>

  <!-- 预约按钮 -->
  <div class="action-bar">
    <el-button 
      type="primary" 
      size="large" 
      @click="handleReserve"
      :loading="reserving"
      :disabled="!canReserve || !selectedTime.trim()"
    >
      预约此技能
    </el-button>
  </div>
</div>
    <!-- 用户信息浮窗 -->
<el-dialog
  :visible.sync="showUserDialog"
  title="发布者信息"
  width="320px"
  @close="clearUserDialog"
>
  <div v-if="dialogUser" class="user-dialog-content">
    <img :src="formatImageUrl(dialogUser.avatar)" class="dialog-avatar" />
    <p><strong>昵称：</strong>{{ dialogUser.nickName }}</p>
    <p><strong>性别：</strong>{{ dialogUser.sex === '0' ? '男' : '女' }}</p>
    <p><strong>学院：</strong>{{ dialogUser.college || '未填写' }}</p>
    <p><strong>专业：</strong>{{ dialogUser.major || '未填写' }}</p>
    
    <!-- 评分 -->
    <div v-if="averageScore !== null" class="rating-info">
      <p><strong>综合评分：</strong>
        <span style="color: #f7ba2a; font-size: 16px;">
          {{ averageScore }} 分
        </span>
        （{{ totalReviews }} 条）
      </p>
    </div>
    <p v-else><strong>综合评分：</strong><span style="color: #999;">暂无评价</span></p>
  </div>
  <div v-else>
    <el-skeleton :rows="6" animated />
  </div>

  <span slot="footer" class="dialog-footer">
    <el-button type="primary" @click="contactUser">联系TA</el-button>
    <el-button @click="showUserDialog = false">关闭</el-button>
  </span>
</el-dialog>
  </div>
</template>

<script>
import { getSkillDetail, reserveSkill} from '@/api/skill'
import { getUserPublicInfo, getReceivedRatingsByUserId } from '@/api/user'
import { parseAvailableTime } from '@/utils/html'
export default {
  name: 'SkillDetail',
  data() {
    return {
      skill: null,
      loading: false,
      reserving: false,
      selectedTime: '',
      //浮窗相关
      showUserDialog: false,
      dialogUser: null,
      averageScore: null,
      totalReviews: 0
    }
  },
  computed: {
    availableTimes() {
      return Array.isArray(this.skill.availableTimeList) ? this.skill.availableTimeList : [];
    },
    hasAvailableTimes() {
      return this.availableTimes.length > 0;
    },
    canReserve() {
        return !!this.skill;
    }
  },
  async mounted() {
    await this.loadDetail();
  },
  methods: {
async showPublisherInfo(userId) {
  if (!userId) return;
  
  this.showUserDialog = true;
  this.dialogUser = null;
  this.averageScore = null;
  this.totalReviews = 0;

  try {
    const userRes = await getUserPublicInfo(userId);
    
    let userData;
    if (userRes.data && typeof userRes.data === 'object') {
      userData = userRes.data;
    } else if (userRes.nickName) {
      // 字段在根层级（当前情况）
      userData = userRes;
    } else {
      throw new Error('用户数据格式无效');
    }

    this.dialogUser = {
      userId: userData.userId,
      nickName: userData.nickName,
      avatar: userData.avatar,
      sex: userData.sex,
      college: userData.college,
      major: userData.major
    };


    const ratingRes = await getReceivedRatingsByUserId(userId);
    if (ratingRes.code === 200) {
      // 如果 ratingRes.data 是数组，需要自己计算平均分
      if (Array.isArray(ratingRes.data)) {
        const ratings = ratingRes.data.map(item => item.rating).filter(r => r >= 1 && r <= 5);
        if (ratings.length > 0) {
          this.averageScore = parseFloat((ratings.reduce((a,b)=>a+b)/ratings.length).toFixed(1));
          this.totalReviews = ratings.length;
        }
      } else if (ratingRes.data && typeof ratingRes.data === 'object') {
        // 标准格式
        this.averageScore = ratingRes.data.averageScore;
        this.totalReviews = ratingRes.data.totalReviews;
      }
    }
  } catch (err) {
    console.error('加载失败', err);
    this.$message.error('无法加载用户信息');
  }
},
// 关闭时清理
clearUserDialog() {
  this.dialogUser = null;
  this.averageScore = null;
  this.totalReviews = 0;
},
    formatImageUrl(url) {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      let clean = url.replace(/\/+/g, '/');
      if (!clean.startsWith('/')) clean = '/' + clean;
      return (process.env.VUE_APP_BASE_API || '') + clean;
    },
   async loadDetail() {
  const id = this.$route.params.id;
  if (!id) {
    this.$message.error('无效的技能ID');
    this.$router.push('/home');
    return;
  }

  this.loading = true;
  try {
    const res = await getSkillDetail(id);
    this.skill = res.data;

 this.skill.availableTimeList = parseAvailableTime(this.skill.availableTime);
  } catch (err) {
    console.error('加载失败:', err);
    this.$message.error('加载技能详情失败');
    this.$router.push('/home');
  } finally {
    this.loading = false;
  }
},
async handleReserve() {
  const inputStr = this.selectedTime ? this.selectedTime.trim() : '';

  if (!inputStr) {
    this.$message.warning('请输入预约时间');
    return;
  }

  // 尝试从任意格式中提取日期和时间
  let datePart = '';
  let timePart = '';

  // 正则：匹配类似 "2026-1-1 13:00"、"2026-12-3113:00"、"2026-01-01T13:00" 等
  const match = inputStr.match(/^(\d{4}-\d{1,2}-\d{1,2})[\sT]*(\d{1,2}:\d{2})/);

  if (match) {
    datePart = match[1]; // 如 "2026-1-1"
    timePart = match[2]; // 如 "13:00"
  } else {
    this.$message.warning('时间格式不正确，请参考示例：2025-12-30 14:00 或 2025-1-1 9:30');
    return;
  }

  // 补全日期为标准格式 YYYY-MM-DD
  const [year, month, day] = datePart.split('-').map(Number);
  const paddedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // 补全时间为 HH:mm
  const [hour, minute] = timePart.split(':').map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    this.$message.warning('时间无效，请确保小时在 0-23，分钟在 0-59');
    return;
  }
  const paddedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  // 构造后端需要的格式
  const appointmentTime = `${paddedDate}T${paddedTime}`; // e.g., "2026-01-01T13:00"

  this.reserving = true;
  try {
    await reserveSkill({
      skillId: this.skill.id,
      appointmentTime: appointmentTime,
      durationHours: 1 
    });

    this.$message.success('预约已提交！请等待对方确认');
    this.$router.push('/home');
  } catch (err) {
    console.error('预约失败:', err);
    this.$message.error(err.msg || '预约失败，请稍后再试');
  } finally {
    this.reserving = false;
  }
},
// 联系用户
contactUser() {
  if (!this.dialogUser || !this.dialogUser.userId) {
    this.$message.error('用户信息无效')
    return
  }
  
  // 跳转到聊天页面
  this.$router.push({
    path: '/chat',
    query: {
      userId: this.dialogUser.userId
    }
  })
}
  }
}
</script>

<style>
.skill-detail {
  position: relative;
  max-width: 800px;
  margin: 10px auto 0;
  background-color: #f9f9f9;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
font-family: system-ui, sans-serif;/*优先使用用户设备的系统默认字体，不支持时则用任意无衬线字体兜底，让文字既原生又清晰*/ 
}

.cover-container {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.cover {
  width: 180px;
  height: 180px;
  object-fit: cover;
  border-radius: 12px;
  background-color: #eee;
  flex-shrink: 0;
}

.title-section {
  flex: 1;
}

.title-section h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 8px;
  line-height: 1.2;
  font-weight: 600;
}

.user {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
  word-break: break-all;
}

.nickname-link {
  color: #1890ff;
  cursor: pointer;
  text-decoration: underline;
}
.nickname-link:hover {
  opacity: 0.8;
}

.section {
  margin: 16px 0;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f2f5;
  transition: box-shadow 0.2s ease;
}

.section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.section p {
  color: #555;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.hint {
  color: #999;
  font-size: 5px;
  margin-top: 8px;
  font-style: italic;
}

.el-input {
  margin-bottom: 8px;
}

.action-bar {
  margin: 24px 0;
  text-align: center;
}

.el-dialog__body {
  padding: 20px;
}

.dialog-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
  margin: 0 auto 12px;
  display: block;
}

.rating-info {
  margin-top: 8px;
  font-size: 0.95rem;
  color: #333;
}

.rating-info strong {
  color: #f7ba2a;
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .cover-container {
    flex-direction: column;
    gap: 16px;
  }
  .cover {
    width: 100%;
    height: 160px;
  }
  .title-section h1 {
    font-size: 1.6rem;
  }
}

.section.pink {
  background-color: #f3e5f5;
  border-color: #e0d5f5;
}

.section.blue {
  background-color: #e3f2fd;
  border-color: #bbdefb;
}

.section.gray {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
}

.section.orange {
  background-color: #ffebee;
  border-color: #ffcdd2;
}

/* 确保文字颜色统一 */
.section h3,
.section p,
.section .hint {
  color: #333;
}
.section-header {
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.section-content {
  margin-top: 4px;
}

.section-content p {
  color: #555;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}
</style>