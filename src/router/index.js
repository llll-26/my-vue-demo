import Vue from 'vue'
import VueRouter from 'vue-router' 
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
//publish相关页面
import PublishSkill from '@/views/PublishSkill.vue'
import PublishedSkills from '@/views/PublishedSkills.vue'
import SkillDetail from '@/views/SkillDetail.vue'
import OrderDetail from '@/views/OrderDetail.vue'
// Profile相关页面
import Profile from '@/views/Profile.vue'
import ResetPassword from '@/views/ResetPassword.vue'
import Appointments from '@/views/Appointments.vue'
import CompletedOrder from '@/views/CompletedOrder.vue'
import Enrollments from '@/views/Enrollments.vue'
import Messages from '@/views/Messages.vue'
import Feedback from '@/views/Feedback.vue'
import WriteReview from '@/views/WriteReview.vue'
// Points相关页面
import PointsManagement from '@/views/PointsManagement.vue'
import PointsGrowth from '@/views/PointsGrowth.vue'
import PointsSummary from '@/views/PointsSummary.vue'
import PointsRedeem from '@/views/PointsRedeem.vue'
import RankPage from '@/views/RankPage.vue'
// Chat相关页面
import ChatList from '@/views/ChatList.vue'
import Chat from '@/views/Chat.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: Home },

  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  
  {
  path: '/activity/:id',
  name: 'ActivityDetail',
  component: () => import('@/views/activityDetail.vue')
  },
  // Publish 相关
  { 
    path: '/publishSkill', 
    name: 'PublishSkill',
    component: PublishSkill, 
    meta: { requiresAuth: true } 
  },
  { 
    path: '/publishedSkills', 
    name: 'PublishedSkills',
    component: PublishedSkills, 
    meta: { requiresAuth: true } 
  },
// 1. 注册真正的「技能详情」页面（公开）
{
  path: '/skill/:id',
  name: 'SkillDetail',
  component: () => import('@/views/SkillDetail.vue'),
  props: true
},

// 2. 注册「订单详情」页面（需登录）
{
  path: '/order/:id',
  name: 'OrderDetail',
  component: () => import('@/views/OrderDetail.vue'),
  meta: { requiresAuth: true }
},

  // Profile 主页
  { 
    path: '/profile', 
    name: 'Profile',
    component: Profile, 
    meta: { requiresAuth: true } 
  },

  // Profile 子页面（注意：component 名称必须和 import 一致！）
  { path: '/profile/resetpassword', name: 'ResetPassword', component: ResetPassword, meta: { requiresAuth: true } },
  { path: '/profile/appointments', name: 'Appointments', component: Appointments, meta: { requiresAuth: true } },
  { path: '/profile/completedorder', name: 'CompletedOrder', component: CompletedOrder, meta: { requiresAuth: true } },
  { path: '/profile/enrollments', name: 'Enrollments', component: Enrollments, meta: { requiresAuth: true } },
  { path: '/profile/messages', name: 'Messages', component: Messages, meta: { requiresAuth: true } },
  { path: '/profile/feedback', name: 'Feedback', component: Feedback, meta: { requiresAuth: true } },
  {
  path: '/profile/write-review',
  name: 'WriteReview',
  component: WriteReview,
  meta: { requiresAuth: true }
},

  // Points 主页
  { 
    path: '/pointsManagement', 
    name: 'PointsManagement',
    component: PointsManagement, 
    meta: { requiresAuth: true } 
  },

  // Points 子页面
  { path: '/points/growth', name: 'PointsGrowth', component: PointsGrowth, meta: { requiresAuth: true } },
  { path: '/points/summary', name: 'PointsSummary', component: PointsSummary, meta: { requiresAuth: true } },
  { path: '/points/redeem', name: 'PointsRedeem', component: PointsRedeem, meta: { requiresAuth: true } },
{ 
  path: '/rank', 
  name: 'Rank', 
  component: RankPage, 
  meta: { 
    title: '互助排行榜',
    requiresAuth: true 
  } 
},

  // Chat 相关
  { 
    path: '/chatList', 
    name: 'ChatList',
    component: ChatList, 
    meta: { requiresAuth: true } 
  },
  { 
    path: '/chat', 
    name: 'Chat',
    component: Chat, 
    meta: { requiresAuth: true } 
  }
]
const router = new VueRouter({
  mode: 'hash', 
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (requiresAuth && !token) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
  
  next()
})

export default router