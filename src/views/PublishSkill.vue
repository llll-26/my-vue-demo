<template>
  <div class="publish-container">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileUpload"
    />

    <main class="main-content">
      <!-- 左侧菜单 -->
      <aside class="sidebar">
        <div 
          class="menu-item" 
          :class="{ active: $route.path === '/PublishedSkills' }"
          @click="$router.push('/PublishedSkills')"
        >
          已发布技能
        </div>
        <div class="menu-item active">发布新技能</div>
      </aside>

      <!-- 右侧表单 -->
      <section class="form-section">
        <h2>发布新技能</h2>

        <!-- 技能选择区域 -->
  <!-- 技能选择区域 -->
<div class="form-group">
  <label>技能选择：</label>
  <div 
    class="custom-select-wrapper" 
    @click="toggleSkillList"
  >
    <div class="selected-text">
      {{ selectedSkill ? selectedSkill.name : '请选择一个技能' }}
      <!-- 新增清除按钮 -->
      <span 
        v-if="selectedSkill" 
        class="clear-icon"
        @click.stop="clearSelectedSkill"
      >×</span>
    </div>
    <div class="arrow-icon">▼</div>
    
    <ul v-if="showSkillList" class="skill-dropdown">
      <li
        v-for="skill in categories"
        :key="skill.id"
        @click.stop="selectSkill(skill)" 
        class="dropdown-item"
      >
        {{ skill.name }} ({{ skill.pointsPerHour }}积分)
      </li>
    </ul>
  </div>
</div>

        <!-- 自定义技能输入-->
        <div class="custom-skill-section">
          <label style="margin-bottom: 8px;">或其他技能：</label>
          <div class="form-group">
            <input
              v-model="customName"
              type="text"
              placeholder="请输入技能名称"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <textarea
              v-model="formData.description" 
              placeholder="请输入技能描述"
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-group">
            <label>封面图：</label>
            <div class="upload-area" @click="triggerFileInput">
              <img
                v-if="customCover"
                :src="customCover"
                alt="封面"
                class="cover-preview"
                @click="triggerFileInput"
              />
              <span v-else class="upload-placeholder">点击上传封面图</span>
            </div>
          </div>
        </div>

     <!-- 公共字段 -->
<div class="form-group">
  <label>
    每小时可获积分<span class="required"></span>：
  </label>

  <!-- 已选技能,显示但禁用 -->
  <template v-if="selectedSkill">
    <input
      :value="selectedSkill.pointsPerHour"
      type="number"
      class="form-input"
      style="width: 120px"
      readonly
      disabled
    />
    <span style="color: #666; margin-left: 10px">（审核通过后生效）</span>
  </template>

  <!-- 自定义技能：显示为 0 且不可编辑 -->
  <template v-else>
    <input
      value="0"
      type="number"
      class="form-input"
      style="width: 120px"
      readonly
      disabled
    />
    <span style="color: #666; margin-left: 10px">（自定义技能无积分）</span>
  </template>
</div>
<div class="form-group">
  <label>教学方式 <span class="required"></span>：</label>
  <div class="radio-group">
    <label class="radio-item">
      <input
        type="radio"
        v-model.number="formData.method"
        :value="0"
      />
      线上教学
    </label>
    <label class="radio-item" style="margin-left: 20px;">
      <input
        type="radio"
        v-model.number="formData.method"
        :value="1"
      />
      线下教学
    </label>
  </div>
</div>

        <div class="form-group">
          <label>可预约时间段：</label>
          <textarea
            v-model="availableTimeText"
            placeholder="例如：&#10;- 周一 19:00-21:00&#10;- 周末全天"
            rows="3"
            class="form-textarea"
          ></textarea>
        </div>

        <button
          class="submit-btn"
          @click="submitForm"
          :disabled="loading"
        >
          {{ loading ? '提交中...' : '提交审核' }}
        </button>
      </section>
    </main>
  </div>
</template>

