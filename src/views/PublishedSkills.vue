<template>
  <div style="display: block; overflow: visible;">
    <div class="published-skill-container">
      <h2>已发布技能</h2>

      <!-- 技能列表-->
      <div class="skill-list">
        <div
          v-for="skill in skills"
          :key="skill.id"
          class="skill-item"
          :class="{ active: skill.id === selectedSkillId }"
          @click="selectSkill(skill.id)"
        >
          {{ skill.name }}
        </div>
        <div class="skill-item" @click="gotoPublishSkill">+ 发布新技能</div>
      </div>

      <!-- 仅当没有技能时显示 -->
      <div v-if="skills.length === 0" class="empty-section">
        <p>暂无已发布技能</p>
        <button class="edit-btn" @click="gotoPublishSkill">去发布技能</button>
      </div>

      <!-- 仅当选中时显示 -->
      <div v-if="selectedSkillId" class="skill-detail">
        <h3>技能详情</h3>
        <div style="text-align: right; margin-bottom: 15px;">
          <button v-if="!isEditing && canEdit" @click="startEdit">编辑</button>
          <button v-if="isEditing" @click="cancelEdit">取消</button>
          <button 
    v-if="!isEditing && canDelete" 
    @click="deleteSkill"
    style="margin-left: 8px; background-color: #f56c6c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;"
  >
    删除
  </button>
        </div>
        <div class="form-group">
        <label>技能名称：</label>
        <input type="text" v-model="editingSkill.name" disabled />
        </div>

<!-- 每小时积分-->
<div class="form-group">
  <label>每小时可获得积分：</label>
  <input 
    type="number" 
    v-model.number="editingSkill.pointsPerHour"
    :disabled="!isEditing || !editingSkill.isCustom"
    min="0"
  />
  <span v-if="!editingSkill.isCustom" style="font-size:12px;color:#999;margin-left:8px;">
    （标准技能积分由系统设定，不可修改）
  </span>
</div>
        <div class="form-group">
          <label>技能描述：</label>
          <textarea v-model="editingSkill.description" :disabled="!isEditing" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label>空闲时间：</label>
          <input type="text" v-model="editingSkill.time" :disabled="!isEditing" />
        </div>

        <div class="form-group">
          <label>教学方式：</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" v-model.number="editingSkill.method" :value="0" :disabled="!isEditing" /> 线上教学
            </label>
            <label class="radio-item" style="margin-left: 20px;">
              <input type="radio" v-model.number="editingSkill.method" :value="1" :disabled="!isEditing" /> 线下教学
            </label>
          </div>
        </div>

        <div class="form-group" v-if="editingSkill.image">
          <label>封面图片：</label>
          <img :src="editingSkill.image" alt="封面" style="max-width: 100%; height: 150px; object-fit: cover;" />
        </div>

        <div class="form-group" v-if="isEditing">
          <label>更换封面：</label>
          <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" />
        </div>

        <button @click="submitUpdate" :disabled="!canEdit || !isEditing">
          {{ editingSkill.status === 1 ? '修改并重新提交' : '修改并提交' }}
        </button>

        <span class="status-badge" :class="statusClass">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>
<script>
import { getMyPublishedSkills, updatePublishedSkill,deletePublishedSkill} from '@/api/skill'

