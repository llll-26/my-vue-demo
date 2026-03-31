<template>
  <div class="profile-container">
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 右侧内容区 -->
      <section class="content-section">
        
        <div v-if="loading" class="loading">加载中...</div>

        <!-- 个人信息（默认显示） -->
        <div v-else-if="currentView === 'info'" class="tab-content">
          <!-- 显示平均评分 -->
<div class="form-group" v-if="totalReviews > 0">
  <label>我的评分：</label>
  <div style="font-size: 18px; color: #f7ba2a;">
    {{ averageScore }} 分（共 {{ totalReviews }} 条评价）
  </div>
</div>
<div class="form-group" v-else>
  <label>我的评分：</label>
  <div style="color: #999;">暂无他人评价</div>
</div>
          <h2>个人信息</h2>
          <form @submit.prevent="saveInfo" class="profile-form">
            <div class="form-group">
              <label>用户名：</label>
              <div v-if="userInfo">
                <input type="text" :value="userInfo.userName" disabled />
              </div>
            </div>

            <div class="form-group">
              <label class="required">昵称：</label>
              <input type="text" v-model="form.nickName" />
            </div>

            <div class="form-group">
              <label>头像：</label>
              <div class="avatar-uploader" @click="selectAvatar">
                <div class="avatar-wrapper">
                  <img :src="avatarUrl" class="avatar" />
                  <div class="avatar-uploader__tip">点击更换头像</div>
                </div>
              </div>
              <input 
                ref="avatarInput" 
                type="file" 
                accept="image/jpeg,image/png" 
                style="display: none" 
                @change="onAvatarSelected"
              />
              <div class="upload-tip">支持 jpg/png 格式，大小不超过 2MB</div>
            </div>

            <div class="form-group">
              <label class="required">性别：</label>
              <div class="radio-group">
                <label>
                  <input type="radio" v-model="form.sex" value="0" /> 男
                </label>
                <label>
                  <input type="radio" v-model="form.sex" value="1" /> 女
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>邮箱：</label>
              <input type="email" v-model="form.email" />
            </div>

            <div class="form-group">
              <label class="required">手机号：</label>
              <input type="tel" v-model="form.phonenumber" />
            </div>

<div class="form-group">
  <label>学院：</label>
  <input 
    type="text" 
    :value="userInfo?.dept?.deptName || '未分配学院'" 
    class="input-field readonly-input" 
    readonly 
  />
</div>
<div class="form-group">
  <label>专业：</label>
  <input 
    type="text" 
    v-model="form.major" 
    class="input-field readonly-input" 
    readonly 
  />
</div>
            <button type="submit" class="submit-btn">确认修改</button>
            <!-- 退出按钮 -->
          </form>
   <button @click="handleLogout" class="logout-btn">
  退出登录
</button>
        </div>

      </section>
    </main>
  </div>
</template>

<script>
import { userStore } from '@/store/user'
import { getUserProfile, updateUserProfile,getReceivedRatings } from '@/api/user'
import { uploadUserAvatar } from '@/api/user'

export default {
  name: 'Profile',
  computed: {
    userStore() {
      return userStore
    }
  },
  data() {
    return {
      currentView: 'info', //默认显示个人信息
      loading: false,
      userInfo: null,
      form: {
        nickName: '',
        sex: '0',
        email: '',
        phonenumber: '',
        major: '' ,
         avatar: ''
      },
      avatarUrl: require('@/assets/logo.png'),
      avatarFile: null,
      resetPasswordForm: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
   },
    averageScore: null,       // 平均分
    totalReviews: 0           // 评价总数
    }
  },
