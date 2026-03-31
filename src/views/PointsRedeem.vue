<template>
  <div class="points-redeem">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
     <span>积分商城（可用积分：{{ availablePoints }}）</span>
        </div>
      </template>

      <!-- 加载中 -->
      <div v-if="loading" style="text-align: center; padding: 40px;">
        <i class="el-icon-loading" style="font-size: 24px;"></i>
        <p>加载中...</p>
      </div>

      <!-- 无数据 -->
      <div v-else-if="items.length === 0" style="text-align: center; padding: 40px; color: #999;">
        暂无可兑换奖品
      </div>

      <!-- 奖品列表 -->
      <el-row :gutter="20">
        <el-col
          v-for="item in items"
          :key="item.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <div class="reward-item">
            <img
              :src="getImageUrl(item.imageUrl)"
              alt="奖品图片"
              class="reward-img"
            />
            <div class="reward-info">
              <h4 class="reward-name">{{ item.name }}</h4>
              <p class="reward-points">
                <i class="el-icon-star-on" style="color: #e6a23c;"></i>
                {{ item.pointsRequired }} 积分
              </p>
              <p class="reward-stock">
                库存：{{ item.stock === -1 ? '无限' : item.stock }}
              </p>
                    <p v-if="item.description" class="reward-description">
                      {{ item.description }}
                  </p>
              <!-- 数量选择 -->
              <div class="quantity-selector">
                <el-button
                  size="mini"
                  @click="decrease(item)"
                  :disabled="item.quantity <= 1"
                >-</el-button>
                <span class="quantity">{{ item.quantity }}</span>
                <el-button
                  size="mini"
                  @click="increase(item)"
                  :disabled="isStockLimited(item) && item.quantity >= item.stock"
                >+</el-button>
              </div>

              <!-- 兑换按钮 -->
              <el-button
                type="primary"
                size="small"
                class="exchange-btn"
                @click="handleExchange(item)"
                :disabled="isStockLimited(item) && item.quantity > item.stock"
              >
                立即兑换
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
import { listAvailableItems, exchangeReward } from '@/api/redeem'
import { getFullImageUrl } from '@/utils/image'
import { getPointsOverview } from '@/api/points'
export default {
  name: 'PointsRedeem',
  data() {
    return {
      loading: true,
      items: [],
      totalPoints: 0,
      availablePoints: 0
    }
  },
async created() {
    //奖品 + 总积分
    try {
      const [itemsRes, pointsRes] = await Promise.all([
        listAvailableItems(),
        getPointsOverview()
      ])

      // 处理奖品
      if (itemsRes.code === 200) {
        this.items = itemsRes.data || []
        this.items.forEach(item => this.$set(item, 'quantity', 1))
      } else {
        this.$message.error(itemsRes.msg || '加载奖品失败')
        this.items = []
      }

      // 处理总积分
 // 处理积分数据
if (pointsRes && pointsRes.data) {
  const { total = 0, available = 0 } = pointsRes.data;
  this.totalPoints = total;
  this.availablePoints = available;
} else {
  console.warn('未获取到积分数据')
  this.totalPoints = 0;
  this.availablePoints = 0;
}
    } catch (err) {
      console.error('加载失败:', err)
      this.$message.error('加载数据失败')
      this.items = []
      this.totalPoints = 0
    } finally {
      this.loading = false
    }
  },
  methods: {
    loadItems() {
      this.loading = true
      listAvailableItems()
        .then(response => {
          if (response.code === 200) {
            this.items = response.data || []
            // 初始化 quantity
            this.items.forEach(item => {
              this.$set(item, 'quantity', 1)
            })
          } else {
            this.$message.error(response.msg || '加载失败')
            this.items = []
          }
        })
        .catch(err => {
          console.error('加载奖品失败:', err)
          this.$message.error('加载奖品失败，请重试')
          this.items = []
        })
        .finally(() => {
          this.loading = false
        })
    },

    getImageUrl(url) {
      if (!url) {
        // 使用默认图
      return getFullImageUrl(url) || 'https://via.placeholder.com/150x150/e0e0e0/999999?text=No+Image'
      }
      //如果是完整 URL，直接返回
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      // 如果是 /profile 开头，拼接 base API
      if (url.startsWith('/profile')) {
        return process.env.VUE_APP_BASE_API + url
      }
      // 其他情况，也走 base API
      return process.env.VUE_APP_BASE_API + '/' + url.replace(/^\//, '')
    },

    increase(item) {
      if (this.isStockLimited(item) && item.quantity >= item.stock) return
      item.quantity++
    },

    decrease(item) {
      if (item.quantity > 1) {
        item.quantity--
      }
    },

    isStockLimited(item) {
      return item.stock !== -1 && item.stock != null
    },
  async handleExchange(item) {
  try {
    // 弹窗确认
    await this.$confirm(
      `确定要兑换 ${item.quantity} 个【${item.name}】吗？`,
      '确认兑换',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    //调用兑换接口
    const params = {
      itemId: item.id,
      quantity: item.quantity
    };

    const response = await exchangeReward(params);
    this.$message.success('兑换成功！');
    await this.loadItems();
    await this.refreshPoints();

  } catch (error) {

    // 用户主动取消
    if (error === 'cancel') {
      return;
    }

    // 是 axios 请求错误
    if (error.response) {
      const { data } = error.response;
      const message = data?.msg || data?.message || '请求失败';
      this.$message.error(message); //显示 "积分不足，无法兑换"
    } else if (error.request) {
      // 网络问题（无响应）
      this.$message.error('网络错误，请检查连接');
    } else {
      // 其他 JS 错误
      this.$message.error(error.message || '未知错误');
    }
  }
},
    //后续要刷新积分
    async refreshPoints() {
      try {
        const res = await getPointsOverview()
        if (res.data) {
          this.totalPoints = res.data.total
        }
      } catch (err) {
        console.error('刷新积分失败:', err)
      }
    }
  }
}
</script>

<style scoped>
.points-redeem {
  padding: 20px;
}

.reward-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  background-color: #fff;
  transition: box-shadow 0.3s;
}

.reward-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.reward-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.reward-info {
  padding: 12px;
  text-align: center;
}

.reward-name {
  font-size: 14px;
  margin: 8px 0;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reward-points {
  color: #e6a23c;
  font-weight: bold;
  margin: 6px 0;
}

.reward-stock {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.quantity-selector {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
}

.quantity {
  min-width: 24px;
  text-align: center;
  font-weight: bold;
}

.exchange-btn {
  width: 100%;
  margin-top: 8px;
}
.reward-description {
  font-size: 12px;
  color: #777;
  margin: 6px 0;
  line-height: 1.4;
  /* 最多显示2行，超出省略 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>