<script>
import { publishSkill, getSkillCategories, uploadSkillCover } from "@/api/skill"; 
import { getFullImageUrl} from '@/utils/image';
export default {
  name: "PublishSkill",
  data() {
    return {
      showSkillList: false,
    selectedSkill: null,
      loading: false,
      categories: [],
      customName: "",
      customDesc: "",
      customCover: "",
      formData: {
        title: "",
        description: "",
        coverImg: "",
        categoryId: null,
        pointsPerHour: 10,
        availableTime: "",
        method: 0
      },
      availableTimeText: ""
    };
  },
  async created() {
    await this.loadCategories();
  },
  mounted() {
  document.addEventListener('click', this.closeDropdown);
},
beforeDestroy() {
  document.removeEventListener('click', this.closeDropdown);
},
  methods: {
    closeDropdown(e) {
    if (!this.$el.contains(e.target)) {
      this.showSkillList = false;
    }
  },
    async loadCategories() {
      try {
        const res = await getSkillCategories();
        this.categories = res.data || [];
      } catch (error) {
        console.error("加载分类失败", error);
        this.$modal.msgError("加载技能分类失败");
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    
    },

async handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    this.loading = true;
    const uploadRes = await uploadSkillCover(file); 

    if (uploadRes && uploadRes.code === 200 && uploadRes.fileName) {
      const coverPath = uploadRes.fileName; 

      this.customCover = getFullImageUrl(coverPath);
      this.formData.coverImg = coverPath; // 存原始相对路径

      this.$message.success("封面图上传成功");
    } else {
      this.$message.error("上传失败：" + (uploadRes?.msg || "未知错误"));
    }
  } catch (error) {
    console.error("上传异常:", error); 
    this.$message.error("上传失败，请重试");
  } finally {
    this.loading = false;

  }
  
}, 
toggleSkillList() {
    if (!this.selectedSkill) {
      this.showSkillList = !this.showSkillList;
    } else {
      // 如果已选择，点击区域也允许展开
      this.showSkillList = !this.showSkillList;
    }
  },

  // 清空已选技能
  clearSelectedSkill() {
    this.selectedSkill = null;
    this.formData.title = "";
    this.formData.categoryId = null;
    this.formData.coverImg = "";
    this.customCover = "";
    this.showSkillList = false;
    console.log("已清空技能选择");
  },
// selectSkill 只做初始化
selectSkill(skill) {
  this.selectedSkill = skill;
  this.showSkillList = false;

  this.formData.title = skill.name;

  this.formData.coverImg = skill.coverImg || ""; 

  this.formData.categoryId = skill.id;
  this.formData.pointsPerHour = skill.pointsPerHour;
  
  // 清空自定义输入
  this.customName = "";
  this.customDesc = "";


  if (skill.coverImg) {
    this.customCover = getFullImageUrl(skill.coverImg);
  } else {
    this.customCover = "";
  }
},

async submitForm() {
  // 技能互斥校验 
  const hasSelectedSkill = !!this.selectedSkill;
  const hasCustomSkill = !!this.customName?.trim();

  if (hasSelectedSkill && hasCustomSkill) {
    this.$message.warning("不能同时选择已有技能和填写其他技能");
    return;
  }
  if (!hasSelectedSkill && !hasCustomSkill) {
    this.$message.warning("请选择一个技能或填写其他技能名称");
    return;
  }

  //必填字段校验 
  if (!this.formData.description?.trim()) {
    this.$message.warning("请填写技能描述");
    return;
  }

  if (!this.$refs.fileInput.files.length) {
    this.$message.warning("请上传封面图");
    return;
  }

  if (!this.availableTimeText?.trim()) {
    this.$message.warning("请填写可预约时间段");
    return;
  }

  //构造提交数据
  const formData = new FormData(); 

  const finalTitle = hasSelectedSkill 
    ? this.selectedSkill.name 
    : this.customName.trim();

  let points = 0;
  if (hasSelectedSkill) {
    points = this.selectedSkill.pointsPerHour || 0;
  }


  formData.append('title', finalTitle);
  formData.append('description', this.formData.description.trim());
  formData.append('availableTime', this.availableTimeText.trim());
  formData.append('method', this.formData.method.toString());
  formData.append('pointsPerHour', points.toString());

  if (hasSelectedSkill) {
    formData.append('categoryId', this.selectedSkill.id);
  } else {
    formData.append('customCategory', this.customName.trim());
  }

  //确保是文件对象
  if (this.$refs.fileInput.files.length > 0) {
    formData.append('coverImg', this.$refs.fileInput.files[0]);
  }


  try {
    this.loading = true;
    await publishSkill(formData);
    this.$message.success("提交成功，请等待审核！");
    this.$router.push("/PublishedSkills");
  } catch (error) {
    const msg = error.response?.data?.msg || "发布失败";
    this.$message.error(msg);
  } finally {
    this.loading = false;
  }
}
  }
};
</script>

<style>
.publish-container {
  display: flex;
  height: 100%;
}

.main-content {
  display: flex;
  width: 100%;
}

.sidebar {
  width: 200px;
  background: #f8f9fa;
  padding: 20px 0;
  border-right: 1px solid #eee;
}

.menu-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 16px;
  color: #333;
}

.menu-item:hover,
.menu-item.active {
  background: #e9ecef;
  font-weight: bold;
}

.form-section {
  flex: 1;
  padding: 30px;
  background: #fff;
}

.skill-select-wrapper {
  position: relative;
  width: 100%;
  min-height: 120px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.skill-preview {
  padding: 20px;
  text-align: center;
  background: #e6f7ff;
  cursor: pointer;
}

.preview-cover {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  margin: 0 auto 10px;
}

.preview-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.preview-desc {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.placeholder-text {
  color: #999;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
}

.skill-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-top: none;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.skill-item {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  font-size: 14px;
}

.skill-item:last-child {
  border-bottom: none;
}

.skill-item:hover {
  background-color: #f0f8ff;
}

.custom-skill-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #ddd;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
}

.required {
  color: red;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.form-section .upload-area {
  width: 300px;
  height: 320px;
  border: 1px dashed #aaa;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.upload-placeholder {
  color: #999;
  font-size: 14px;
  text-align: center;
}

.submit-btn {
  padding: 10px 24px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.custom-select-wrapper {
  position: relative;
  width: 100%;
  height: 40px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 14px;
  overflow: visible;
}
.skill-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  border-radius: 0 0 6px 6px;
  margin-top: 2px;
}
.selected-text {
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  color: #333;
}

.arrow-icon {
  font-size: 12px;
  color: #666;
  transition: transform 0.2s;
}

.custom-select-wrapper:hover .arrow-icon {
  transform: rotate(180deg);
}

.skill-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  border-radius: 0 0 6px 6px;
}

.dropdown-item {
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: #f0f8ff;
}
.radio-group {
  display: flex;
  align-items: center;
}

.radio-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.radio-item input {
  margin-right: 6px;
}
.clear-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 50%;
  background: #ddd;
  color: #666;
  margin-left: 8px;
  cursor: pointer;
  font-size: 12px;
}

.clear-icon:hover {
  background: #ccc;
}
</style>