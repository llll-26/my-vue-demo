<template>
  <div class="login-container">
    <div class="form-wrapper">
      <h2>大学生技能交换平台</h2>

      <div class="input-group">
        <input v-model="loginForm.username" placeholder="请输入账号" />
      </div>

      <div class="input-group">
        <input v-model="loginForm.password" type="password" placeholder="请输入密码" />
      </div>

      <!-- 验证码区域 -->
      <div class="input-group captcha-group" v-if="captchaEnabled">
        <div class="captcha-input-wrapper">
          <input
            v-model="loginForm.code"
            placeholder="请输入验证码"
            maxlength="5"
            @keyup.enter="handleLogin"
          />
          <img
            :src="codeUrl"
            @click="loadCaptcha"
            alt="验证码"
            class="captcha-img"
          />
        </div>
      </div>

      <button class="login-btn" @click="handleLogin">登 录</button>

      <p class="register-link">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
      <div style="margin-top: 10px; color: black; font-size: 12px;">
      忘记密码？请联系系统管理员（电话：138-8888-3333）
      </div>
    </div>
  </div>
</template>

<script>
import { login } from '@/api/auth'
import { getUserProfile } from '@/api/user'
import { userStore } from '@/store/user'
import { getCodeImg } from "@/api/auth"

export default {
  name: 'StudentLogin',
  data() {
    return {
      codeUrl: "", //正确变量名
      loginForm: {
        username: '',
        password: '',
        code: '',
        uuid: ''
      },
      captchaEnabled: true
    }
  },
  async mounted() {
    await this.loadCaptcha()
  },
  methods: {
   async loadCaptcha() {
  try {
    const res = await getCodeImg()
    
    const data = res.data ? res.data : res
    
    this.captchaEnabled = data.captchaEnabled !== false
    if (this.captchaEnabled) {
      this.codeUrl = "data:image/gif;base64," + data.img
      this.loginForm.uuid = data.uuid
    }
  } catch (error) {
    console.error("验证码加载失败:", error)
    this.$message?.error("验证码加载异常")
  }
},

    async handleLogin() {
      const { username, password, code, uuid } = this.loginForm

      if (!username || !password) {
        this.$message.warning('请输入账号和密码')
        return
      }

      if (this.captchaEnabled && !code) {
        this.$message.warning('请输入验证码')
        return
      }

      try {
        const loginRes = await login({
          username,
          password,
          code,
          uuid
        })

        const token = loginRes.token
        if (!token) throw new Error('登录响应无效')

        localStorage.setItem('token', token)

        const profileRes = await getUserProfile()
        console.log(profileRes)
        const user = profileRes.data || {}  // 修改：使用 data 而不是 user
        userStore.setInfo({
          id: user.userId,  // 修改：使用 userId
          userId: user.userId,
          username: user.userName,  // 修改：使用 userName
          nickName: user.nickName,
          avatar: user.avatar,
          points: user.points,
          email: user.email
        })

        this.$router.push(this.$route.query.redirect || '/home')
      } catch (error) {
        localStorage.removeItem('token')
        userStore.clear()
        // 刷新验证码
        if (this.captchaEnabled) {
          this.loadCaptcha()
        }

        let msg = '登录失败，请检查账号密码'
        if (error.response?.data?.msg) {
          msg = error.response.data.msg
        }
        this.$message.error(msg)
      }
    }
  }
}
</script>

<style scoped>
/* 容器全屏并设置背景图 */
.login-container {
  width: 100vw;
  height: 100vh;
  background: url('../assets/登录注册背景图.png') no-repeat center center;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
}

/* 中间登录框 - 毛玻璃效果 */
.form-wrapper {
  width: 250px;
  padding: 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.form-wrapper h2 {
  margin-bottom: 30px;
  color: #1a1a1a;
  font-size: 24px;
  letter-spacing: 2px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-sizing: border-box;
  font-size: 14px;
  background: white;
  color: #333;
  outline: none;
  transition: all 0.3s;
}

.input-group input::placeholder {
  color: #999;
}

.input-group input:focus {
  border-color: #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 239, 0.2);
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  margin-top: 10px;
  transition: background 0.3s, transform 0.2s;
}

.login-btn:hover {
  background: #66b1ff;
  transform: translateY(-1px);
}

.login-btn:active {
  transform: translateY(1px);
}

.register-link {
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #409eff;
  font-weight: bold;
  text-decoration: none;
  border-bottom: 1px solid #409eff;
  padding-bottom: 2px;
  margin-left: 5px;
}

.register-link a:hover {
  color: #66b1ff;
  border-color: #66b1ff;
}

/* 验证码区域 */
.captcha-group {
  display: flex;
  justify-content: center;
}

.captcha-input-wrapper {
  display: flex;
  width: 100%;
  gap: 8px;
}

.captcha-input-wrapper input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  color: #333;
  outline: none;
  transition: all 0.3s;
}

.captcha-input-wrapper input:focus {
  border-color: #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 239, 0.2);
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
</style>