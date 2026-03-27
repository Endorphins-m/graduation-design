<template>
  <view class="container">
    <!-- 顶部概览卡片 -->
    <view class="overview-card">
      <view class="week-info">
        <text class="week-title">本周目标</text>
        <text class="week-date">{{ weekRange }}</text>
      </view>
      
      <view class="progress-ring">
        <u-circle-progress 
          :percent="weekProgress" 
          width="200" 
          active-color="#2E5BFF"
          bg-color="#E8EFFF"
        >
          <view class="ring-content">
            <text class="ring-num">{{ completedCount }}</text>
            <text class="ring-total">/{{ weeklyTarget }}</text>
            <text class="ring-label">已完成</text>
          </view>
        </u-circle-progress>
      </view>
      
      <view class="stats-row">
        <view class="stat">
          <text class="stat-value">{{ accuracy }}%</text>
          <text class="stat-label">正确率</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat">
          <text class="stat-value">{{ studyDays }}</text>
          <text class="stat-label">学习天数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat">
          <text class="stat-value">{{ avgTime }}min</text>
          <text class="stat-label">日均时长</text>
        </view>
      </view>
    </view>
    
    <!-- 今日任务 -->
    <view class="section-title">
      <u-icon name="calendar-fill" size="36" color="#2E5BFF"></u-icon>
      <text>今日任务 (Day {{ currentDay }})</text>
      <text class="date">{{ today }}</text>
    </view>
    
    <view class="task-list">
      <view 
        v-for="(task, index) in todayTasks" 
        :key="index"
        class="task-card"
        :class="getTaskClass(task.type)"
      >
        <view class="task-header">
          <view class="task-type">
            <view class="type-dot" :class="task.type"></view>
            <text class="type-name">{{ task.name }}</text>
            <text :class="'tag-' + task.type">{{ getTypeLabel(task.type) }}</text>
          </view>
          <text class="task-status" v-if="task.completed === task.total">已完成</text>
          <text class="task-progress" v-else>{{ task.completed }}/{{ task.total }}题</text>
        </view>
        
        <view class="task-meta">
          <view class="meta-item">
            <u-icon name="clock" size="24" color="#6B7280"></u-icon>
            <text>预计用时 {{ task.estimatedTime }}分钟</text>
          </view>
          <view class="meta-item">
            <u-icon name="star-fill" size="24" :color="getPriorityColor(task.priority)"></u-icon>
            <text>优先级: {{ task.priority }}</text>
          </view>
        </view>
        
        <view class="task-progress-bar">
          <view class="progress-fill" :style="{ width: (task.completed/task.total*100) + '%', background: getProgressColor(task.type) }"></view>
        </view>
        
        <button 
          class="btn-start" 
          :class="{ 'btn-completed': task.completed === task.total }"
          @click="startTask(task)"
        >
          {{ task.completed === task.total ? '已完成' : '开始练习' }}
          <u-icon v-if="task.completed !== task.total" name="arrow-right" size="24" color="#ffffff"></u-icon>
        </button>
      </view>
    </view>
    
    <!-- 能力趋势 -->
    <view class="section-title">
      <u-icon name="trending-up-fill" size="36" color="#2E5BFF"></u-icon>
      <text>本周能力趋势</text>
    </view>
    
    <view class="trend-card card">
      <view 
        v-for="(item, index) in abilityTrends" 
        :key="index"
        class="trend-item"
      >
        <text class="trend-name">{{ item.name }}</text>
        <view class="trend-bar">
          <view class="bar-bg">
            <view class="bar-fill" :style="{ width: item.score + '%', background: getScoreColor(item.score) }"></view>
          </view>
          <text class="bar-score">{{ item.score }}分</text>
        </view>
        <view class="trend-arrow">
          <u-icon 
            :name="item.trend === 'up' ? 'arrow-upward' : item.trend === 'down' ? 'arrow-downward' : 'minus'" 
            size="28" 
            :color="item.trend === 'up' ? '#52C41A' : item.trend === 'down' ? '#FF4D4F' : '#6B7280'"
          ></u-icon>
        </view>
      </view>
    </view>
    
    <!-- 底部操作 -->
    <view class="footer-actions">
      <button class="btn-outline" @click="viewFullPlan">
        <u-icon name="file-text" size="28" color="#2E5BFF"></u-icon>
        查看完整计划
      </button>
      <button class="btn-outline" @click="adjustPreference">
        <u-icon name="setting" size="28" color="#2E5BFF"></u-icon>
        调整偏好
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      weekRange: '3.18-3.24',
      weeklyTarget: 50,
      completedCount: 12,
      accuracy: 68,
      studyDays: 3,
      avgTime: 45,
      currentDay: 3,
      today: '3月20日',
      
      // 今日任务 (按60/30/10比例分配)
      todayTasks: [
        {
          name: '数量关系',
          type: 'weak',      // 薄弱题型 60%
          total: 15,
          completed: 8,
          estimatedTime: 25,
          priority: '高',
          ratio: 0.6
        },
        {
          name: '言语理解',
          type: 'base',      // 基础题型 30%
          total: 8,
          completed: 4,
          estimatedTime: 15,
          priority: '中',
          ratio: 0.3
        },
        {
          name: '资料分析',
          type: 'strong',    // 拔高题型 10%
          total: 5,
          completed: 0,
          estimatedTime: 12,
          priority: '低',
          ratio: 0.1
        }
      ],
      
      // 能力趋势数据
      abilityTrends: [
        { name: '数量关系', score: 65, trend: 'up' },
        { name: '言语理解', score: 72, trend: 'stable' },
        { name: '判断推理', score: 58, trend: 'down' },
        { name: '资料分析', score: 52, trend: 'up' },
        { name: '常识判断', score: 60, trend: 'stable' }
      ]
    }
  },
  
  computed: {
    weekProgress() {
      return Math.round((this.completedCount / this.weeklyTarget) * 100)
    }
  },
  
  onShow() {
    this.loadTodayPlan()
  },
  
  methods: {
    loadTodayPlan() {
      // 从服务器或本地加载今日计划
      // 实际应调用uniCloud云函数获取动态生成的计划
    },
    
    getTaskClass(type) {
      return 'task-' + type
    },
    
    getTypeLabel(type) {
      const labels = { weak: '薄弱', base: '基础', strong: '拔高' }
      return labels[type]
    },
    
    getPriorityColor(priority) {
      const colors = { '高': '#FF4D4F', '中': '#FAAD14', '低': '#52C41A' }
      return colors[priority]
    },
    
    getProgressColor(type) {
      const colors = { weak: '#FF4D4F', base: '#FAAD14', strong: '#52C41A' }
      return colors[type]
    },
    
    getScoreColor(score) {
      if (score < 60) return '#FF4D4F'
      if (score < 80) return '#FAAD14'
      return '#52C41A'
    },
    
    startTask(task) {
      if (task.completed === task.total) {
        uni.showToast({ title: '该任务已完成', icon: 'none' })
        return
      }
      
      // 跳转到刷题页，携带任务参数
      uni.navigateTo({
        url: `/pages/practice/practice?type=${task.type}&focus=${task.name}&remaining=${task.total - task.completed}`
      })
    },
    
    viewFullPlan() {
      uni.navigateTo({ url: '/pages/plan/full-plan' })
    },
    
    adjustPreference() {
      uni.navigateTo({ url: '/pages/plan/preference' })
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F3F4F6;
  padding-bottom: 40rpx;
}

.overview-card {
  background: linear-gradient(135deg, #2E5BFF 0%, #1E90FF 100%);
  margin: 20rpx;
  border-radius: 24rpx;
  padding: 40rpx;
  color: #ffffff;
  
  .week-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .week-title {
      font-size: 40rpx;
      font-weight: 700;
    }
    
    .week-date {
      font-size: 28rpx;
      opacity: 0.9;
    }
  }
  
  .progress-ring {
    display: flex;
    justify-content: center;
    margin-bottom: 30rpx;
    
    .ring-content {
      text-align: center;
      
      .ring-num {
        display: block;
        font-size: 48rpx;
        font-weight: 700;
        color: #2E5BFF;
      }
      
      .ring-total {
        font-size: 28rpx;
        color: #6B7280;
      }
      
      .ring-label {
        display: block;
        font-size: 24rpx;
        color: #6B7280;
        margin-top: 8rpx;
      }
    }
  }
  
  .stats-row {
    display: flex;
    justify-content: space-around;
    padding-top: 30rpx;
    border-top: 1rpx solid rgba(255, 255, 255, 0.2);
    
    .stat {
      text-align: center;
      
      .stat-value {
        display: block;
        font-size: 36rpx;
        font-weight: 700;
        margin-bottom: 8rpx;
      }
      
      .stat-label {
        font-size: 24rpx;
        opacity: 0.9;
      }
    }
    
    .stat-divider {
      width: 1rpx;
      height: 60rpx;
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 40rpx 30rpx 20rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #1F2937;
  
  .date {
    margin-left: auto;
    font-size: 26rpx;
    color: #6B7280;
    font-weight: normal;
  }
}

.task-list {
  padding: 0 20rpx;
  
  .task-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
    border-left: 8rpx solid transparent;
    
    &.task-weak {
      border-left-color: #FF4D4F;
    }
    
    &.task-base {
      border-left-color: #FAAD14;
    }
    
    &.task-strong {
      border-left-color: #52C41A;
    }
    
    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .task-type {
        display: flex;
        align-items: center;
        gap: 16rpx;
        
        .type-dot {
          width: 16rpx;
          height: 16rpx;
          border-radius: 50%;
          
          &.weak { background: #FF4D4F; }
          &.base { background: #FAAD14; }
          &.strong { background: #52C41A; }
        }
        
        .type-name {
          font-size: 32rpx;
          font-weight: 700;
          color: #1F2937;
        }
      }
      
      .task-status {
        font-size: 26rpx;
        color: #52C41A;
        font-weight: 600;
      }
      
      .task-progress {
        font-size: 28rpx;
        color: #6B7280;
      }
    }
    
    .task-meta {
      display: flex;
      gap: 40rpx;
      margin-bottom: 20rpx;
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 26rpx;
        color: #6B7280;
      }
    }
    
    .task-progress-bar {
      height: 8rpx;
      background: #F3F4F6;
      border-radius: 4rpx;
      margin-bottom: 24rpx;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        border-radius: 4rpx;
        transition: width 0.3s;
      }
    }
    
    .btn-start {
      width: 100%;
      height: 76rpx;
      line-height: 76rpx;
      background: linear-gradient(135deg, #2E5BFF 0%, #1E90FF 100%);
      color: #ffffff;
      border-radius: 38rpx;
      font-size: 30rpx;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12rpx;
      
      &.btn-completed {
        background: #E5E7EB;
        color: #9CA3AF;
      }
    }
  }
}

.trend-card {
  .trend-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #F3F4F6;
    
    &:last-child {
      border-bottom: none;
    }
    
    .trend-name {
      width: 140rpx;
      font-size: 28rpx;
      color: #4B5563;
      flex-shrink: 0;
    }
    
    .trend-bar {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 16rpx;
      
      .bar-bg {
        flex: 1;
        height: 12rpx;
        background: #F3F4F6;
        border-radius: 6rpx;
        overflow: hidden;
        
        .bar-fill {
          height: 100%;
          border-radius: 6rpx;
          transition: width 0.3s;
        }
      }
      
      .bar-score {
        width: 80rpx;
        font-size: 28rpx;
        font-weight: 600;
        color: #1F2937;
        text-align: right;
      }
    }
    
    .trend-arrow {
      width: 60rpx;
      text-align: center;
    }
  }
}

.footer-actions {
  display: flex;
  gap: 20rpx;
  margin: 40rpx 30rpx;
  
  .btn-outline {
    flex: 1;
    height: 80rpx;
    line-height: 80rpx;
    background: #ffffff;
    border: 2rpx solid #2E5BFF;
    color: #2E5BFF;
    border-radius: 40rpx;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
  }
}
</style>