async mounted() {
  await this.loadRatings()
  try {
    const res = await getUserProfile()
    if (res.code === 200) {
      this.userInfo = res.data
      userStore.setInfo(res.data)

      this.form = {
        nickName: res.data.nickName || '',
        sex: res.data.sex || '0',
        email: res.data.email || '',
        phonenumber: res.data.phonenumber || '',
        major: res.data.major || '',
        avatar: res.data.avatar || ''
      }


      this.avatarUrl = this.getFullAvatarUrl(res.data.avatar)
    } else {
      throw new Error(res.msg)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    localStorage.removeItem('token')
    this.$router.push('/login')
  }
  console.log('DEBUG avatarUrl:', this.avatarUrl)
},
  methods: {
    async loadRatings() {
    try {
      const res = await getReceivedRatings()
      if (res.code === 200) {
        this.averageScore = res.data.averageScore || null
        this.totalReviews = res.data.totalReviews || 0
      }
    } catch (error) {
      console.warn('加载评分失败:', error)
    }
    },

getFullAvatarUrl(avatarPath) {
  if (!avatarPath) return require('@/assets/logo.png');
  const path = avatarPath.startsWith('/') ? avatarPath : '/' + avatarPath;
  return path + '?t=' + Date.now();
},
async loadUserProfile() {
  try {
    this.loading = true
    const res = await getUserProfile()
    if (res.code !== 200) throw new Error(res.msg || '获取失败')

    const user = res.data
    this.userInfo = user
    this.form = {}

    this.avatarUrl = this.getFullAvatarUrl(user.avatar)
  } catch (error) {
    // 错误处理
  } finally {
    this.loading = false
  }
},
// 切换右侧内容区域显示功能模块
  switchView(view) {
    this.currentView = view
  },

async loadUserProfile() {
  try {
    this.loading = true
    const res = await getUserProfile()
    if (res.code !== 200) {
      throw new Error(res.msg || '获取用户信息失败')
    }

    const user = res.data
    this.userInfo = user
    this.form = {
      nickName: user.nickName || '',
      sex: user.sex || '0',
      email: user.email || '',
      phonenumber: user.phonenumber || '',
      major: user.major || '',
      avatar: user.avatar || ''
    }

    this.avatarUrl = this.getFullAvatarUrl(user.avatar)
  } catch (error) {
    console.error('获取用户信息失败', error)
    this.$message.error('加载用户信息失败，请重新登录')
    localStorage.removeItem('token')
    this.$router.push('/login')
  } finally {
    this.loading = false
  }
},
beforeUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isImage) this.$message.error('只能上传 JPG/PNG 格式图片！')
      if (!isLt2M) this.$message.error('图片大小不能超过 2MB！')
      return isImage && isLt2M
    },
   selectAvatar() {
      this.$refs.avatarInput.click()
    },
async onAvatarSelected(e) {
  const file = e.target.files[0]
  if (!file) return

  if (!this.beforeUpload(file)) {
    this.$refs.avatarInput.value = ''
    return
  }

  try {
    const uploadRes = await uploadUserAvatar(file)
    if (uploadRes.code !== 200) {
      this.$message.error(uploadRes.msg || '上传失败')
      return
    }

    const newAvatarPath = uploadRes.imgUrl 

    const updateRes = await updateUserProfile({
      ...this.form,
      avatar: newAvatarPath
    })

    if (updateRes && updateRes.code === 200) {
      this.avatarUrl = this.getFullAvatarUrl(newAvatarPath)  
      this.userInfo = { ...this.userInfo, avatar: newAvatarPath }
      this.form.avatar = newAvatarPath
      this.$message.success('头像更新成功！')
    } else {
      this.$message.error(updateRes.msg || '保存失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    this.$message.error('操作失败，请重试')
  } finally {
    this.$refs.avatarInput.value = ''
  }
},
  async saveInfo() {
    try {
      const submitData = {
        ...this.form
      }
      await updateUserProfile(submitData)
      this.$message.success('个人信息保存成功！')
      await this.loadUserProfile()
    } catch (error) {
      this.$message.error('保存失败，请重试')
    }
  },
async submitResetPassword() {
  const { oldPassword, newPassword, confirmPassword } = this.resetPasswordForm
  // 前端简单校验
  if (!oldPassword) {
    this.$message.error('请输入原密码')
    return
  }
  if (!newPassword || newPassword.length < 6) {
    this.$message.error('新密码至少6位')
    return
  }
  if (newPassword !== confirmPassword) {
    this.$message.error('两次输入的新密码不一致')
    return
  }
  try {
    //调用 API修改密码
    await updatePassword({
      oldPassword,
      newPassword
    })
    this.$message.success('密码修改成功，请重新登录！')
    // 清除本地 token
    localStorage.removeItem('token')
    //清空用户信息
    this.userInfo = null
    
    // 跳转到登录页
    this.$router.push('/login')
    
} catch (error) {
  let errorMsg = '修改失败，请重试'
  if (error.response && error.response.data && error.response.data.msg) {
    errorMsg = error.response.data.msg
  }
  this.$message.error(errorMsg)
        }
      },
    handleLogout() {
  // 清除所有状态
  localStorage.removeItem('token')
  userStore.clear()
  
  this.$message.success('已退出登录')
  this.$router.push('/login')
}
    }
}
</script>


