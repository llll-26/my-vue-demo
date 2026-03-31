<template>
  <div class="register-container">
    <!-- 注册表单 -->
    <div class="form-wrapper">
      <h2>学生注册</h2>
      <form @submit.prevent="handleRegister" class="register-form">
        <input
          v-model="formData.studentId"
          type="text"
          placeholder="请输入学号"
          required
        />
        <input
          v-model="formData.nickName"
          type="text"
          placeholder="请输入姓名"
          required
        />
        <input
          v-model="formData.phonenumber"
          type="tel"
          placeholder="请输入手机号"
          required
        />
        <input
          v-model="formData.password"
          type="password"
          placeholder="请输入密码（6-20位）"
          required
        />
        <input
          v-model="confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          required
        />

        <!-- 验证码区域-->
        <div class="captcha-group" v-if="captchaEnabled">
          <div class="captcha-input-wrapper">
            <input
              v-model="formData.code"
              placeholder="请输入验证码"
              maxlength="5"
              style="flex: 1; padding: 12px 15px; border: 1px solid #ddd; border-radius: 10px; font-size: 14px;"
            />
            <img
              :src="codeUrl"
              @click="loadCaptcha"
              alt="验证码"
              class="captcha-img"
            />
          </div>
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? '注册中...' : '立即注册' }}
        </button>

        <p class="login-link">
          已有账号？<router-link to="/login">立即登录</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import { register } from '@/api/auth'
import { getCodeImg } from '@/api/auth' // 复用登录页的验证码接口

export default {
  name: 'Register',
  data() {
    return {
      loading: false,
      captchaEnabled: true,
      codeUrl: '',
      formData: {
        studentId: '',
        nickName: '',
        phonenumber: '',
        password: '',
        code: '',
        uuid: ''    
      },
      confirmPassword: ''
    }
  },
  async mounted() {
    await this.loadCaptcha()
  },
  methods: {
    async loadCaptcha() {
      try {
        const res = await getCodeImg()
        const data = res.data || res
        this.captchaEnabled = data.captchaEnabled !== false
        if (this.captchaEnabled) {
          this.codeUrl = "data:image/gif;base64," + data.img
          this.formData.uuid = data.uuid
        }
      } catch (error) {
        console.error('验证码加载失败:', error)
        this.$message?.error?.('验证码加载异常')
      }
    },

    validateForm() {
      const { studentId, nickName, phonenumber, password, code } = this.formData

      if (!studentId || !/^\d{8,12}$/.test(studentId)) {
        alert('请输入正确的学号（8-12位数字）')
        return false
      }
      if (!nickName || nickName.length < 2) {
        alert('姓名至少2个字')
        return false
      }
      if (!phonenumber || !/^1[3-9]\d{9}$/.test(phonenumber)) {
        alert('请输入正确的手机号')
        return false
      }
      if (!password || password.length < 6 || password.length > 20) {
        alert('密码长度为6-20位')
        return false
      }
      if (password !== this.confirmPassword) {
        alert('两次密码不一致')
        return false
      }
      if (this.captchaEnabled && !code) {
        alert('请输入验证码')
        return false
      }
      return true
    },

    async handleRegister() {
      if (!this.validateForm()) return

      this.loading = true
      try {
        const registerData = {
          username: this.formData.studentId,
          studentId: this.formData.studentId,
          password: this.formData.password,
          phonenumber: this.formData.phonenumber,
          nickName: this.formData.nickName,
          code: this.formData.code,   // 传给后端
          uuid: this.formData.uuid    // 传给后端
        }

        const res = await register(registerData)
        alert('注册成功！请前往登录')
        this.$router.push('/login')
      } catch (error) {
        let msg = '注册失败，请检查信息'
        if (error.response?.data?.msg) {
          msg = error.response.data.msg
        }
        alert(msg)

        // 验证码错误或失效时刷新
        if (this.captchaEnabled && 
            (msg.includes('验证码') || msg.includes('code'))) {
          this.loadCaptcha()
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>

.captcha-group {
  display: flex;
  justify-content: center;
  margin: 12px 0;
}

.captcha-input-wrapper {
  display: flex;
  width: 100%;
  gap: 8px;
}

.captcha-img {
  width: 90px;
  height: 40px;
  border-radius: 5px;
  cursor: pointer;
  border: 1px solid #ddd;
  user-select: none;
  transition: opacity 0.2s;
}

.captcha-img:hover {
  opacity: 0.8;
}


.register-container {
  width: 100vw;
  height: 100vh;
  background: url('../assets/登录注册背景图.png') no-repeat center center;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
}

.form-wrapper {
  width: 250px;
  height: 520px; /* 稍微增高以容纳验证码 */
  padding: 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.form-wrapper h2 {
  margin-bottom: 16px;
  font-size: 24px;
  letter-spacing: 1px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  color: #333;
}

.register-form input {
  width: 100%;
  padding: 12px 15px;
  margin: 12px 0;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  color: #333;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
}

.register-form input::placeholder {
  color: rgba(0, 0, 0, 0.4);
}

.register-form input:focus {
  border-color: #409eff;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
}

.register-form button {
  width: 100%;
  padding: 12px;
  background: rgba(64, 158, 255, 0.9);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.3s;
  backdrop-filter: blur(4px);
}

.register-form button:hover:not(:disabled) {
  background: rgba(64, 158, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.register-form button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-link {
  margin-top: 20px;
  font-size: 14px;
  text-align: center;
  color: #409eff;
}

.login-link a {
  color: #409eff;
  text-decoration: underline;
  margin-left: 5px;
}

.login-link a:hover {
  color: #66b1ff;
}
</style>