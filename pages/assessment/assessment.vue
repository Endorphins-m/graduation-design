<template>
  <view class="container">
    <!-- 顶部进度信息 -->
    <view class="header">
      <view class="progress-info">
        <text class="type-name">{{ currentType.name }}</text>
        <text class="progress-text">{{ currentIndex + 1 }}/{{ questions.length }}</text>
      </view>
      <u-line-progress 
        :percent="progressPercent" 
        active-color="#2E5BFF"
        height="16"
      ></u-line-progress>
    </view>
    
    <!-- 题型图标区 -->
    <view class="type-icon">
      <view class="icon-circle" :style="{ background: currentType.color }">
        <u-icon :name="currentType.icon" size="64" color="#ffffff"></u-icon>
      </view>
      <text class="type-tag">{{ currentType.tag }}</text>
    </view>
    
    <!-- 计时器 -->
    <view class="timer-box">
      <u-icon name="clock-fill" size="32" color="#6B7280"></u-icon>
      <text class="timer-text">{{ formatTime(timer) }}</text>
    </view>
    
    <!-- 题目区域 -->
    <view class="question-card card">
      <view class="question-header">
        <text class="source">{{ currentQuestion.source }}</text>
        <text class="difficulty">
          <text v-for="n in currentQuestion.difficulty" :key="n">⭐</text>
        </text>
      </view>
      
      <rich-text class="question-content" :nodes="currentQuestion.content"></rich-text>
      
      <!-- 选项区 -->
      <view class="options">
        <view 
          v-for="(option, index) in currentQuestion.options" 
          :key="index"
          class="option-item"
          :class="{ 
            'selected': selectedOption === index,
            'correct': showResult && index === currentQuestion.answer,
            'wrong': showResult && selectedOption === index && index !== currentQuestion.answer
          }"
          @click="selectOption(index)"
        >
          <view class="option-label">{{ String.fromCharCode(65 + index) }}</view>
          <text class="option-text">{{ option }}</text>
          <u-icon 
            v-if="showResult && index === currentQuestion.answer" 
            name="checkmark-circle-fill" 
            size="40" 
            color="#52C41A"
          ></u-icon>
          <u-icon 
            v-if="showResult && selectedOption === index && index !== currentQuestion.answer" 
            name="close-circle-fill" 
            size="40" 
            color="#FF4D4F"
          ></u-icon>
        </view>
      </view>
    </view>
    
    <!-- 操作按钮 -->
    <view class="action-bar" v-if="!showResult">
      <button class="btn-submit" :disabled="selectedOption === null" @click="submitAnswer">
        提交答案
      </button>
    </view>
    
    <!-- 答题后反馈 -->
    <view class="feedback-card card" v-if="showResult">
      <view class="result-header" :class="isCorrect ? 'correct' : 'wrong'">
        <u-icon :name="isCorrect ? 'checkmark-circle-fill' : 'close-circle-fill'" size="48"></u-icon>
        <text>{{ isCorrect ? '回答正确! +2分' : '回答错误' }}</text>
      </view>
      
      <view class="analysis">
        <view class="section">
          <text class="label">【解析】</text>
          <text class="content">{{ currentQuestion.analysis }}</text>
        </view>
        
        <view class="section" v-if="currentQuestion.quickTip">
          <text class="label quick">【速算技巧】</text>
          <text class="content tip">{{ currentQuestion.quickTip }}</text>
        </view>
        
        <view class="stats">
          <view class="stat-item">
            <text class="num">{{ currentQuestion.typeStats.count }}</text>
            <text class="desc">该题型已练</text>
          </view>
          <view class="stat-item">
            <text class="num">{{ currentQuestion.typeStats.accuracy }}%</text>
            <text class="desc">正确率</text>
          </view>
          <view class="stat-item">
            <text class="num">{{ currentQuestion.typeStats.avgTime }}s</text>
            <text class="desc">平均用时</text>
          </view>
        </view>
      </view>
      
      <button class="btn-next" @click="nextQuestion">
        {{ isLast ? '完成测评' : '下一题' }}
        <u-icon name="arrow-right" size="28" color="#ffffff"></u-icon>
      </button>
    </view>
    
    <!-- 底部提示 -->
    <view class="footer-hint">
      <text>测评数据将用于构建你的个性化能力画像</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentIndex: 0,
      selectedOption: null,
      showResult: false,
      timer: 0,
      timerInterval: null,
      questions: [
        {
          type: 'quantitative',
          name: '数量关系',
          icon: 'grid-fill',
          color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          tag: '数学运算',
          source: '2023国考真题',
          difficulty: 3,
          content: '某商场促销，买3送1，已知商品原价100元，小明买了12件，实际支付相当于打几折？',
          options: ['打7.5折', '打8折', '打8.5折', '打9折'],
          answer: 1,
          analysis: '买3送1相当于花3件的钱买4件。买12件实际支付9件的钱。折扣率 = 9/12 = 0.75，即打7.5折。但题目问的是"相当于打几折"，实际支付900元买1200元的商品，900/1200=0.75，选A。',
          quickTip: '赋值法：设单价100，买12件原价1200，实付900，900/1200=0.75',
          typeStats: { count: 15, accuracy: 67, avgTime: 45 }
        },
        {
          type: 'verbal',
          name: '言语理解',
          icon: 'file-text-fill',
          color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          tag: '逻辑填空',
          source: '2023省考真题',
          difficulty: 2,
          content: '在人工智能高速发展的今天，______的算法推荐已经成为信息分发的主要方式。填入画横线部分最恰当的一项是：',
          options: ['千篇一律', '千人千面', '一成不变', '五花八门'],
          answer: 1,
          analysis: '根据语境"人工智能高速发展"和"算法推荐"，强调的是根据不同用户推荐不同内容，"千人千面"最符合。',
          quickTip: '关键词对应：人工智能→个性化→千人千面',
          typeStats: { count: 23, accuracy: 78, avgTime: 32 }
        }
      ],
      answers: [] // 存储答题记录
    }
  },
  
  computed: {
    currentQuestion() {
      return this.questions[this.currentIndex]
    },
    currentType() {
      return {
        name: this.currentQuestion.name,
        icon: this.currentQuestion.icon,
        color: this.currentQuestion.color,
        tag: this.currentQuestion.tag
      }
    },
    progressPercent() {
      return ((this.currentIndex + 1) / this.questions.length) * 100
    },
    isCorrect() {
      return this.selectedOption === this.currentQuestion.answer
    },
    isLast() {
      return this.currentIndex === this.questions.length - 1
    }
  },
  
  onLoad(options) {
    this.startTimer()
    // 实际应从接口获取测评题目
  },
  
  beforeDestroy() {
    this.stopTimer()
  },
  
  methods: {
    startTimer() {
      this.timerInterval = setInterval(() => {
        this.timer++
      }, 1000)
    },
    
    stopTimer() {
      clearInterval(this.timerInterval)
    },
    
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },
    
    selectOption(index) {
      if (!this.showResult) {
        this.selectedOption = index
      }
    },
    
    submitAnswer() {
      this.stopTimer()
      this.showResult = true
      
      // 记录答题数据
      this.answers.push({
        questionId: this.currentQuestion.id,
        selected: this.selectedOption,
        correct: this.isCorrect,
        time: this.timer,
        isAnomaly: this.checkAnomaly() // 异常值标记
      })
    },
    
    checkAnomaly() {
      // 异常值检测：答题时间或正确率异常
      const avgTime = this.currentQuestion.typeStats.avgTime
      return this.timer > avgTime * 2 || this.timer < 5 // 过快或过慢
    },
    
    nextQuestion() {
      if (this.isLast) {
        this.finishAssessment()
      } else {
        this.currentIndex++
        this.resetQuestion()
      }
    },
    
    resetQuestion() {
      this.selectedOption = null
      this.showResult = false
      this.timer = 0
      this.startTimer()
    },
    
    finishAssessment() {
      // 计算画像并保存
      const profile = this.calculateProfile()
      
      uni.showModal({
        title: '测评完成',
        content: '已完成初始能力测评，系统已为你生成个性化学习计划',
        showCancel: false,
        success: () => {
          uni.switchTab({ url: '/pages/plan/plan' })
        }
      })
    },
    
    calculateProfile() {
      // 简化的画像计算逻辑
      const typeScores = {}
      this.answers.forEach(ans => {
        const type = this.questions[ans.questionIndex].type
        if (!typeScores[type]) {
          typeScores[type] = { total: 0, correct: 0, time: 0 }
        }
        if (!ans.isAnomaly) {
          typeScores[type].total++
          if (ans.correct) typeScores[type].correct++
          typeScores[type].time += ans.time
        }
      })
      
      // 保存到本地或发送到服务器
      uni.setStorageSync('initialProfile', typeScores)
      return typeScores
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

.header {
  background: #ffffff;
  padding: 30rpx 40rpx;
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .type-name {
      font-size: 36rpx;
      font-weight: 700;
      color: #1F2937;
    }
    
    .progress-text {
      font-size: 28rpx;
      color: #6B7280;
    }
  }
}

