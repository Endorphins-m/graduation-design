<template>
  <view class="container">
    <!-- 顶部欢迎区 -->
    <view class="header">
      <view class="welcome-text">
        <text class="title">公考智学</text>
        <text class="subtitle">个性化备考，精准提分</text>
      </view>
      <image class="header-bg" src="/static/images/header-bg.png" mode="aspectFill"></image>
    </view>
    
    <!-- 功能入口 -->
    <view class="feature-grid">
      <view class="feature-item" @click="goToAssessment">
        <view class="icon-box" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <u-icon name="file-text-fill" size="48" color="#ffffff"></u-icon>
        </view>
        <text class="feature-title">初始测评</text>
        <text class="feature-desc">构建能力画像</text>
      </view>
      
      <view class="feature-item" @click="goToPlan">
        <view class="icon-box" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <u-icon name="calendar-fill" size="48" color="#ffffff"></u-icon>
        </view>
        <text class="feature-title">学习计划</text>
        <text class="feature-desc">7-14天规划</text>
      </view>
      
      <view class="feature-item" @click="goToPractice">
        <view class="icon-box" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <u-icon name="edit-pen-fill" size="48" color="#ffffff"></u-icon>
        </view>
        <text class="feature-title">智能刷题</text>
        <text class="feature-desc">精准推荐</text>
      </view>
      
      <view class="feature-item" @click="goToProfile">
        <view class="icon-box" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <u-icon name="account-fill" size="48" color="#ffffff"></u-icon>
        </view>
        <text class="feature-title">能力画像</text>
        <text class="feature-desc">可视化分析</text>
      </view>
    </view>
    
    <!-- 快速开始按钮 -->
    <view class="quick-start">
      <button class="btn-primary" @click="startAssessment">
        <u-icon name="play-right-fill" size="32" color="#ffffff" style="margin-right: 10rpx;"></u-icon>
        开始初始测评
      </button>
      <text class="hint">首次使用建议先完成测评，获取个性化方案</text>
    </view>
    
    <!-- 核心优势展示 -->
    <view class="advantages card">
      <view class="section-title">
        <u-icon name="star-fill" size="32" color="#FAAD14"></u-icon>
        <text>核心优势</text>
      </view>
      <view class="adv-list">
        <view class="adv-item">
          <u-icon name="checkmark-circle-fill" size="36" color="#52C41A"></u-icon>
          <text>个性化推荐算法，薄弱题型优先</text>
        </view>
        <view class="adv-item">
          <u-icon name="checkmark-circle-fill" size="36" color="#52C41A"></u-icon>
          <text>艾宾浩斯复习曲线，科学记忆</text>
        </view>
        <view class="adv-item">
          <u-icon name="checkmark-circle-fill" size="36" color="#52C41A"></u-icon>
          <text>动态计划调整，适配学习进度</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {}
  },
  methods: {
    goToAssessment() {
      uni.navigateTo({ url: '/pages/assessment/assessment' })
    },
    goToPlan() {
      uni.switchTab({ url: '/pages/plan/plan' })
    },
    goToPractice() {
      uni.switchTab({ url: '/pages/practice/practice' })
    },
    goToProfile() {
      uni.switchTab({ url: '/pages/profile/profile' })
    },
    startAssessment() {
      uni.navigateTo({ url: '/pages/assessment/assessment?mode=initial' })
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #E8EFFF 0%, #F3F4F6 100%);
}

.header {
  position: relative;
  height: 400rpx;
  padding: 60rpx 40rpx;
  overflow: hidden;
  
  .welcome-text {
    position: relative;
    z-index: 2;
    
    .title {
      display: block;
      font-size: 56rpx;
      font-weight: 800;
      color: #1F2937;
      margin-bottom: 20rpx;
    }
    
    .subtitle {
      display: block;
      font-size: 32rpx;
      color: #6B7280;
    }
  }
  
  .header-bg {
    position: absolute;
    right: -50rpx;
    top: -50rpx;
    width: 400rpx;
    height: 400rpx;
    opacity: 0.3;
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30rpx;
  padding: 0 30rpx;
  margin-top: -100rpx;
  position: relative;
  z-index: 3;
  
  .feature-item {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 40rpx 30rpx;
    text-align: center;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
    
    .icon-box {
      width: 100rpx;
      height: 100rpx;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20rpx;
    }
    
    .feature-title {
      display: block;
      font-size: 32rpx;
      font-weight: 600;
      color: #1F2937;
      margin-bottom: 10rpx;
    }
    
    .feature-desc {
      display: block;
      font-size: 24rpx;
      color: #6B7280;
    }
  }
}

.quick-start {
  margin: 60rpx 40rpx;
  text-align: center;
  
  .btn-primary {
    width: 100%;
    margin-bottom: 20rpx;
  }
  
  .hint {
    display: block;
    font-size: 26rpx;
    color: #6B7280;
  }
}

.advantages {
  margin: 40rpx 30rpx 60rpx;
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 16rpx;
    font-size: 36rpx;
    font-weight: 700;
    color: #1F2937;
    margin-bottom: 30rpx;
  }
  
  .adv-list {
    .adv-item {
      display: flex;
      align-items: center;
      gap: 20rpx;
      padding: 20rpx 0;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      text {
        font-size: 30rpx;
        color: #4B5563;
      }
    }
  }
}
</style>