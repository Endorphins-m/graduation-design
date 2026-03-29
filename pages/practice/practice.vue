<template>
  <view class="container">
    <!-- 1. 顶部导航栏 -->
    <view class="top-bar">
      <view class="back-btn" @click="handleBack">
        <u-icon name="arrow-left" size="34" color="#333"></u-icon>
      </view>
      <view class="module-title">{{ currentModuleName }}</view>
      <view class="question-counter" v-if="questionQueue.length > 0">
        <text class="current">{{ currentIndex + 1 }}</text>
        <text class="total">/{{ dailyLimit }}</text>
      </view>
    </view>
    
    <!-- 2. 难度标识 -->
    <view class="difficulty-tag" :class="'level-' + (currentQuestion ? currentQuestion.difficulty : 1)" v-if="currentQuestion">
      <view class="diff-left">
        <text>难度: {{ '⭐'.repeat(currentQuestion.difficulty || 1) }}</text>
      </view>
      <view class="rec-time" v-if="currentQuestion.recommendedTime">
        <u-icon name="clock" size="24" color="#999"></u-icon>
        <text>推荐: {{ currentQuestion.recommendedTime }}s</text>
      </view>
    </view>
    
    <!-- 3. 题目主区域 -->
    <view class="question-wrapper" v-if="currentQuestion">
      <view class="question-card">
        <view class="source-tag">{{ currentQuestion.source || '真题模拟' }}</view>
        
        <!-- 题干 -->
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
            
            <!-- 提交后显示对错图标 -->
            <view class="option-status" v-if="isSubmitted">
              <u-icon 
                v-if="idx === currentQuestion.correctAnswer" 
                name="checkmark-circle-fill" 
                size="36" 
                color="#52C41A"
              ></u-icon>
              <u-icon 
                v-else-if="idx === currentQuestion.userAnswer" 
                name="close-circle-fill" 
                size="36" 
                color="#FF4D4F"
              ></u-icon>
            </view>
          </view>
        </view>
        
        <!-- 4. 提交后显示的解析区 -->
        <view class="feedback-area" v-if="isSubmitted">
          <view class="result-card" :class="isCurrentCorrect ? 'bg-correct' : 'bg-wrong'">
            <view class="res-top">
              <u-icon :name="isCurrentCorrect ? 'checkmark-circle-fill' : 'close-circle-fill'" size="44" :color="isCurrentCorrect ? '#52C41A' : '#FF4D4F'"></u-icon>
              <text class="res-text">{{ isCurrentCorrect ? '回答正确' : '回答错误' }}</text>
            </view>
            <view class="res-detail">
              <text>正确答案：<text class="ans-ok">{{ String.fromCharCode(65 + currentQuestion.correctAnswer) }}</text></text>
              <text v-if="currentQuestion.userAnswer !== null">你的答案：<text :class="isCurrentCorrect ? 'ans-ok' : 'ans-no'">{{ String.fromCharCode(65 + currentQuestion.userAnswer) }}</text></text>
            </view>
          </view>
          
          <view class="analysis-box">
            <view class="box-title">
              <view class="line"></view>
              <text>答案解析</text>
            </view>
            <text class="analysis-text">{{ currentQuestion.analysis }}</text>
          </view>
        </view>

        <!-- 5. 操作按钮区 -->
        <view class="action-section">
          <view class="btn-row">
            <!-- 美化后的收藏按钮 -->
            <view class="collect-wrapper" @click="toggleCollect" :class="{ 'is-active': isCollected }">
              <view class="collect-icon-box">
                <u-icon :name="isCollected ? 'star-fill' : 'star'" size="40"></u-icon>
              </view>
              <text class="collect-txt">{{ isCollected ? '已收藏' : '收藏' }}</text>
            </view>
            
            <button class="nav-btn" :disabled="currentIndex === 0" @click="prevQuestion">上一题</button>
            
            <!-- 中间主按钮 -->
            <button 
              class="submit-btn" 
              :class="{ 'btn-ready': !isSubmitted, 'btn-done': isSubmitted }"
              @click="handleMainBtnClick"
            >
              {{ isSubmitted ? (isCurrentCorrect ? '正确' : '错误') : '提交整卷' }}
            </button>
            
            <button class="nav-btn" :disabled="isLast" @click="nextQuestion">下一题</button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 6. 底部留白 -->
    <view class="safe-bottom-space"></view>

    <!-- 计时悬浮球 -->
    <view class="timer-float" v-if="!isSubmitted">
      <u-icon name="clock-fill" size="28" color="#2E5BFF"></u-icon>
      <text>{{ formatTimer }}</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentModuleName: '在线练习',
      currentModuleType: '', // 新增：保存当前练习的模块类型
      dailyLimit: 0,
      currentIndex: 0,
      isSubmitted: false,
      startTime: 0,
      now: Date.now(), // 新增：用于每秒更新的时间戳
      totalTime: 0,
      isCollected: false,
      recommendReason: '智能推荐练习',
      questionQueue: []
    }
  },
  
  computed: {
    currentQuestion() {
      return this.questionQueue[this.currentIndex] || null
    },
    isCurrentCorrect() {
      if (!this.currentQuestion) return false;
      return this.currentQuestion.userAnswer === this.currentQuestion.correctAnswer
    },
    isLast() {
      return this.currentIndex === (this.questionQueue.length - 1)
    },
    formatTimer() {
      const secs = Math.floor((this.now - this.startTime) / 1000)
      if (secs < 0) return '0:00'
      return `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}`
    }
  },
  
  onLoad(options) {
    const { type, name } = options;
    if (name) this.currentModuleName = name;
    if (type) this.currentModuleType = type; // 保存 type
    this.loadRecommendedQuestions(type);
    
    // 启动全局计时定时器
    this.timerInterval = setInterval(() => {
      this.now = Date.now();
    }, 1000);
  },
  
  onUnload() {
    // 离开页面时清除定时器，防止内存泄漏
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },
  
  methods: {
    async loadRecommendedQuestions(type = '') {
      uni.showLoading({ title: '正在获取题库...' });
      try {
        const res = await uniCloud.callFunction({
          name: 'getRecommendQuestions',
          data: {
            userId: uni.getStorageSync('userId') || 'test-user-id',
            limit: 10,
            type: type
          }
        });
        if (res.result && res.result.code === 0) {
          this.questionQueue = res.result.data.map(item => ({
            ...item,
            // 关键修正：将数据库中的 answer 字段映射为组件使用的 correctAnswer 字段
            correctAnswer: item.answer !== undefined ? item.answer : item.correctAnswer,
            userAnswer: null 
          }));
          this.dailyLimit = this.questionQueue.length;
          this.currentIndex = 0;
          this.startTime = Date.now();
          // 加载题目后初始化第一题的收藏状态
          this.checkIdCollected();
        } else {
          uni.showToast({ title: res.result.message || '加载失败', icon: 'none' });
        }
      } catch (e) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },

    handleBack() {
      // 如果已经提交了，直接返回题库首页
      if (this.isSubmitted) {
        uni.switchTab({
          url: '/pages/library/library'
        });
        return;
      }
      
      // 如果还没提交，弹窗提醒用户进度将丢失
      uni.showModal({
        title: '退出练习',
        content: '退出后当前练习记录将不会保存，确定离开吗？',
        cancelText: '继续练习',
        confirmText: '确定离开',
        success: (res) => {
          if (res.confirm) {
            // 关键修正：跳转到 tabBar 页面必须使用 switchTab
            uni.switchTab({
              url: '/pages/library/library'
            });
          }
        }
      });
    },

    selectOption(index) {
      if (this.isSubmitted) return;
      this.questionQueue[this.currentIndex].userAnswer = index;
    },

    getOptionClass(index) {
      const q = this.currentQuestion;
      if (!this.isSubmitted) {
        return q.userAnswer === index ? 'active' : '';
      }
      if (index === q.correctAnswer) return 'correct';
      if (index === q.userAnswer && index !== q.correctAnswer) return 'wrong';
      return '';
    },

    handleMainBtnClick() {
      if (this.isSubmitted) return;
      this.submitFullExam();
    },

    submitFullExam() {
      const unFinishedIndices = [];
      this.questionQueue.forEach((q, idx) => {
        if (q.userAnswer === null) {
          unFinishedIndices.push(idx + 1);
        }
      });

      if (unFinishedIndices.length > 0) {
        uni.showModal({
          title: '未完成提示',
          content: `还有第 ${unFinishedIndices.join(', ')} 题未做，确定要提交吗？`,
          confirmText: '确定提交',
          cancelText: '去检查',
          success: (res) => {
            if (res.confirm) this.doSubmit();
          }
        });
      } else {
        uni.showModal({
          title: '确认提交',
          content: '所有题目已完成，是否立即交卷？',
          success: (res) => {
            if (res.confirm) this.doSubmit();
          }
        });
      }
    },

    async doSubmit() {
      this.isSubmitted = true;
      this.totalTime = Math.floor((Date.now() - this.startTime) / 1000);
      
      // --- 新增：计算并同步进度 ---
      const userId = uni.getStorageSync('userId');
      if (userId) {
        // 1. 统计本次练习各模块数量和正确数
        const stats = {
          totalCount: this.questionQueue.length,
          totalCorrect: 0,
          duration: this.totalTime, // 本次练习时长（秒）
          modules: {}
        };
        
        // --- 收集错题信息 ---
        const wrongQuestions = [];

        this.questionQueue.forEach(q => {
          // 优先使用题目自带的 type，如果没有则使用当前模块的 type
          const moduleKey = q.type || this.currentModuleType || 'unknown';
          if (!stats.modules[moduleKey]) stats.modules[moduleKey] = 0;
          stats.modules[moduleKey]++;

          // 记录正确数
          if (q.userAnswer === q.correctAnswer) {
            stats.totalCorrect++;
          } else if (q.userAnswer !== null) {
            // 记录错题
            wrongQuestions.push({
              id: q._id,
              moduleType: moduleKey,
              userAnswer: q.userAnswer
            });
          }
        });

        // 2. 异步上传到云端（不阻塞用户看解析）
        uniCloud.callFunction({
          name: 'updateUserProgress',
          data: {
            userId: userId,
            stats: stats,
            questionIds: this.questionQueue.map(q => q._id), // 新增：传题目ID列表用于排重
            wrongQuestions: wrongQuestions // 新增：传错题列表
          }
        }).then(res => {
          console.log('进度与错题同步成功:', res);
        }).catch(err => {
          console.error('进度同步失败:', err);
        });
      }
      // --- 同步逻辑结束 ---

      uni.showToast({ title: '交卷成功', icon: 'success' });
      this.currentIndex = 0;
      uni.pageScrollTo({ scrollTop: 0, duration: 300 });
    },
    prevQuestion() {
      if (this.currentIndex > 0) this.currentIndex--;
      // 切换题目时刷新该题的收藏状态
      this.checkIdCollected();
    },

    nextQuestion() {
      if (this.currentIndex < this.questionQueue.length - 1) {
        this.currentIndex++;
        // 切换题目时刷新该题的收藏状态
        this.checkIdCollected();
      }
    },

    // 检查当前题目是否已收藏
    async checkIdCollected() {
      const userId = uni.getStorageSync('userId');
      const q = this.currentQuestion;
      if (!userId || !q) return;

      try {
        const db = uniCloud.database();
        const res = await db.collection('collection_records').where({
          userId: userId,
          questionId: q._id
        }).get();
        this.isCollected = res.result.data.length > 0;
      } catch (e) {
        console.error('检查收藏状态失败', e);
      }
    },

    async toggleCollect() {
      const userId = uni.getStorageSync('userId');
      if (!userId) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      const q = this.currentQuestion;
      const db = uniCloud.database();

      try {
        if (this.isCollected) {
          // 取消收藏
          await db.collection('collection_records').where({
            userId: userId,
            questionId: q._id
          }).remove();
          this.isCollected = false;
        } else {
          // 添加收藏
          await db.collection('collection_records').add({
            userId: userId,
            questionId: q._id,
            moduleType: q.type || this.currentModuleType || 'unknown',
            createTime: new Date().getTime()
          });
          this.isCollected = true;
        }

        uni.vibrateShort();
        uni.showToast({
          title: this.isCollected ? '收藏成功' : '取消收藏',
          icon: 'success'
        });
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.container { min-height: 100vh; background: #f8f9fb; }
.top-bar { 
  display: flex; align-items: center; padding: 20rpx 30rpx; 
  background: #fff; border-bottom: 1rpx solid #eee; position: sticky; top: 0; z-index: 100;
  .back-btn { padding-right: 20rpx; }
  .module-title { flex: 1; font-size: 30rpx; font-weight: bold; color: #333; }
  .question-counter { font-size: 24rpx; color: #999; }
}

.difficulty-tag { 
  padding: 10rpx 30rpx; font-size: 24rpx; color: #999; 
  display: flex; justify-content: space-between; align-items: center;
  .rec-time { display: flex; align-items: center; gap: 6rpx; color: #ffa940; font-weight: 500; }
}
.question-card { background: #fff; margin: 20rpx; padding: 40rpx 30rpx; border-radius: 20rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03); }
.source-tag { font-size: 22rpx; color: #2e5bff; background: #eef2ff; padding: 4rpx 12rpx; border-radius: 4rpx; display: inline-block; margin-bottom: 20rpx; }
.question-content { font-size: 32rpx; line-height: 1.6; color: #333; margin-bottom: 40rpx; font-weight: 500; }

.option-box { 
  display: flex; align-items: center; padding: 30rpx; margin-top: 24rpx; 
  background: #f8f9fa; border-radius: 16rpx; border: 2rpx solid transparent; transition: all 0.2s;
  &.active { border-color: #2e5bff; background: #f0f4ff; color: #2e5bff; font-weight: bold; }
  &.correct { background: #e6f9ed; border-color: #52c41a; color: #1e8e3e; }
  &.wrong { background: #fff1f0; border-color: #ff4d4f; color: #cf1322; }
}
.option-letter { width: 50rpx; font-weight: bold; font-size: 34rpx; }
.option-status { margin-left: auto; }

.action-section { margin-top: 60rpx; padding-top: 40rpx; border-top: 2rpx solid #f1f3f5; }
.btn-row { display: flex; align-items: center; gap: 16rpx; }

.collect-wrapper {
  display: flex; flex-direction: column; align-items: center; width: 100rpx;
  .collect-icon-box {
    width: 76rpx; height: 76rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: #f1f3f5; color: #9ca3af; margin-bottom: 8rpx;
  }
  .collect-txt { font-size: 20rpx; color: #9ca3af; }
  &.is-active {
    .collect-icon-box { background: #fffbe6; color: #faad14; }
    .collect-txt { color: #faad14; font-weight: bold; }
  }
}

.nav-btn {
  flex: 1; height: 86rpx; line-height: 86rpx; background: #f1f3f5;
  color: #495057; font-size: 26rpx; border-radius: 43rpx; border: none;
  &[disabled] { opacity: 0.3; }
}

.submit-btn {
  flex: 1.8; height: 86rpx; line-height: 86rpx; background: #2e5bff;
  color: #fff; font-size: 28rpx; border-radius: 43rpx; border: none; font-weight: bold;
  &.btn-done { background: #f8f9fa; color: #333; border: 1rpx solid #ddd; }
}

.feedback-area { margin-top: 40rpx; animation: slideUp 0.4s ease-out; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }

.result-card {
  padding: 30rpx; border-radius: 16rpx; margin-bottom: 30rpx;
  .res-top { display: flex; align-items: center; gap: 12rpx; margin-bottom: 10rpx; .res-text { font-size: 34rpx; font-weight: bold; } }
  .res-detail { display: flex; justify-content: space-between; font-size: 26rpx; }
}
.bg-correct { background: #f6ffed; border: 1rpx solid #b7eb8f; }
.bg-wrong { background: #fff1f0; border: 1rpx solid #ffa39e; }
.ans-ok { color: #52c41a; font-weight: bold; }
.ans-no { color: #ff4d4f; font-weight: bold; }

.analysis-box { margin-bottom: 30rpx; .box-title { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; font-weight: bold; .line { width: 6rpx; height: 28rpx; background: #2e5bff; border-radius: 3rpx; } } }
.analysis-text { font-size: 28rpx; color: #555; line-height: 1.8; }

.safe-bottom-space { height: 140rpx; padding-bottom: env(safe-area-inset-bottom); }
.timer-float {
  position: fixed; right: 30rpx; bottom: 180rpx; background: rgba(255,255,255,0.95);
  padding: 12rpx 28rpx; border-radius: 40rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
  display: flex; align-items: center; gap: 10rpx; font-size: 26rpx; color: #2e5bff; font-weight: bold;
}
</style>