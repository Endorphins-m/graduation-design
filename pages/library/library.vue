<template>
  <view class="container">
    <!-- 顶部进度统计 -->
    <view class="stat-card">
      <view class="stat-header">
        <text class="title">练习进度</text>
        <text class="more">查看报告 ></text>
      </view>
      <view class="progress-box">
        <u-line-progress :percent="65" active-color="#2E5BFF" height="14"></u-line-progress>
        <view class="count-info">
          <text>今日已做 <text class="highlight">24</text> 题</text>
          <text>目标 50 题</text>
        </view>
      </view>
    </view>

    <!-- 模块选择网格 -->
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
          <text class="count">已练 {{ item.done }} / {{ item.total }}</text>
        </view>
        <u-icon name="arrow-right" size="24" color="#ccc"></u-icon>
      </view>
    </view>
    
    <!-- 底部快速开始 -->
    <view class="quick-start">
      <button class="btn-random" @click="startRandom">
        <u-icon name="play-circle-fill" size="32" color="#ffffff"></u-icon>
        <text>智能随机刷题</text>
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      modules: [
        { name: '言语理解', value: 'verbal', icon: 'file-text', color: '#f093fb', done: 120, total: 500 },
        { name: '数量关系', value: 'quantitative', icon: 'grid', color: '#4facfe', done: 45, total: 300 },
        { name: '判断推理', value: 'reasoning', icon: 'eye', color: '#43e97b', done: 88, total: 450 },
        { name: '资料分析', value: 'dataAnalysis', icon: 'order', color: '#fa709a', done: 30, total: 200 },
        { name: '常识判断', value: 'commonSense', icon: 'info-circle', color: '#f6d365', done: 200, total: 600 },
        { name: '政治理解', value: 'politics', icon: 'bookmark', color: '#ff9a9e', done: 15, total: 100 }
      ]
    }
  },
  methods: {
    startPractice(item) {
      uni.navigateTo({
        url: `/pages/practice/practice?type=${item.value}&name=${item.name}`
      })
    },
    startRandom() {
      uni.navigateTo({ url: '/pages/practice/practice?mode=random' })
    }
  }
}
</script>

<style lang="scss" scoped>
.container { min-height: 100vh; background: #f8f9fb; padding: 30rpx; }
.stat-card { background: #fff; padding: 40rpx 30rpx; border-radius: 24rpx; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05); margin-bottom: 40rpx; }
.stat-header { display: flex; justify-content: space-between; margin-bottom: 30rpx; .title { font-weight: bold; font-size: 32rpx; } .more { color: #999; font-size: 24rpx; } }
.count-info { display: flex; justify-content: space-between; margin-top: 16rpx; font-size: 24rpx; color: #666; .highlight { color: #2E5BFF; font-weight: bold; margin: 0 4rpx; } }

.section-title { font-size: 34rpx; font-weight: bold; margin: 40rpx 0 20rpx; color: #333; }
.module-grid { display: flex; flex-direction: column; gap: 24rpx; }
.module-item { 
  background: #fff; display: flex; align-items: center; padding: 30rpx; border-radius: 20rpx;
  .icon-box { width: 90rpx; height: 90rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; margin-right: 24rpx; }
  .module-info { flex: 1; display: flex; flex-direction: column; .name { font-size: 30rpx; font-weight: 500; color: #333; } .count { font-size: 22rpx; color: #999; margin-top: 8rpx; } }
}
.quick-start { margin-top: 60rpx; .btn-random { background: #2E5BFF; color: #fff; height: 90rpx; border-radius: 45rpx; display: flex; align-items: center; justify-content: center; gap: 12rpx; font-weight: bold; } }
</style>