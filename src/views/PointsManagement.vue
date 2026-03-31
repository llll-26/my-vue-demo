<template>
  <div class="points-management">
    <!-- 总积分 -->
    <div class="total-points">
<h3>总积分：{{ totalPoints }}</h3>
</div>
 <!-- <el-button @click="syncPoints" size="small" type="primary">同步积分</el-button> -->
    <!-- 积分分类 -->
<div class="points-categories">
  <!-- 服务积分 -->
  <div class="category service" style="background: #b8f5a4">
    <h4>服务积分：{{ servicePoints }}</h4>
    <div class="records-list">
      <div v-for="(record, index) in serviceRecords" :key="index" class="record-item">
        <span>{{ record.name }}</span>
        <span>{{ record.date }}</span>
        <span>+{{ record.points }}分</span>
      </div>
    </div>
  </div>

  <!-- 学习积分 -->
  <div class="category study" style="background: #fff7c6">
    <h4>学习积分：{{ studyPoints }}</h4>
    <div class="records-list">
      <div v-for="(record, index) in studyRecords" :key="index" class="record-item">
        <span>{{ record.name }}</span>
        <span>{{ record.date }}</span>
        <span>+{{ record.points }}分</span>
      </div>
    </div>
  </div>

  <!-- 活动积分 -->
  <div class="category activity" style="background: #ffdab9">
    <h4>活动积分：{{ activityPoints }}</h4>
    <div class="records-list">
      <div v-for="(record, index) in activityRecords" :key="index" class="record-item">
        <span>{{ record.name }}</span>
        <span>{{ record.date }}</span>
        <span>+{{ record.points }}分</span>
      </div>
    </div>
  </div>
</div>
  </div>
</template>

<script>
import { getPointsOverview } from '@/api/points';
import { getMyCompletedActivities } from '@/api/activity';
import request from '@/utils/request'; 
export default {
  name: 'PointsManagement',
  data() {
    return {
      totalPoints: 0,
      servicePoints: 0,
      studyPoints: 0,
      activityPoints: 0,
      serviceRecords: [],
      studyRecords: [],
      activityRecords: []
      
    }
  },
  async mounted() {
    await this.loadPointsData();
  },
  methods: {
async syncPoints() {
  try {
    await request.post('/points/sync');
    this.$message.success('积分已同步成功！');
    //刷新页面或重新加载数据
    await this.loadPointsData();
  } catch (error) {
    this.$message.error('同步失败，请稍后再试');
  }
},
async loadPointsData() {
  try {
    //加载服务 + 学习积分
    const overviewRes = await getPointsOverview();
    const { total = 0, study = 0, service = 0, records = [] } = overviewRes.data || {};

    this.studyPoints = study;
    this.servicePoints = service;
    this.serviceRecords = records.filter(r => r.type === 'service').map(this.formatRecord);
    this.studyRecords = records.filter(r => r.type === 'study').map(this.formatRecord);

    //加载“已完成的活动”来计算活动积分
    const activitiesRes = await getMyCompletedActivities();
    const completedActivities = activitiesRes.data || [];

    // 构造 activityRecords
    this.activityRecords = completedActivities.map(activity => ({
      name: activity.title,                          // 活动名称
      date: this.formatDate(activity.params?.completedAt || activity.created_at), // 完成时间
      points: activity.pointsReward || 0             // 活动奖励积分
    }));

    // 计算活动积分总分
    this.activityPoints = this.activityRecords.reduce((sum, item) => sum + item.points, 0);

    //重新计算总积分
    this.totalPoints = this.servicePoints + this.studyPoints + this.activityPoints;

    console.log('积分数据加载成功', {
      service: this.servicePoints,
      study: this.studyPoints,
      activity: this.activityPoints,
      total: this.totalPoints
    });

  } catch (error) {
    console.error('加载积分数据失败:', error);
    this.$message?.error('加载积分数据失败，请稍后再试');
  }
},
formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
},
    formatRecord(record) {
      const date = new Date(record.appointmentTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return {
        name: record.skillTitle,
        date: `${year}-${month}-${day} ${hours}:${minutes}`,
        points: record.points,
        orderId: record.orderId
      };
    },
    generateStudyArchive() {
      this.$confirm('确定要生成学习档案吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        window.open('/api/study-archive/generate', '_blank');
      });
    }
  }
}
</script>

<style scoped>
.points-management {
  padding: 20px;
  font-family: 'Microsoft YaHei', sans-serif;
}

.total-points {
  width: 180px;
  height: 80px;
  background-color: #a0d8ff;
  border: 1px solid #66b1ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #333;
  font-size: 16px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.points-categories {
  display: grid;
  grid-template-areas:
    "service study"
    "activity activity";
  grid-template-columns: 1fr 1fr; /* 两列等宽 */
  grid-template-rows: auto auto; /* 两行 */
  gap: 16px;
  margin-bottom: 20px;
}
.category.service {
  grid-area: service;
}

.category.study {
  grid-area: study;
}

.category.activity {
  grid-area: activity;
  justify-self: center; /* 居中对齐 */
  width: 100%; /* 占满整行宽度 */
}
.category {
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  overflow: hidden;
  min-width: 120px;
  max-width: 200px;
}

.category h4 {
  margin: 0 0 12px;
  color: #333;
  font-size: 14px;
}

.records-list {
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid #ccc;
  padding-top: 10px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #ddd;
  font-size: 12px;
  color: #333;
}

.record-item span:nth-child(1) {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-wrap: break-word;
  font-size: 12px;
}

.record-item span:nth-child(2) {
  flex: 1;
  text-align: center;
  font-size: 12px;
}

.record-item span:nth-child(3) {
  color: #007bff;
  font-weight: bold;
  font-size: 12px;
}
.category.activity h4 {
  color: #d2691e;
}
.generate-archive-btn {
  width: 200px;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin: 0 auto;
  display: block;
  transition: background-color 0.3s;
}

.generate-archive-btn:hover {
  background-color: #0056b3;
}
</style>