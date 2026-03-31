<template>
  <div class="feedback-container">
    <el-card class="feedback-card" shadow="never">
      <template #header>
        <h2 class="card-header">意见反馈</h2>
      </template>

      <el-form
        ref="feedbackForm"
        :model="formData"
        :rules="rules"
        label-position="left"
        label-width="80px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="标题" prop="title" class="form-item">
          <el-input
            v-model="formData.title"
            placeholder="例如：希望增加导出功能 / 某页面加载缓慢"
            maxlength="50"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="内容" prop="content" class="form-item">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="6"
            placeholder="请详细描述您遇到的问题或建议，越具体越好（如操作步骤、截图说明等）"
            maxlength="500"
            show-word-limit
            resize="none"
          />
        </el-form-item>

        <el-form-item class="submit-item">
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="handleSubmit"
            class="submit-btn"
          >
            {{ submitting ? '提交中...' : '提交反馈' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { submitFeedback } from '@/api/feedback'

export default {
  name: 'Feedback',
  data() {
    return {
      submitting: false,
      formData: {
        title: '',
        content: ''
        // 联系方式已移除，由后端通过 token 获取用户信息
      },
      rules: {
        title: [
          { required: true, message: '请输入反馈标题', trigger: 'blur' },
          { max: 50, message: '标题不能超过50字', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入反馈内容', trigger: 'blur' },
          { max: 500, message: '内容不能超过500字', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    async handleSubmit() {
      this.$refs.feedbackForm.validate(async (valid) => {
        if (!valid) return

        this.submitting = true
        try {
          await submitFeedback(this.formData)
          this.$message.success('感谢您的反馈！我们会尽快处理。')
          this.$router.go(-1) // 或重置表单：this.resetForm()
        } catch (error) {
          console.error('提交失败:', error)
          this.$message.error('提交失败，请稍后再试')
        } finally {
          this.submitting = false
        }
      })
    },
    resetForm() {
      this.$refs.feedbackForm.resetFields()
    }
  }
}
</script>

<style scoped>
.feedback-container {
  max-width: 720px;
  margin: 32px auto;
  padding: 0 16px;
}

.feedback-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
  background: #ffffff;
}

.card-header {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  text-align: left;
}

/* 表单项间距 */
.form-item {
  margin-bottom: 24px;
}

::v-deep .el-form-item__label {
  font-weight: 600;
  color: #374151;
  line-height: 1.5;
}

::v-deep .el-input__inner,
::v-deep .el-textarea__inner {
  border-radius: 10px;
  border: 1px solid #dfe3e8;
  transition: all 0.3s ease;
  padding-left: 14px;
}

::v-deep .el-textarea__inner {
  padding: 12px 14px;
  resize: none;
}

::v-deep .el-input__inner:focus,
::v-deep .el-textarea__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

/* 提交按钮 */
.submit-item {
  margin-top: 16px;
  text-align: center;
}

.submit-btn {
  width: 180px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #409eff, #1890ff);
  border: none;
  border-radius: 24px;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.3);
}

.submit-btn:active {
  transform: translateY(0);
}

/* 响应式 */
@media (max-width: 768px) {
  .feedback-container {
    padding: 0 12px;
  }
  .card-header {
    font-size: 20px;
  }
  .submit-btn {
    width: 100%;
    max-width: 280px;
  }
}
</style>