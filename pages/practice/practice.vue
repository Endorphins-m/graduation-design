<template>
  <view class="container">
    <!-- 顶部信息栏 -->
    <view class="top-bar">
      <view class="recommend-reason">
        <u-icon name="pushpin-fill" size="24" color="#2E5BFF"></u-icon>
        <text>{{ recommendReason }}</text>
      </view>
      <view class="question-counter">
        <text class="current">{{ currentIndex + 1 }}</text>
        <text class="total">/{{ dailyLimit }}</text>
      </view>
    </view>
    
    <!-- 难度标识 -->
    <view class="difficulty-tag" :class="'level-' + currentQuestion.difficulty">
      <text>难度: {{ '⭐'.repeat(currentQuestion.difficulty) }}</text>
    </view>
    
    <!-- 题目卡片 -->
    <view class="question-wrapper">
      <scroll-view scroll-y class="question-scroll">
        <view class="question-card">
          <view class="source-tag">{{ currentQuestion.source }}</view>
          
          <rich-text class="question-content" :nodes="currentQuestion.content"></rich-text>
          
          <!-- 选项区 -->
          <view class="options-area">
            <view 
              v-for="(option, idx) in currentQuestion.options" 
              :key="idx"
              class="option-box"
              :class="getOptionClass(idx)"
              @click="selectOption(idx)"
            >
              <view class="option-letter">{{ String.fromCharCode(65 + idx) }}</view>
              <text class="option-text">{{ option }}</text>
              
              <view class="option-status" v-if="showAnswer">
                <u-icon 
                  v-if="idx === currentQuestion.correctAnswer" 
                  name="checkmark" 
                  size="32" 
                  color="#ffffff"
                ></u-icon>
                <u-icon 
                  v-else-if="idx === selectedOption" 
                  name="close" 
                  size="32" 
                  color="#ffffff"
                ></u-icon>
              </view>
            </view>
          </view>
          
          <!-- 答题后反馈区 -->
          <view class="feedback-area" v-if="showAnswer">
            <view class="result-banner" :class="isCorrect ? 'correct' : 'wrong'">
              <u-icon :name="isCorrect ? 'checkmark-circle-fill' : 'close-circle-fill'" size="40"></u-icon>
              <text>{{ isCorrect ? '回答正确!' : '回答错误' }}</text>
              <text class="time-cost">用时 {{ answerTime }}秒</text>
            </view>
            
            <view class="analysis-box">
              <view class="section-title">解析</view>
              <text class="analysis-text">{{ currentQuestion.analysis }}</text>
            </view>
            
            <view class="quick-tip-box" v-if="currentQuestion.quickTip">
              <view class="section-title tip">💡 速算技巧</view>
              <text class="tip-text">{{ currentQuestion.quickTip }}</text>
            </view>
            
            <!-- 能力评估变化 -->
            <view class="ability-update">
              <text>该题型能力评分: {{ currentAbility }} → {{ newAbility }}</text>
              <u-icon :name="abilityChange > 0 ? 'arrow-up' : 'arrow-down'" size="24" :color="abilityChange > 0 ? '#52C41A' : '#FF4D4F'"></u-icon>
            </view>
            
            <!-- 反馈按钮 -->
            <view class="feedback-actions">
              <text>题目难度反馈:</text>
              <view class="feedback-btns">
                <button 
                  v-for="fb in feedbackOptions" 
                  :key="fb.value"
                  class="fb-btn"
                  :class="{ active: selectedFeedback === fb.value }"
                  @click="giveFeedback(fb.value)"
                >
                  {{ fb.label }}
                </button>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="!showAnswer">
      <view class="tool-btns">
        <view class="tool-item" @click="collectQuestion">
          <u-icon :name="isCollected ? 'star-fill' : 'star'" size="36" :color="isCollected ? '#FAAD14' : '#6B7280'"></u-icon>
          <text>收藏</text>
        </view>
        <view class="tool-item" @click="showHint">
          <u-icon name="question-circle" size="36" color="#6B7280"></u-icon>
          <text>提示</text>
        </view>
        <view class="tool-item" @click="skipQuestion">
          <u-icon name="skip-forward" size="36" color="#6B7280"></u-icon>
          <text>跳过</text>
        </view>
      </view>
      
      <button class="btn-submit" :disabled="selectedOption === null" @click="submitAnswer">
        提交答案
      </button>
    </view>
    
    <view class="bottom-bar answer-mode" v-else>
      <button class="btn-next" @click="nextQuestion">
        {{ isLast ? '完成今日训练' : '下一题' }}
        <u-icon name="arrow-right" size="28" color="#ffffff"></u-icon>
      </button>
    </view>
    
    <!-- 计时悬浮球 -->
    <view class="timer-float" v-if="!showAnswer">
      <u-icon name="clock-fill" size="28" color="#2E5BFF"></u-icon>
      <text>{{ formatTimer }}</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      dailyLimit: 25,          // 今日剩余题量
      currentIndex: 0,
      selectedOption: null,
      showAnswer: false,
      startTime: 0,
      answerTime: 0,
      isCollected: false,
      selectedFeedback: null,
      currentAbility: 65,
      newAbility: 0,
      abilityChange: 0,
      
      recommendReason: '基于你的薄弱点: 数量关系',
      
      feedbackOptions: [
        { label: '太简单', value: 'easy' },
        { label: '合适', value: 'fit' },
        { label: '太难', value: 'hard' }
      ],
      
      // 题目队列 (由推荐算法生成)
      questionQueue: [
        {
          id: 'q001',
          type: 'quantitative',
          source: '2024国考模拟',
          difficulty: 3,
          content: '甲、乙两人分别从A、B两地同时出发，相向而行。甲的速度是乙的1.5倍，两人相遇时，甲比乙多走了20千米。求A、B两地的距离。',
          options: ['100千米', '120千米', '150千米', '180千米'],
          correctAnswer: 0,
          analysis: '设乙速度为v，则甲速度为1.5v。设相遇时间为t，则1.5vt - vt = 20，解得vt = 40。总距离 = 1.5vt + vt = 2.5vt = 100千米。',
          quickTip: '速度比3:2，路程比也是3:2，差1份=20km，总5份=100km',
          abilityWeight: { correct: 0.5, time: 0.3 }
        }
        // ... 更多题目
      ]
    }
  },
  
  computed: {
    currentQuestion() {
      return this.questionQueue[this.currentIndex]
    },
    isCorrect() {
      return this.selectedOption === this.currentQuestion.correctAnswer
    },
    isLast() {
      return this.currentIndex === this.questionQueue.length - 1
    },
    formatTimer() {
      const secs = Math.floor((Date.now() - this.startTime) / 1000)
      return `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}`
    }
  },
  
  onLoad(options) {
    // 接收从计划页传来的参数
    const { type, focus, remaining } = options
    this.loadRecommendedQuestions(type, focus, remaining)
    this.startTime = Date.now()
  },
  
  methods: {
    // 加载推荐题目 (调用云函数)
    async loadRecommendedQuestions(type, focusType, limit) {
      // uniCloud.callFunction({
      //   name: 'getRecommendQuestions',
      //   data: {
      //     userId: uni.getStorageSync('userId'),
      //     weakTypes: [focusType],
      //     limit: parseInt(limit) || 50,
      //     strategy: 'rule-based' // 初期使用规则推荐
      //   }
      // })
      
      // 模拟加载
      this.dailyLimit = parseInt(limit) || 25
    },
    
    selectOption(idx) {
      if (!this.showAnswer) {
        this.selectedOption = idx
      }
    },
    
    getOptionClass(idx) {
      if (!this.showAnswer) {
        return this.selectedOption === idx ? 'selected' : ''
      }
      if (idx === this.currentQuestion.correctAnswer) return 'correct'
      if (idx === this.selectedOption && idx !== this.currentQuestion.correctAnswer) return 'wrong'
      return 'disabled'
    },
    
    submitAnswer() {
      this.answerTime = Math.floor((Date.now() - this.startTime) / 1000)
      this.showAnswer = true
      
      // 更新能力评分 (简化计算)
      this.updateAbilityScore()
      
      // 保存答题记录到本地，后续批量同步
      this.saveAnswerRecord()
    },
    
    updateAbilityScore() {
      const q = this.currentQuestion
      let change = 0
      
      if (this.isCorrect) {
        change += q.abilityWeight.correct * 2  // 答对加分
        if (this.answerTime < 60) change += 1   // 快速答题额外加分
      } else {
        change -= q.abilityWeight.correct       // 答错扣分
      }
      
      this.abilityChange = Math.round(change)
      this.newAbility = Math.max(0, Math.min(100, this.currentAbility + this.abilityChange))
    },
    
    saveAnswerRecord() {
      const record = {
        questionId: this.currentQuestion.id,
        answer: this.selectedOption,
        correct: this.isCorrect,
        time: this.answerTime,
        timestamp: Date.now(),
        feedback: null // 等待用户反馈
      }
      
      let records = uni.getStorageSync('answerRecords') || []
      records.push(record)
      uni.setStorageSync('answerRecords', records)
    },
    
    giveFeedback(value) {
      this.selectedFeedback = value
      
      // 根据反馈调整画像权重
      const weightAdjust = { easy: -5, fit: 0, hard: 5 }
      this.newAbility = Math.max(0, Math.min(100, this.newAbility + weightAdjust[value]))
      
      uni.showToast({ title: '反馈已记录', icon: 'success' })
    },
    
    nextQuestion() {
      if (this.isLast) {
        this.finishDailyPractice()
      } else {
        this.currentIndex++
        this.resetState()
      }
    },
    
    resetState() {
      this.selectedOption = null
      this.showAnswer = false
      this.selectedFeedback = null
      this.currentAbility = this.newAbility
      this.startTime = Date.now()
      this.isCollected = false
    },
    
    finishDailyPractice() {
      // 同步答题记录到云端
      this.syncRecords()
      
      uni.showModal({
        title: '今日训练完成',
        content: `已完成 ${this.dailyLimit} 题，正确率 ${this.calculateAccuracy()}%，能力评分已更新`,
        showCancel: false,
        success: () => {
          uni.switchTab({ url: '/pages/plan/plan' })
        }
      })
    },
    
    calculateAccuracy() {
      const records = uni.getStorageSync('answerRecords') || []
      const today = records.filter(r => {
        const date = new Date(r.timestamp)
        return date.toDateString() === new Date().toDateString()
      })
      const correct = today.filter(r => r.correct).length
      return Math.round((correct / today.length) * 100) || 0
    },
    
    syncRecords() {
      const records = uni.getStorageSync('answerRecords') || []
      // 调用云函数批量保存
      // uniCloud.callFunction({ name: 'batchSaveRecords', data: { records } })
    },
    
    collectQuestion() {
      this.isCollected = !this.isCollected
      uni.showToast({ 
        title: this.isCollected ? '已收藏' : '取消收藏',
        icon: 'none'
      })
    },
    
    showHint() {
      uni.showModal({
        title: '解题提示',
        content: this.currentQuestion.quickTip || '暂无提示',
        showCancel: false
      })
    },
    
    skipQuestion() {
      uni.showModal({
        title: '确认跳过',
        content: '跳过本题将标记为"不感兴趣"，后续减少推荐',
        success: (res) => {
          if (res.confirm) {
            this.nextQuestion()
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F3F4F6;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background: #ffffff;
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
  
  .recommend-reason {
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: 26rpx;
    color: #2E5BFF;
    background: #E8EFFF;
    padding: 12rpx 24rpx;
    border-radius: 30rpx;
  }
  
  .question-counter {
    .current {
      font-size: 40rpx;
      font-weight: 700;
      color: #2E5BFF;
    }
    .total {
      font-size: 28rpx;
      color: #6B7280;
    }
  }
}

.difficulty-tag {
  text-align: center;
  padding: 20rpx;
  font-size: 24rpx;
  
  &.level-1 { color: #52C41A; }
  &.level-2 { color: #73D13D; }
  &.level-3 { color: #FAAD14; }
  &.level-4 { color: #FF7A45; }
  &.level-5 { color: #FF4D4F; }
}

.question-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 0 20rpx;
}

.question-scroll {
  height: 100%;
}

.question-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  
  .source-tag {
    display: inline-block;
    font-size: 24rpx;
    color: #2E5BFF;
    background: #E8EFFF;
    padding: 8rpx 20rpx;
    border-radius: 8rpx;
    margin-bottom: 30rpx;
  }
  
  .question-content {
    font-size: 34rpx;
    line-height: 1.8;
    color: #1F2937;
    margin-bottom: 40rpx;
    display: block;
  }
}

.options-area {
  .option-box {
    display: flex;
    align-items: center;
    padding: 30rpx;
    margin-bottom: 20rpx;
    border: 2rpx solid #E5E7EB;
    border-radius: 16rpx;
    background: #ffffff;
    transition: all 0.2s;
    
    &.selected {
      border-color: #2E5BFF;
      background: #E8EFFF;
      
      .option-letter {
        background: #2E5BFF;
        color: #ffffff;
      }
    }
    
    &.correct {
      border-color: #52C41A;
      background: rgba(82, 196, 26, 0.1);
      
      .option-letter {
        background: #52C41A;
        color: #ffffff;
      }
    }
    
    &.wrong {
      border-color: #FF4D4F;
      background: rgba(255, 77, 79, 0.1);
      
      .option-letter {
        background: #FF4D4F;
        color: #ffffff;
      }
    }
    
    &.disabled {
      opacity: 0.5;
    }
    
    .option-letter {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      background: #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      font-weight: 700;
      color: #6B7280;
      margin-right: 24rpx;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    
    .option-text {
      flex: 1;
      font-size: 32rpx;
      color: #1F2937;
      line-height: 1.5;
    }
    
    .option-status {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 16rpx;
    }
  }
}

.feedback-area {
  margin-top: 40rpx;
  padding-top: 40rpx;
  border-top: 2rpx solid #F3F4F6;
  
  .result-banner {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 30rpx;
    border-radius: 16rpx;
    margin-bottom: 30rpx;
    font-size: 34rpx;
    font-weight: 700;
    
    &.correct {
      background: rgba(82, 196, 26, 0.1);
      color: #52C41A;
    }
    
    &.wrong {
      background: rgba(255, 77, 79, 0.1);
      color: #FF4D4F;
    }
    
    .time-cost {
      margin-left: auto;
      font-size: 26rpx;
      font-weight: normal;
      opacity: 0.8;
    }
  }
  
  .analysis-box, .quick-tip-box {
    margin-bottom: 30rpx;
    
    .section-title {
      font-size: 30rpx;
      font-weight: 700;
      color: #1F2937;
      margin-bottom: 16rpx;
      display: block;
      
      &.tip {
        color: #FAAD14;
      }
    }
    
    .analysis-text, .tip-text {
      font-size: 30rpx;
      line-height: 1.8;
      color: #4B5563;
      display: block;
    }
    
    .tip-text {
      background: #FFFBEB;
      padding: 24rpx;
      border-radius: 12rpx;
      border-left: 6rpx solid #FAAD14;
    }
  }
  
  .ability-update {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 24rpx;
    background: #F3F4F6;
    border-radius: 12rpx;
    margin-bottom: 30rpx;
    font-size: 28rpx;
    color: #4B5563;
  }
  
  .feedback-actions {
    text {
      display: block;
      font-size: 28rpx;
      color: #6B7280;
      margin-bottom: 20rpx;
    }
    
    .feedback-btns {
      display: flex;
      gap: 20rpx;
      
      .fb-btn {
        flex: 1;
        height: 72rpx;
        line-height: 72rpx;
        background: #F3F4F6;
        color: #6B7280;
        border-radius: 36rpx;
        font-size: 28rpx;
        
        &.active {
          background: #2E5BFF;
          color: #ffffff;
        }
      }
    }
  }
}

.bottom-bar {
  background: #ffffff;
  padding: 30rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
  box-shadow: 0 -2rpx 8rpx rgba(0,0,0,0.05);
  
  .tool-btns {
    display: flex;
    gap: 40rpx;
    
    .tool-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;
      
      text {
        font-size: 22rpx;
        color: #6B7280;
      }
    }
  }
  
  .btn-submit {
    flex: 1;
    height: 80rpx;
    line-height: 80rpx;
    background: linear-gradient(135deg, #2E5BFF 0%, #1E90FF 100%);
    color: #ffffff;
    border-radius: 40rpx;
    font-size: 32rpx;
    font-weight: 600;
    
    &:disabled {
      opacity: 0.5;
    }
  }
  
  &.answer-mode {
    justify-content: center;
    
    .btn-next {
      width: 80%;
      height: 88rpx;
      line-height: 88rpx;
      background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
      color: #ffffff;
      border-radius: 44rpx;
      font-size: 32rpx;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12rpx;
    }
  }
}

.timer-float {
  position: fixed;
  right: 30rpx;
  bottom: 180rpx;
  background: #ffffff;
  padding: 20rpx 30rpx;
  border-radius: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #2E5BFF;
  z-index: 100;
}
</style>