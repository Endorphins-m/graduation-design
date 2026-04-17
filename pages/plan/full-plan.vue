<template>
  <view class="container">
    <view class="header">
      <text class="title">本周冲刺计划</text>
      <text class="subtitle">根据你的弱项与进阶需求智能生成</text>
    </view>

    <!-- 计划列表 -->
    <view class="plan-list">
      <view v-for="(day, index) in weeklyPlan" :key="index" class="day-card" :class="{ 'is-today': day.isToday }">
        <view class="day-header">
          <view class="day-info">
            <text class="day-name">{{ day.dayName }}</text>
            <text class="day-date">{{ day.date }}</text>
            <view v-if="day.isToday" class="today-tag">今日</view>
          </view>
          <view class="day-status">
            <u-icon :name="day.completed ? 'checkmark-circle-fill' : 'clock'" :color="day.completed ? '#52C41A' : '#9CA3AF'" size="32"></u-icon>
            <text class="status-text" :class="{ 'completed': day.completed }">{{ day.completed ? '已达成' : '待完成' }}</text>
          </view>
        </view>

        <view class="task-grid">
          <view v-for="(task, tIndex) in day.tasks" :key="tIndex" class="task-item">
            <view class="task-dot" :class="task.type"></view>
            <text class="task-name">{{ task.name }}</text>
            <text class="task-count">{{ task.count }}题</text>
          </view>
        </view>

        <view class="day-footer">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: day.progress + '%' }"></view>
          </view>
          <text class="progress-num">{{ day.progress }}%</text>
        </view>
      </view>
    </view>

    <!-- 底部说明 -->
    <view class="plan-tips">
      <u-icon name="info-circle" size="28" color="#9CA3AF"></u-icon>
      <text>计划将根据每日练习结果进行动态优化</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      weeklyPlan: []
    }
  },
  onLoad() {
    this.generateWeeklyPlan();
  },
  methods: {
    generateWeeklyPlan() {
      // 模拟本周计划数据，实际应从服务器获取
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      const today = new Date().getDay(); // 0-6, 0是周日
      const adjustedToday = today === 0 ? 6 : today - 1; // 转换为 0-6, 0是周一
      
      const modules = [
        { name: '数量关系', type: 'weak' },
        { name: '言语理解', type: 'base' },
        { name: '判断推理', type: 'base' },
        { name: '资料分析', type: 'strong' },
        { name: '常识判断', type: 'base' }
      ];

      this.weeklyPlan = days.map((day, index) => {
        // 根据周几分配不同的侧重任务
        let tasks = [];
        if (index % 2 === 0) {
          tasks = [
            { name: modules[0].name, type: modules[0].type, count: 15 },
            { name: modules[1].name, type: modules[1].type, count: 10 },
            { name: modules[3].name, type: modules[3].type, count: 5 }
          ];
        } else {
          tasks = [
            { name: modules[2].name, type: modules[2].type, count: 15 },
            { name: modules[4].name, type: modules[4].type, count: 10 },
            { name: modules[3].name, type: modules[3].type, count: 5 }
          ];
        }

        return {
          dayName: day,
          date: `3月${18 + index}日`,
          isToday: index === adjustedToday,
          completed: index < adjustedToday,
          progress: index < adjustedToday ? 100 : (index === adjustedToday ? 24 : 0),
          tasks: tasks
        };
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #F8FAFC;
  padding: 30rpx;
}

.header {
  margin-bottom: 40rpx;
  .title {
    font-size: 44rpx;
    font-weight: 800;
    color: #1E293B;
  }
  .subtitle {
    font-size: 26rpx;
    color: #64748B;
    margin-top: 10rpx;
    display: block;
  }
}

.plan-list {
  .day-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
    
    &.is-today {
      border: 2rpx solid #2E5BFF;
      background: #F0F4FF;
    }
  }
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  
  .day-info {
    display: flex;
    align-items: center;
    gap: 12rpx;
    
    .day-name {
      font-size: 34rpx;
      font-weight: 700;
      color: #1E293B;
    }
    .day-date {
      font-size: 24rpx;
      color: #94A3B8;
    }
    .today-tag {
      background: #2E5BFF;
      color: #ffffff;
      font-size: 20rpx;
      padding: 2rpx 10rpx;
      border-radius: 6rpx;
    }
  }
  
  .day-status {
    display: flex;
    align-items: center;
    gap: 8rpx;
    
    .status-text {
      font-size: 24rpx;
      color: #94A3B8;
      &.completed {
        color: #52C41A;
      }
    }
  }
}

.task-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 24rpx;
  
  .task-item {
    background: #F1F5F9;
    padding: 12rpx 20rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    gap: 12rpx;
    
    .task-dot {
      width: 12rpx;
      height: 12rpx;
      border-radius: 50%;
      &.weak { background: #FF4D4F; }
      &.base { background: #FAAD14; }
      &.strong { background: #52C41A; }
    }
    
    .task-name {
      font-size: 26rpx;
      color: #475569;
    }
    .task-count {
      font-size: 24rpx;
      color: #94A3B8;
    }
  }
}

.day-footer {
  display: flex;
  align-items: center;
  gap: 20rpx;
  
  .progress-bar {
    flex: 1;
    height: 10rpx;
    background: #E2E8F0;
    border-radius: 10rpx;
    overflow: hidden;
    
    .progress-fill {
      height: 100%;
      background: #2E5BFF;
      border-radius: 10rpx;
    }
  }
  
  .progress-num {
    font-size: 24rpx;
    color: #64748B;
    font-weight: 600;
  }
}

.plan-tips {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10rpx;
  margin-top: 40rpx;
  padding-bottom: 60rpx;
  font-size: 24rpx;
  color: #94A3B8;
}
</style>
