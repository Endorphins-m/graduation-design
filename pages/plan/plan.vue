<template>
  <view class="container">
    <!-- 顶部概览卡片 -->
    <view class="overview-card">
      <view class="week-info">
        <text class="week-title">本周数据</text>
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

    <!-- 考试倒计时 -->
    <view class="countdown-card" style="position: relative;">
      <!-- 1. 修改名称区域：放置在最顶层 -->
      <view class="countdown-title">
        <text class="title-text">{{ examName || '距离 省考/国考 考试' }}</text>
        <view class="edit-icon-wrapper" @click.stop="editExamName">
          <u-icon name="edit-pen" size="40" color="#9CA3AF"></u-icon>
        </view>
      </view>

      <!-- 2. 日期选择区域：仅覆盖中间和底部内容 -->
      <view class="countdown-clickable-area">
        <view class="countdown-main" style="pointer-events: none;">
          <view class="countdown-item">
            <text class="num">{{ countdown.days }}</text>
            <text class="label">天</text>
          </view>
          <view class="countdown-item">
            <text class="num">{{ countdown.hours }}</text>
            <text class="label">时</text>
          </view>
          <view class="countdown-item">
            <text class="num">{{ countdown.minutes }}</text>
            <text class="label">分</text>
          </view>
          <view class="countdown-item">
            <text class="num">{{ countdown.seconds }}</text>
            <text class="label">秒</text>
          </view>
        </view>
        <view class="countdown-footer" style="pointer-events: none;">
          <text class="target-date">目标日期: {{ targetDateStr }}</text>
          <text class="quote">“功不唐捐，玉汝于成”</text>
        </view>

        <!-- 原生选择器只覆盖这个区域，避开顶部的修改名称图标 -->
        <picker 
          mode="date" 
          :value="targetDateStr.split(' ')[0]" 
          @change="onNativeDateChange"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; z-index: 5;"
        >
          <view style="width: 100%; height: 100%;"></view>
        </picker>
      </view>
    </view>

    <!-- 替换为 uView 兼容性更好的 u-calendar -->
    <u-calendar 
      v-model="showDatePicker" 
      mode="date" 
      @change="onCalendarConfirm"
      max-date="2026-12-31"
      active-bg-color="#2E5BFF"
      btn-type="primary"
    ></u-calendar>

    <!-- 兜底的原生选择器，如果日历依然打不开可以尝试点击这里的文字 -->
    <picker mode="date" @change="onNativeDateConfirm" style="display: none;">
      <view id="nativeDatePickerTrigger"></view>
    </picker>

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
      <view class="title-left">
        <u-icon name="level-up" size="36" color="#2E5BFF"></u-icon>
        <text>本周能力趋势</text>
      </view>
      <u-icon name="question-circle" size="30" color="#9CA3AF" @click="showTrendRules"></u-icon>
    </view>
    
    <view class="trend-card card">
      <view 
        v-for="(item, index) in abilityTrends" 
        :key="index"
        class="trend-item"
      >
        <view class="trend-name">
          <text>{{ item.name }}</text>
        </view>
        <view class="trend-bar-wrapper">
          <view class="bar-bg">
            <view class="bar-fill" :style="{ width: item.score + '%', background: getScoreColor(item.score) }"></view>
          </view>
          <text class="bar-score">{{ item.score }}<text class="unit">分</text></text>
        </view>
        <view class="trend-status">
          <view class="status-tag" :class="item.trend">
            <text class="status-text">{{ getTrendText(item.trend) }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部操作 -->
    <view class="footer-actions">
      <view class="btn-outline" @tap="viewFullPlan" style="flex: 1; height: 80rpx; line-height: 80rpx; background: #ffffff; border: 2rpx solid #2E5BFF; color: #2E5BFF; border-radius: 40rpx; font-size: 28rpx; display: flex; align-items: center; justify-content: center; gap: 12rpx;">
        <u-icon name="file-text" size="28" color="#2E5BFF"></u-icon>
        <text>查看完整计划</text>
      </view>
      <view class="btn-outline" @tap="adjustPreference" style="flex: 1; height: 80rpx; line-height: 80rpx; background: #ffffff; border: 2rpx solid #2E5BFF; color: #2E5BFF; border-radius: 40rpx; font-size: 28rpx; display: flex; align-items: center; justify-content: center; gap: 12rpx;">
        <u-icon name="setting" size="28" color="#2E5BFF"></u-icon>
        <text>调整偏好</text>
      </view>
    </view>

    <!-- 完整计划弹窗 -->
    <view v-if="showFullPlanPopup" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; flex-direction: column; justify-content: flex-end;">
      <view class="full-plan-popup" style="height: 85vh; background: #F8FAFC; border-radius: 40rpx 40rpx 0 0; display: flex; flex-direction: column; overflow: hidden;">
        <view class="popup-header" style="padding: 30rpx 40rpx; display: flex; justify-content: space-between; align-items: center; background: #ffffff; border-bottom: 1rpx solid #E2E8F0;">
          <text class="popup-title" style="font-size: 34rpx; font-weight: 800; color: #1E293B;">本周智能计划</text>
          <view @tap="showFullPlanPopup = false" style="padding: 20rpx;">
            <u-icon name="close" size="36" color="#9CA3AF"></u-icon>
          </view>
        </view>
        
        <view style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
          <scroll-view scroll-y="true" style="height: calc(85vh - 280rpx); padding: 30rpx; box-sizing: border-box; flex: 1;">
            <view class="plan-summary-card">
              <view class="summary-item">
                <text class="val">1,250</text>
                <text class="lab">预计题量</text>
              </view>
            <view class="summary-divider"></view>
            <view class="summary-item">
              <text class="val">12.5h</text>
              <text class="lab">建议工时</text>
            </view>
            <view class="summary-divider"></view>
            <view class="summary-item">
              <text class="val">85%</text>
              <text class="lab">目标正确率</text>
            </view>
          </view>

          <view class="weekly-timeline">
            <view v-for="(day, index) in mockWeeklyPlan" :key="index" class="timeline-item" :class="{ 'is-active': index === currentDay - 1 }">
              <view class="time-node">
                <text class="node-day">{{ day.day }}</text>
                <view class="node-dot"></view>
                <view class="node-line" v-if="index < mockWeeklyPlan.length - 1"></view>
              </view>
              <view class="node-content">
                <view class="node-header">
                  <text class="node-title">{{ day.title }}</text>
                  <view class="node-meta">
                    <text class="meta-tag">📝 {{ day.totalQuestions }}题</text>
                    <text class="meta-tag">⏳ {{ day.time }}min</text>
                  </view>
                </view>
                <view class="node-focus">
                  <view v-for="(tag, tIdx) in day.focus" :key="tIdx" class="focus-tag" :class="tag.type">
                    {{ tag.label }}
                  </view>
                </view>
                <text class="node-desc">{{ day.desc }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
        
        <view class="popup-footer" style="padding: 30rpx 40rpx; padding-bottom: calc(30rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); background: #ffffff; border-top: 1rpx solid #E2E8F0; z-index: 10001;">
          <button class="btn-confirm" @tap="showFullPlanPopup = false" style="width: 100%; height: 90rpx; line-height: 90rpx; background: #2E5BFF; color: #ffffff; border-radius: 45rpx; font-weight: 700; font-size: 32rpx; display: flex; align-items: center; justify-content: center; border: none;">了解计划，开始备考</button>
        </view>
      </view>
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
      
      // 倒计时相关
      examName: uni.getStorageSync('examName') || '2024年下半年省考',
      targetDateStr: uni.getStorageSync('examDate') || '2024-12-15 09:00:00',
      showDatePicker: false,
      countdown: { days: '00', hours: '00', minutes: '00', seconds: '00' },
      timer: null,

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
      ],
      
      // 完整计划弹窗状态
      showFullPlanPopup: false,
      mockWeeklyPlan: [
        { day: 'Mon', title: '周一 · 基础稳固', time: 60, totalQuestions: 40, focus: [{label: '言语基础', type: 'base'}, {label: '数量初解', type: 'weak'}], desc: '侧重言语理解的规律总结' },
        { day: 'Tue', title: '周二 · 弱项突破', time: 90, totalQuestions: 60, focus: [{label: '数量关系', type: 'weak'}, {label: '判断推理', type: 'base'}], desc: '深挖数量关系错题集' },
        { day: 'Wed', title: '周三 · 模拟实战', time: 120, totalQuestions: 100, focus: [{label: '全模块', type: 'all'}], desc: '进行一次计时套题演练' },
        { day: 'Thu', title: '周四 · 资料专项', time: 75, totalQuestions: 50, focus: [{label: '资料分析', type: 'strong'}], desc: '拔高资料分析计算速度' },
        { day: 'Fri', title: '周五 · 常识归纳', time: 50, totalQuestions: 30, focus: [{label: '常识判断', type: 'base'}], desc: '梳理本周时政热点' },
        { day: 'Sat', title: '周六 · 查漏补缺', time: 80, totalQuestions: 45, focus: [{label: '错题整理', type: 'weak'}], desc: '复盘本周所有错误考点' },
        { day: 'Sun', title: '周日 · 总结预选', time: 40, totalQuestions: 20, focus: [{label: '能力评估', type: 'all'}], desc: '更新下周个性化学习权重' }
      ]
    }
  },
  
  computed: {
    weekProgress() {
      return Math.round((this.completedCount / this.weeklyTarget) * 100)
    }
  },
  
  onShow() {
    this.refreshData()
    this.startTimer()
  },
  
  onHide() {
    this.stopTimer()
  },
  
  onUnload() {
    this.stopTimer()
  },
  
  methods: {
    startTimer() {
      this.updateCountdown()
      this.timer = setInterval(() => {
        this.updateCountdown()
      }, 1000)
    },
    
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    
    onNativeDateChange(e) {
      console.log('原生日期变更:', e.detail.value);
      const dateStr = e.detail.value;
      const fullDate = `${dateStr} 09:00:00`;
      this.targetDateStr = fullDate;
      uni.setStorageSync('examDate', fullDate);
      this.updateCountdown();
      uni.showToast({ title: '考试日期已设置', icon: 'success' });
    },
    
    editExamName() {
      console.log('触发重命名');
      uni.showModal({
        title: '修改目标考试',
        placeholderText: '例如：2024省考',
        editable: true,
        content: this.examName,
        success: (res) => {
          if (res.confirm) {
            this.examName = res.content;
            uni.setStorageSync('examName', res.content);
            uni.showToast({ title: '名称已保存', icon: 'success' });
          }
        }
      });
    },
    
    onCalendarConfirm(e) {
      console.log('日历确认事件:', e);
      // u-calendar 返回的对象中日期字段通常是 result
      const dateStr = e.result; // 格式通常为 2024-12-15
      const fullDate = `${dateStr} 09:00:00`;
      
      this.targetDateStr = fullDate;
      uni.setStorageSync('examDate', fullDate);
      this.updateCountdown();
    },

    onNativeDateConfirm(e) {
      const dateStr = e.detail.value; // yyyy-mm-dd
      const fullDate = `${dateStr} 09:00:00`;
      this.targetDateStr = fullDate;
      uni.setStorageSync('examDate', fullDate);
      this.updateCountdown();
      uni.showToast({ title: '日期已同步', icon: 'success' });
    },

    onNativeDateChange(e) {
      console.log('原生日期变更:', e.detail.value);
      const dateStr = e.detail.value; // yyyy-mm-dd
      const fullDate = `${dateStr} 09:00:00`;
      this.targetDateStr = fullDate;
      uni.setStorageSync('examDate', fullDate);
      this.updateCountdown();
      uni.showToast({ title: '日期已同步', icon: 'success' });
    },

    updateCountdown() {
      const now = new Date().getTime()
      const target = new Date(this.targetDateStr.replace(/-/g, '/')).getTime()
      const diff = target - now
      
      if (diff <= 0) {
        this.countdown = { days: '00', hours: '00', minutes: '00', seconds: '00' }
        return
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      this.countdown = {
        days: days < 10 ? '0' + days : days,
        hours: hours < 10 ? '0' + hours : hours,
        minutes: minutes < 10 ? '0' + minutes : minutes,
        seconds: seconds < 10 ? '0' + seconds : seconds
      }
    },
    
    async refreshData() {
      const userId = uni.getStorageSync('userId');
      if (!userId) {
        uni.redirectTo({ url: '/pages/login/login' });
        return;
      }

      uni.showLoading({ title: '加载计划中...' });
      try {
        const { result } = await uniCloud.callFunction({
          name: 'getDailyPlan',
          data: { userId }
        });

        if (result && result.code === 0) {
          const { data } = result;
          // 1. 同步概览卡片
          this.weekRange = data.weekRange;
          this.weeklyTarget = data.weeklyTarget;
          this.completedCount = data.completedCount;
          this.accuracy = data.accuracy;
          this.studyDays = data.studyDays;
          this.avgTime = data.avgTime;
          
          // 2. 同步今日任务
          this.currentDay = data.currentDay;
          this.today = data.today;
          this.todayTasks = data.todayTasks;
          
          // 3. 同步能力趋势
          this.abilityTrends = data.abilityTrends;

          // 4. 同步本周完整计划
          if (data.mockWeeklyPlan) {
            this.mockWeeklyPlan = data.mockWeeklyPlan;
          }
        } else {
          uni.showToast({ title: result.message || '加载失败', icon: 'none' });
        }
      } catch (e) {
        console.error('加载计划失败', e);
        uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
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
      
      // 关键修正：跳转时应用 task.typeKey (如 verbal) 而非 task.type (如 weak)
      // 题库是通过模块键名 (verbal/quantitative等) 来筛选题目的
      uni.navigateTo({
        url: `/pages/practice/practice?type=${task.typeKey}&name=${task.name}&remaining=${task.total - task.completed}`
      })
    },
    
    viewFullPlan() {
      console.log('点击查看完整计划');
      this.showFullPlanPopup = true;
      this.$forceUpdate();
    },
    
    getTrendIcon(trend) {
      const map = {
        'up': 'arrow-upward',
        'stable': 'minus',
        'accumulate': 'more-circle',
        'down': 'arrow-downward'
      }
      return map[trend] || 'minus'
    },
    
    getTrendColor(trend) {
      const map = {
        'up': '#52C41A',
        'stable': '#2E5BFF',
        'accumulate': '#FAAD14',
        'down': '#FF4D4F'
      }
      return map[trend] || '#9CA3AF'
    },
    
    getTrendText(trend) {
      const map = {
        'up': '突破',
        'stable': '稳健',
        'accumulate': '筑基',
        'down': '下降'
      }
      return map[trend] || '持平'
    },
    
    adjustPreference() {
      uni.navigateTo({ url: '/pages/plan/preference' })
    },
    
    showTrendRules() {
      uni.showModal({
        title: '能力趋势判定规则',
        content: '系统采用全级差评价模型：\n\n1.【突破/提升】：分值 ≥ 85分。代表已进入优势区，正在向满分冲刺。\n\n2.【基础/持平】：分值在 60(含) - 85(不含) 之间。代表核心考点已掌握，处于水平稳定期。\n\n3.【筑基/持平】：分值 < 60分。代表正处于基础扫盲阶段，当前波动视为基础积累，暂不判定为能力提升，需跨越60分及格线以激活状态。',
        showCancel: false,
        confirmText: '理解了'
      })
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
  justify-content: space-between;
  
  .title-left {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }
  
  .date {
    font-size: 26rpx;
    color: #6B7280;
    font-weight: normal;
  }
}

/* 考试倒计时样式 */
.countdown-card {
  margin: 0 30rpx 30rpx;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF4D4F 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  color: #FFFFFF;
  box-shadow: 0 12rpx 24rpx rgba(255, 77, 79, 0.2);
  position: relative; // 确保子元素绝对定位有效

  .countdown-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    margin-bottom: 24rpx;
    opacity: 0.95;
    position: relative;
    z-index: 100; // 确保标题层级最高

    .title-text {
      font-size: 28rpx;
      font-weight: 600;
      letter-spacing: 2rpx;
    }

    .edit-icon-wrapper {
      padding: 10rpx;
      margin-left: 10rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      cursor: pointer;
    }
  }

  .countdown-clickable-area {
    position: relative;
    z-index: 10;
  }

  .countdown-main {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 20rpx;
    margin-bottom: 24rpx;

    .countdown-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255, 255, 255, 0.15);
      padding: 12rpx 16rpx;
      border-radius: 16rpx;
      min-width: 100rpx;

      .num {
        font-size: 44rpx;
        font-weight: 800;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }

      .label {
        font-size: 20rpx;
        margin-top: 4rpx;
        opacity: 0.8;
      }
    }
  }

  .countdown-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1rpx solid rgba(255, 255, 255, 0.2);
    padding-top: 20rpx;
    font-size: 22rpx;
    opacity: 0.8;

    .quote {
      font-style: italic;
    }
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
  margin: 0 20rpx;
  padding: 30rpx;
  
  .trend-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #F3F4F6;
    height: 100rpx;
    
    &:last-child {
      border-bottom: none;
    }
    
    .trend-name {
      width: 140rpx;
      font-size: 28rpx;
      color: #1F2937;
      font-weight: 500;
      flex-shrink: 0;
      line-height: 100rpx;
    }
    
    .trend-bar-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12rpx;
      padding: 0 10rpx;
      
      .bar-bg {
        flex: 1;
        height: 14rpx;
        background: #F3F4F6;
        border-radius: 7rpx;
        overflow: hidden;
        
        .bar-fill {
          height: 100%;
          border-radius: 7rpx;
          transition: width 0.6s ease;
        }
      }
      
      .bar-score {
        width: 70rpx;
        font-size: 30rpx;
        font-weight: bold;
        color: #1F2937;
        text-align: right;
        font-family: 'Din Condensed', sans-serif;
        
        .unit {
          font-size: 20rpx;
          font-weight: normal;
          color: #9CA3AF;
          margin-left: 2rpx;
        }
      }
    }
    
    .trend-status {
      width: 110rpx;
      display: flex;
      justify-content: flex-end;
      
      .status-tag {
        display: flex;
        align-items: center;
        gap: 4rpx;
        padding: 4rpx 10rpx;
        border-radius: 8rpx;
        font-size: 22rpx;
        font-weight: 500;
        
        &.up { background: #E6FFFB; color: #52C41A; }
        &.down { background: #FFF1F0; color: #FF4D4F; }
        &.stable { background: #E8EFFF; color: #2E5BFF; }
        &.accumulate { background: #FFF7E6; color: #FAAD14; }
      }
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

/* 弹窗详细样式 */
.full-plan-popup {
  background: #F8FAFC;
  height: 100%;
  display: flex;
  flex-direction: column;

  .popup-header {
    padding: 30rpx 40rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ffffff;
    border-radius: 40rpx 40rpx 0 0;
    
    .popup-title {
      font-size: 34rpx;
      font-weight: 800;
      color: #1E293B;
    }
  }

  .popup-content {
    flex: 1;
    padding: 30rpx;
    box-sizing: border-box;
    overflow-y: auto;
  }

  .plan-summary-card {
    display: flex;
    justify-content: space-around;
    padding: 30rpx;
    background: linear-gradient(135deg, #2E5BFF 0%, #1E90FF 100%);
    border-radius: 20rpx;
    color: #ffffff;
    margin-bottom: 40rpx;
    box-shadow: 0 10rpx 20rpx rgba(46, 91, 255, 0.2);

    .summary-item {
      text-align: center;
      .val {
        display: block;
        font-size: 36rpx;
        font-weight: 700;
        margin-bottom: 4rpx;
      }
      .lab {
        font-size: 22rpx;
        opacity: 0.8;
      }
    }
    .summary-divider {
      width: 1rpx;
      height: 60rpx;
      background: rgba(255, 255, 255, 0.3);
      align-self: center;
    }
  }

  .weekly-timeline {
    .timeline-item {
      display: flex;
      gap: 30rpx;
      margin-bottom: 30rpx;
      
      &.is-active {
        .time-node .node-dot {
          background: #2E5BFF;
          box-shadow: 0 0 15rpx rgba(46, 91, 255, 0.8);
        }
        .node-content {
          border: 2rpx solid #2E5BFF;
          background: #EEF2FF;
        }
      }
    }

    .time-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 80rpx;
      position: relative;
      
      .node-day {
        font-size: 24rpx;
        font-weight: 700;
        color: #94A3B8;
        margin-bottom: 15rpx;
      }
      .node-dot {
        width: 20rpx;
        height: 20rpx;
        border-radius: 50%;
        background: #E2E8F0;
        border: 4rpx solid #ffffff;
        z-index: 2;
      }
      .node-line {
        position: absolute;
        top: 60rpx;
        bottom: -30rpx;
        width: 4rpx;
        background: #E2E8F0;
        z-index: 1;
      }
    }

    .node-content {
      flex: 1;
      background: #ffffff;
      padding: 24rpx;
      border-radius: 20rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
      
        .node-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12rpx;
          .node-title {
            font-size: 30rpx;
            font-weight: 700;
            color: #334155;
          }
          .node-meta {
            display: flex;
            gap: 12rpx;
            .meta-tag {
              font-size: 22rpx;
              color: #64748B;
              background: #F8FAFC;
              padding: 2rpx 10rpx;
              border-radius: 6rpx;
            }
          }
        }

      .node-focus {
        display: flex;
        flex-wrap: wrap;
        gap: 10rpx;
        margin-bottom: 12rpx;
        .focus-tag {
          font-size: 20rpx;
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
          background: #F1F5F9;
          &.weak { color: #FF4D4F; background: #FFF1F0; }
          &.base { color: #FAAD14; background: #FFFBE6; }
          &.strong { color: #52C41A; background: #F6FFED; }
          &.all { color: #2E5BFF; background: #EEF2FF; }
        }
      }
      .node-desc {
        font-size: 24rpx;
        color: #94A3B8;
      }
    }
  }

  .popup-footer {
    padding: 30rpx 40rpx;
    background: #ffffff;
    .btn-confirm {
      width: 100%;
      height: 90rpx;
      line-height: 90rpx;
      background: #2E5BFF !important;
      color: #ffffff !important;
      border-radius: 45rpx;
      font-weight: 700;
      font-size: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>