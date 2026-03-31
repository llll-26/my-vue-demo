<!-- src/views/WriteReview.vue -->
<template>
  <div class="write-review">
    <el-card style="max-width: 600px; margin: 20px auto;">
      <h3>评价服务：{{ skillTitle }}</h3>

      <el-form :model="form" label-width="80px" style="margin-top: 20px;">
        <el-form-item label="评分">
          <el-rate
            v-model="form.rating"
            :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            show-score
            :score-template="ratingText"
          />
        </el-form-item>

        <el-form-item label="评论">
          <el-input
            v-model="form.comment"
            type="textarea"
            :rows="4"
            placeholder="分享你的体验..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" @click="submitReview" :loading="loading">
            提交评价
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { addReview } from '@/api/review'
export default {
  name: 'WriteReview',
  data() {
    return {
      loading: false,
      form: {
        orderId: null,
        rating: 5,
        comment: ''
      },
      skillTitle: '该服务',
      ratingText: ''
    }
  },
  computed: {
  ratingText() {
    const texts = ['很差', '较差', '一般', '良好', '优秀']
    return texts[this.form.rating - 1] || '未知'
  }
},
  created() {
    console.log('【WriteReview】接收到的 query:', this.$route.query)
    const { orderId, skillTitle } = this.$route.query
    if (!orderId || isNaN(Number(orderId)) || Number(orderId) <= 0) {
      this.$message.warning('缺少有效的订单信息')
      this.$router.go(-1)
      return
    }
    this.form.orderId = Number(orderId)
    this.skillTitle = (skillTitle || '该服务').trim()
  },
  methods: {
async submitReview() {
  if (!this.form.orderId) return
  if (!this.form.rating) {
    this.$message.warning('请选择评分')
    return
  }

  this.loading = true
  try {
    const res = await addReview({
      orderId: this.form.orderId,
      rating: this.form.rating,
      comment: this.form.comment
    })

    if (res.code === 200) {
      this.$message.success('评价成功！')

      //返回上一页（即 CompletedOrder 列表页）
      this.$router.go(-1)

    } else {
      this.$message.error(res.msg || '提交失败')
    }
  } catch (err) {
    console.error(err)
    this.$message.error(err?.response?.data?.msg || '网络错误')
  } finally {
    this.loading = false
  }
}
  }
}
</script>