<style>
.profile-container {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}
.logo-icon {
  width: 28px;
  height: 28px;
}

.logo-text {
  font-size: 1.2rem;
  font-weight: bold;
  white-space: nowrap; /* 防止文字换行 */
}
.back-picture { 
  width: 28px;
  height: 28px;
}
.back-text {
  font-size: 0.5rem;
   font-weight: bold;
  white-space: nowrap; /* 防止文字换行 */
}
/* 主内容区 */
.main-content {
  display: flex;
  min-height: calc(100vh - 80px);

}
/* 左侧菜单栏 */
.sidebar {
  width: 80px;
  min-width: 80px;
  flex-shrink: 0; /*禁止拉伸 */
  background-color: #f5f5f5;
  padding: 0;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content-area {
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.back-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 8px;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: #0066cc;
  cursor: pointer;
  border-radius: 6px;
  width: 80%;
}

.back-picture {
  width: 20px;
  height: 20px;
}

/* 菜单项 */
.menu-item {
  width: 70px; /* 固定宽度，避免百分比撑开 */
  padding: 8px 0;
  text-align: center;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: #e0e0e0;
}

.menu-item.active {
  background-color: #0066cc;
  color: white;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.required::before {
  content: "*";
  color: red;
  margin-right: 4px;
}

.input-field {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-group label {
  display: flex;
  align-items: center;
}


.upload-area {
  width: 100%;
  height: 100px;
  border: 2px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #f9f9f9;
  border-radius: 5px;
}

.upload-area:hover {
  border-color: #0066cc;
}

.upload-tip {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.submit-btn {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 20px;
}

.submit-btn:hover {
  background-color: #0055aa;
}

.avatar-img.clickable {
  border: 2px solid #ddd;
  transition: border-color 0.2s;
}

.avatar-upload:hover .avatar-img {
  border-color: #0066cc;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 12px;
  pointer-events: none; /* 防止遮挡点击 */
}

.avatar-upload:hover .avatar-overlay {
  opacity: 1;
}
/* ============ 头像上传区域样式 ============ */
.avatar-uploader {
  display: inline-block;
  width: 100px;
  height: 100px;
  cursor: pointer;
  position: relative;
}

/* 包裹层：撑满容器 */
.avatar-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.avatar-uploader .avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  border: 2px solid #ddd;
  transition: border-color 0.2s;
}

.avatar-uploader:hover .avatar {
  border-color: #0066cc;
}

.avatar-uploader__tip {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 12px;
  pointer-events: none; /* 关键：不阻挡点击 */
}

.avatar-uploader:hover .avatar-uploader__tip {
  opacity: 1;
}
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  
  .main-content {
    flex-direction: column;
  }
  
  .content-section {
    padding: 15px;
  }
}
.logout-btn {
  margin-top: 20px;
  background-color: #ff4d4f; /* 红色 */
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 5px; /* 加圆角更美观 */
  cursor: pointer;
  width: 100px;
}
.logout-btn:hover {
  background-color: #d93f3f; /* hover 变深红 */
}
.readonly-input {
  background-color: #f5f5f5 !important;
  color: #666 !important;
  cursor: not-allowed;
  opacity: 1;
}
</style>