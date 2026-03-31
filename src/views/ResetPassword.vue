<!-- src/views/ResetPassword.vue -->
<template>
  <div class="reset-password">
    <h2>修改密码</h2>
    <el-form
      ref="pwdForm"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.native.prevent
    >
      <el-form-item label="原密码" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          show-password
          placeholder="请输入当前密码"
        />
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          placeholder="6-20位，建议含字母+数字"
        />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          placeholder="请再次输入新密码"
        />
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          :loading="loading"
          @click="submitForm"
        >
          确认修改
        </el-button>
        <el-button @click="cancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { updateUserPwd } from '@/api/user'

export default {
  name: 'ResetPassword',
  data() {
    // 自定义校验：两次密码一致
    const validateConfirm = (rule, value, callback) => {
      if (value !== this.form.newPassword) {
        callback(new Error('两次输入的新密码不一致'))
      } else {
        callback()
      }
    }

    return {
      loading: false,
      form: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      rules: {
        oldPassword: [
          { required: true, message: '请输入原密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, max: 20, message: '密码长度6-20位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认新密码', trigger: 'blur' },
          { validator: validateConfirm, trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    submitForm() {
      this.$refs.pwdForm.validate(async (valid) => {
        if (!valid) return

        this.loading = true
        try {
          await updateUserPwd(this.form.oldPassword, this.form.newPassword)
          this.$message.success('密码修改成功！')
          
          // 因为密码已变，旧 token 虽然有效，但安全起见可让用户重新登录
          setTimeout(() => {
            this.$store.dispatch('LogOut').then(() => {
              this.$router.push('/login')
            })
          }, 1000)
        } catch (error) {
          // 若依后端错误会返回 { msg: "错误信息" }
          this.$message.error(error.msg || '修改失败')
        } finally {
          this.loading = false
        }
      })
    },
    cancel() {
      this.$router.go(-1) // 返回上一页
    }
  }
}
</script>

<style scoped>
.reset-password {
  padding: 30px;
  max-width: 600px;
  margin: 20px auto;
}
</style>