.type-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
  
  .icon-circle {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  }
  
  .type-tag {
    font-size: 28rpx;
    color: #6B7280;
    background: #F3F4F6;
    padding: 8rpx 24rpx;
    border-radius: 20rpx;
  }
}

.timer-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
  
  .timer-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #6B7280;
    font-family: 'Courier New', monospace;
  }
}

.question-card {
  .question-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30rpx;
    
    .source {
      font-size: 26rpx;
      color: #2E5BFF;
      background: #E8EFFF;
      padding: 8rpx 20rpx;
      border-radius: 8rpx;
    }
    
    .difficulty {
      font-size: 24rpx;
    }
  }
  
  .question-content {
    font-size: 34rpx;
    line-height: 1.8;
    color: #1F2937;
    margin-bottom: 40rpx;
    display: block;
  }
}

.options {
  .option-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    margin-bottom: 20rpx;
    border: 2rpx solid #E5E7EB;
    border-radius: 16rpx;
    background: #ffffff;
    transition: all 0.3s;
    
    &.selected {
      border-color: #2E5BFF;
      background: #E8EFFF;
    }
    
    &.correct {
      border-color: #52C41A;
      background: rgba(82, 196, 26, 0.1);
    }
    
    &.wrong {
      border-color: #FF4D4F;
      background: rgba(255, 77, 79, 0.1);
    }
    
    .option-label {
      width: 56rpx;
      height: 56rpx;
      border-radius: 50%;
      background: #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      font-weight: 600;
      color: #6B7280;
      margin-right: 24rpx;
      flex-shrink: 0;
    }
    
    .option-text {
      flex: 1;
      font-size: 32rpx;
      color: #1F2937;
    }
  }
}

