<template>
  <view class="container">
    <!-- 1. 顶部进度统计 -->
    <view class="stat-card">
      <view class="stat-header">
        <text class="title">今日练习进度</text>
        <view class="more" @click="goToReport">
          <text>学习报告</text>
          <u-icon name="arrow-right" size="24" color="#999"></u-icon>
        </view>
      </view>
      <view class="progress-box">
        <u-line-progress 
          :percentage="dailyProgress" 
          active-color="#2E5BFF" 
          inactive-color="#E8EFFF"
          height="16"
          :show-percent="false"
        ></u-line-progress>
        <view class="count-info">
          <text>今日已做 <text class="highlight">{{ todayDone }}</text> 题</text>
          <text>目标 {{ dailyTarget }} 题</text>
        </view>
      </view>
    </view>

    <!-- 2. 专项练习列表 -->
    <view class="section-title">专项练习</view>
    <view class="module-grid">
      <view 
        v-for="(item, index) in modules" 
        :key="index" 
        class="module-item"
        @click="startPractice(item)"
      >
        <view class="icon-box" :style="{ background: item.color }">
          <u-icon :name="item.icon" size="50" color="#ffffff"></u-icon>
        </view>
        <view class="module-info">
          <text class="name">{{ item.name }}</text>
          <text class="count">已练习 {{ item.done || 0 }} 题</text>
        </view>
        <u-icon name="arrow-right" size="24" color="#ccc"></u-icon>
      </view>
    </view>
    
    <!-- 3. 底部主按钮 -->
    <view class="quick-start">
      <button class="btn-random" @click="startRandom">
        <u-icon name="play-circle-fill" size="36" color="#ffffff"></u-icon>
        <text>开始智能推荐刷题</text>
      </button>
    </view>
    
    <view class="safe-bottom-space"></view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      todayDone: 0,
      dailyTarget: 50,
      isLoggedIn: false, // 统一维护一个登录状态
      modules: [
        { name: '言语理解', value: 'verbal', icon: 'file-text', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', done: 0 },
        { name: '数量关系', value: 'quantitative', icon: 'grid', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', done: 0 },
        { name: '判断推理', value: 'reasoning', icon: 'eye', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', done: 0 },
        { name: '资料分析', value: 'dataAnalysis', icon: 'order', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', done: 0 },
        { name: '常识判断', value: 'commonSense', icon: 'info-circle', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', done: 0 },
        { name: '政治理解', value: 'politics', icon: 'bookmark', color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', done: 0 }
      ]
    }
  },
  computed: {
    dailyProgress() {
      const done = Number(this.todayDone) || 0;
      const target = Number(this.dailyTarget) || 50;
      if (target <= 0) return 0;
      let progress = Math.round((done / target) * 100);
      return progress > 100 ? 100 : progress;
    }
  },
  onShow() {
    console.log('【LIBRARY】页面显示，触发同步校验');
    this.syncData();
  },
  methods: {
    /**
     * 核心：同步登录态与统计数据
     */
    async syncData() {
      // 1. 同步获取最新缓存
      const userId = uni.getStorageSync('userId');
      
      if (!userId) {
        console.warn('【LIBRARY】未检测到有效 userId');
        this.isLoggedIn = false;
        this.resetStats();
        return;
      }

      console.log('【LIBRARY】检测到已登录:', userId);
      this.isLoggedIn = true;
      
      // 2. 加载云端数据
      await this.loadStats(userId);
    },

    async loadStats(userId) {
      try {
        const res = await uniCloud.callFunction({
          name: 'getUserStudyStats',
          data: { userId }
        });

        if (res.result && res.result.code === 0) {
          const stats = res.result.data;
          // 使用显式赋值确保 Vue 响应式追踪
          this.todayDone = Number(stats.todayDone) || 0;
          this.dailyTarget = Number(stats.dailyTarget) || 50;
          
          if (stats.moduleStats) {
            // 对数组内部对象进行响应式更新
            this.modules.forEach((m, index) => {
              const doneCount = stats.moduleStats[m.value] || 0;
              this.$set(this.modules[index], 'done', doneCount);
            });
          }
          console.log('【LIBRARY】数据同步成功:', this.todayDone, '/', this.dailyTarget);
        }
      } catch (e) {
        console.error('【LIBRARY】获取统计失败', e);
      }
    },

    resetStats() {
      this.todayDone = 0;
      this.modules.forEach(m => m.done = 0);
    },

    /**
     * 统一路由拦截
     */
    startPractice(item) {
      if (!this.checkAuth()) return;
      uni.navigateTo({
        url: `/pages/practice/practice?type=${item.value}&name=${item.name}`
      });
    },
    
    startRandom() {
      if (!this.checkAuth()) return;
      uni.navigateTo({
        url: '/pages/practice/practice?mode=random'
      });
    },

    checkAuth() {
      const userId = uni.getStorageSync('userId');
      if (!userId) {
        uni.showModal({
          title: '请先登录',
          content: '登录后即可开始练习并保存进度',
          confirmText: '立即登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/login/login' });
            }
          }
        });
        return false;
      }
      return true;
    },
    
    goToReport() {
      uni.switchTab({ url: '/pages/profile/profile' });
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh; background: #f8f9fb; padding: 30rpx; box-sizing: border-box;
}

.stat-card {
  background: #ffffff; padding: 40rpx 30rpx; border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05); margin-bottom: 40rpx;
  
  .stat-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 30rpx;
    .title { font-size: 32rpx; font-weight: bold; color: #1F2937; }
    .more { display: flex; align-items: center; gap: 4rpx; font-size: 24rpx; color: #999; }
  }
}

.count-info {
  display: flex; justify-content: space-between; margin-top: 16rpx;
  font-size: 24rpx; color: #6B7280;
  .highlight { color: #2E5BFF; font-weight: bold; margin: 0 6rpx; }
}

.section-title {
  font-size: 34rpx; font-weight: bold; margin: 40rpx 0 24rpx; color: #1F2937; padding-left: 10rpx;
}

.module-grid { display: flex; flex-direction: column; gap: 24rpx; }

.module-item {
  background: #ffffff; display: flex; align-items: center; padding: 30rpx;
  border-radius: 20rpx; box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
  &:active { transform: scale(0.98); }
  
  .icon-box {
    width: 96rpx; height: 96rpx; border-radius: 20rpx;
    display: flex; align-items: center; justify-content: center; margin-right: 24rpx;
  }
  
  .module-info {
    flex: 1; display: flex; flex-direction: column;
    .name { font-size: 32rpx; font-weight: 600; color: #1F2937; }
    .count { font-size: 24rpx; color: #9CA3AF; margin-top: 8rpx; }
  }
}

.quick-start {
  margin-top: 60rpx; padding-bottom: 40rpx;
  .btn-random {
    background: #2E5BFF; color: #ffffff; height: 100rpx; border-radius: 50rpx;
    display: flex; align-items: center; justify-content: center; gap: 16rpx;
    font-size: 32rpx; font-weight: bold; box-shadow: 0 8rpx 24rpx rgba(46, 91, 255, 0.3);
    border: none; &::after { border: none; }
  }
}

.safe-bottom-space {
  height: 60rpx; padding-bottom: env(safe-area-inset-bottom);
}
</style>