export default {
  name: 'PublishedSkill',
  data() {
    return {
      skills: [],
      selectedSkillId: null,
      isEditing: false,
      selectedFile: null,
      editingSkill: {
        id: null,
        name: '',
        description: '',
        time: '',
        method: 0,
        image: null,
        status: 0,
        imageFile: null, // 新增字段用于保存文件对象
        categoryId: null,        // 分类ID
        customCategory: '',      // 自定义分类名称
        pointsPerHour: 0,        // 每小时积分
        isCustom: false          // 是否是“其他技能”
      }
    }
  },
  computed: {
    canEdit() {
      return true;
    },
    canDelete() {
    return true; // 所有状态都允许删除
  },
    statusText() {
      const map = { 0: '审核中', 1: '已通过', 2: '未通过' };
      return map[this.editingSkill.status] || '未知';
    },
    statusClass() {
      if (this.editingSkill.status === 0) return 'audit';
      if (this.editingSkill.status === 1) return 'passed';
      return 'rejected';
    }
  },
  async mounted() {
    await this.loadSkills();
  },
  methods: {
 getFullCoverUrl(url) {
  if (!url) {
    // 返回一个默认占位图（可选）
    return 'https://via.placeholder.com/150?text=No+Image';
  }
  if (url.startsWith('http')) {
    return url;
  }
  // 标准化路径：合并多个斜杠，确保以单斜杠开头
  let clean = url.replace(/\/+/g, '/');
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  return (process.env.VUE_APP_BASE_API || '') + clean;
},
    startEdit() {
      if (!this.canEdit) {
        this.$message.warning('该技能状态不允许编辑');
        return;
      }
      this.isEditing = true;
    },
    cancelEdit() {
  const original = this.skills.find(s => s.id === this.selectedSkillId);
  if (original) {
    // 释放旧的blob链接
    if (this.editingSkill.image && this.editingSkill.image.startsWith('blob:')) {
      URL.revokeObjectURL(this.editingSkill.image);
    }
    this.editingSkill = { ...original };
  }
  this.isEditing = false;
  this.selectedFile = null;
  this.editingSkill.imageFile = null;
},
   async loadSkills() {
  try {
    const res = await getMyPublishedSkills();
    const processed = (res.data || []).map(item => {
      const url = this.getFullCoverUrl(item.coverImg);
      // 判断是否是“其他技能”：categoryId 为 null 或 0，且有 customCategory
      const isCustom = (!item.categoryId || item.categoryId === 0) && !!item.customCategory;

      return {
        id: item.id,
        name: item.title || '',
        description: item.description || '',
        time: (() => {
          if (!item.availableTime) return '';
          try {
            const arr = typeof item.availableTime === 'string' ? JSON.parse(item.availableTime) : item.availableTime;
            return Array.isArray(arr) ? arr.join('、') : '';
          } catch (e) {
            return '';
          }
        })(),
        method: item.method != null ? item.method : 0,
        image: url,
        status: item.status || 0,
        categoryId: item.categoryId,
        customCategory: item.customCategory || '',
        pointsPerHour: item.pointsPerHour || 0,
        isCustom: isCustom
      };
    });
    this.skills = processed;
    if (this.selectedSkillId) {
      this.selectSkill(this.selectedSkillId);
    }
  } catch (err) {
    console.error('加载失败:', err);
    this.$message.error('加载失败');
  }
},
   getEmptySkill() {
  return {
    id: null,
    name: '',
    description: '',
    time: '',
    method: 0,
    image: null,
    status: 0,
    imageFile: null,
    categoryId: null,
    customCategory: '',
    pointsPerHour: 0,
    isCustom: false
  };
},
   selectSkill(id) {
  this.selectedSkillId = id;
  this.isEditing = false;
  const skill = this.skills.find(s => s.id === id);
  if (skill) {
    // 重新计算 isCustom
    const isCustom = (!skill.categoryId || skill.categoryId <= 0) && !!skill.customCategory;
    this.editingSkill = { ...skill, isCustom };
  }
},
    triggerFileInput() {
      if (!this.isEditing) return;
      this.$refs.fileInput.click();
    },
    handleFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        this.$message.error('请上传图片文件（jpg/png）');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        this.$message.error('图片不能超过 2MB');
        return;
      }

      if (this.editingSkill.image && this.editingSkill.image.startsWith('blob:')) {
        URL.revokeObjectURL(this.editingSkill.image);
      }

      this.selectedFile = file;
      this.editingSkill.image = URL.createObjectURL(file);
      this.editingSkill.imageFile = file; // 保存文件对象供提交时使用
    },
    async submitUpdate() {
  //封面图必填
  if (!this.editingSkill.image) {
    this.$message.error('请上传封面图片');
    return;
  }

  //可预约时段必填
  if (!this.editingSkill.time || this.editingSkill.time.trim() === '') {
    this.$message.error('请输入可预约时段');
    return;
  }

  //技能分类或自定义技能必填其一
 // 允许空分类 + 空自定义分类，但必须明确是“其他技能”
if (!this.editingSkill.isCustom) {
  // 如果不是“其他技能”，则必须有分类
  if ((!this.editingSkill.categoryId || this.editingSkill.categoryId <= 0) && !this.editingSkill.customCategory.trim()) {
    this.$message.error('请选择技能分类或填写“其他技能”');
    return;
  }
} else {
  // 如果是“其他技能”，则 customCategory 必须非空
  if (!this.editingSkill.customCategory.trim()) {
    this.$message.error('请填写“其他技能”的名称');
    return;
  }
}

  const formData = new FormData();
  formData.append('id', this.editingSkill.id);
  formData.append('title', this.editingSkill.name);
  formData.append('description', this.editingSkill.description);

  let userTimeInput = this.editingSkill.time.trim();
  let availableTimeArray = userTimeInput ? userTimeInput.split(/[、,，\s]+/).filter(t => t.trim()) : [];
  formData.append('availableTime', JSON.stringify(availableTimeArray));
  formData.append('method', this.editingSkill.method);
  if (this.editingSkill.categoryId && this.editingSkill.categoryId > 0) {
    formData.append('categoryId', this.editingSkill.categoryId);
  } else {
    formData.append('customCategory', this.editingSkill.customCategory.trim());
  }

  //即使是标准技能也传，但“其他技能”必须传
  formData.append('pointsPerHour', this.editingSkill.pointsPerHour);
// 只有用户选择了新文件，才 append
if (this.editingSkill.imageFile) {
  formData.append('coverImg', this.editingSkill.imageFile);
}

  try {
    await updatePublishedSkill(formData);
    this.$message.success('修改成功，请等待审核！');
    this.isEditing = false;
    this.selectedFile = null;
    await this.loadSkills();
  } catch (err) {
    console.error('提交失败:', err);
    this.$message.error('提交失败，请重试');
  }
},
    gotoPublishSkill() {
      this.$router.push('/PublishSkill').catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error(err);
        }
      });
    },
    async deleteSkill() {
  try {
    await this.$confirm('确定要删除该技能吗？此操作不可恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await deletePublishedSkill(this.selectedSkillId);
    this.$message.success('删除成功');

    // 重新加载列表
    await this.loadSkills();

    // 清空当前选中项
    this.selectedSkillId = null;
    this.editingSkill = this.getEmptySkill();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      this.$message.error('删除失败，请重试');
    }
  }
}
  },
  beforeDestroy() {
    if (this.editingSkill.image && this.editingSkill.image.startsWith('blob:')) {
      URL.revokeObjectURL(this.editingSkill.image);
    }
  }
}
</script>

<style>
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
}
.published-skill-container {
  padding: 0 10px 10px 20px;
  background-color: #f9f9f9;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 标题样式 */
h2 {
  margin-bottom: 20px;
}

.skill-list {
  display: block;
  margin-bottom: 30px;
  position: static; 
}

.skill-item {
  padding: 10px 10px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.skill-item:hover {
  background-color: #f0f0f0;
}

.skill-item.active {
  background-color: #0066cc;
  color: white;
  border-color: #0066cc;
}

/* 详情区域 - 确保它在下方 */
.skill-detail {
  background-color: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

input[type="text"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 10px;
  color: #fff;
}
.status-badge.audit { background: #ff9800; }
.status-badge.passed { background: #4CAF50; }
.status-badge.rejected { background: #f44336; }

.empty-section {
  text-align: center;
  padding: 50px;
  background: white;
  border-radius: 8px;
}
.radio-group {
  display: flex;
  gap: 15px;
}

.radio-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-item input[type="radio"] {
  margin-right: 6px;
}
</style>