.action-bar {
  margin: 40rpx;
  
  .btn-submit {
    width: 100%;
    height: 90rpx;
    line-height: 90rpx;
    background: linear-gradient(135deg, #2E5BFF 0%, #1E90FF 100%);
    color: #ffffff;
    border-radius: 45rpx;
    font-size: 32rpx;
    font-weight: 600;
    
    &:disabled {
      opacity: 0.5;
    }
  }
}

.feedback-card {
  margin-top: 30rpx;
  
  .result-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 30rpx;
    border-radius: 16rpx;
    margin-bottom: 30rpx;
    font-size: 36rpx;
    font-weight: 700;
    
    &.correct {
      background: rgba(82, 196, 26, 0.1);
      color: #52C41A;
    }
    
    &.wrong {
      background: rgba(255, 77, 79, 0.1);
      color: #FF4D4F;
    }
  }
  
  .analysis {
    .section {
      margin-bottom: 30rpx;
      
      .label {
        display: block;
        font-size: 30rpx;
        font-weight: 700;
        color: #1F2937;
        margin-bottom: 16rpx;
        
        &.quick {
          color: #FAAD14;
        }
      }
      
      .content {
        display: block;
        font-size: 30rpx;
        line-height: 1.8;
        color: #4B5563;
        
        &.tip {
          background: #FFFBEB;
          padding: 20rpx;
          border-radius: 12rpx;
          border-left: 6rpx solid #FAAD14;
        }
      }
    }
  }
  
  .stats {
    display: flex;
    justify-content: space-around;
    padding: 30rpx 0;
    border-top: 1rpx solid #E5E7EB;
    border-bottom: 1rpx solid #E5E7EB;
    margin-bottom: 30rpx;
    
    .stat-item {
      text-align: center;
      
      .num {
        display: block;
        font-size: 40rpx;
        font-weight: 700;
        color: #2E5BFF;
        margin-bottom: 8rpx;
      }
      
      .desc {
        font-size: 24rpx;
        color: #6B7280;
      }
    }
  }
  
  .btn-next {
    width: 100%;
    height: 90rpx;
    line-height: 90rpx;
    background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
    color: #ffffff;
    border-radius: 45rpx;
    font-size: 32rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
  }
}

.footer-hint {
  text-align: center;
  padding: 40rpx;
  
  text {
    font-size: 26rpx;
    color: #9CA3AF;
  }
}
</style>