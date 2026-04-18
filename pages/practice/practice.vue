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
    const { type, name, id, mode, ids } = options;
    if (name) this.currentModuleName = name;
    if (type) this.currentModuleType = type; // 保存 type
    
    // 情况1：查看单题模式（收藏夹/错题本跳转）
    if (id) {
      this.loadSingleQuestion(id, mode);
    } else if (ids) {
      // 情况2：查看多题复练模式（历史记录跳转）
      this.loadMultiQuestions(ids.split(','), mode);
    } else {
      // 情况3：正常练习模式
      this.loadRecommendedQuestions(type);
    }
    
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
    async loadSingleQuestion(id, mode) {
      uni.showLoading({ title: '加载题目中...' });
      try {
        const db = uniCloud.database();
        const collections = [
          'verbal_questions', 'quantitative_questions', 'reasoning_questions', 
          'data_analysis_questions', 'common_sense_questions', 'politics_questions'
        ];
        
        let targetQuestion = null;
        let realId = id;
        let subId = null;

        // 资料分析子题目 ID 处理: 格式支持 "prefix_index" 或 "material_xxx_index"
        if (id.includes('_')) {
          const parts = id.split('_');
          subId = parts.pop(); // 弹出最后一部分作为 subId
          realId = parts.join('_'); // 剩下的部分重新组合作为 realId
        }

        // 构建 ID 搜索数组，支持 String 和 Number (UniCloud 跨端兼容)
        const idSearchArr = [realId];
        if (/^\d+$/.test(realId)) idSearchArr.push(Number(realId));
        if (typeof realId !== 'string') idSearchArr.push(String(realId));

        for (const col of collections) {
          try {
            // 使用 where + in 代替 doc，兼容性更好
            const res = await db.collection(col).where({
              _id: db.command.in(idSearchArr)
            }).get();

            if (res.result.data && res.result.data.length > 0) {
              const item = res.result.data[0];
              
              // 如果是复合题（资料分析）
              if (item.questions && Array.isArray(item.questions)) {
                // 如果有子题ID，找对应的子题（支持 qid, _id 或 index）
                const subQ = subId ? 
                  item.questions.find((q, idx) => String(q.qid) === subId || String(q._id) === subId || String(idx) === subId) : 
                  item.questions[0];
                if (subQ) {
                  // 转换材料图片（复用 getRecommendQuestions 的逻辑思路）
                  let materialHtml = '';
                  if (item.material) {
                    let img = item.material.image || '';
                    // 简单处理：在这里我们假设直接显示，如果需要 cloud:// 转换建议在云函数处理
                    // 但为了保证跳转可用，先合成 HTML
                    materialHtml = `<div style="background:#f8f9fa;padding:12px;margin-bottom:12px;border-left:4px solid #2E5BFF;">
                      <div style="font-weight:bold;color:#2E5BFF;margin-bottom:8px;">[阅读材料]</div>
                      ${img ? `<img src="${img}" style="width:100%"/>` : ''}
                      <div>${item.material.text || ''}</div>
                    </div>`;
                  }

                  targetQuestion = {
                    ...subQ,
                    _id: id,
                    content: materialHtml + subQ.content,
                    source: item.source || '资料分析',
                    correctAnswer: subQ.answer !== undefined ? subQ.answer : subQ.correctAnswer,
                    analysis: subQ.explanation || subQ.analysis || '暂无解析',
                    userAnswer: null
                  };
                }
              } else {
                // 普通题
                targetQuestion = {
                  ...item,
                  correctAnswer: item.answer !== undefined ? item.answer : item.correctAnswer,
                  analysis: item.explanation || item.analysis || '暂无解析',
                  userAnswer: null
                };
              }
              if (targetQuestion) break;
            }
          } catch (err) {
            console.warn(`Query ${col} failed:`, err);
          }
        }

        if (targetQuestion) {
          this.questionQueue = [targetQuestion];
          this.dailyLimit = 1;
          this.currentIndex = 0;
          this.startTime = Date.now();
          if (mode === 'review') {
            this.isSubmitted = true;
          }
          uni.hideLoading(); // 关键成功路径：提前关闭 loading，防止后续 checkIdCollected 延迟导致的冲突
          this.checkIdCollected();
        } else {
          uni.hideLoading(); // 业务逻辑失败路径：关闭 loading
          uni.showToast({ title: '未找到相关题目', icon: 'none' });
        }
      } catch (e) {
        uni.hideLoading(); // 异常路径：关闭 loading
        console.error('加载单题异常:', e);
        uni.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    async loadMultiQuestions(ids, mode) {
      uni.showLoading({ title: '加载题目中...' });
      try {
        const db = uniCloud.database();
        const collections = [
          'verbal_questions', 'quantitative_questions', 'reasoning_questions', 
          'data_analysis_questions', 'common_sense_questions', 'politics_questions'
        ];
        
        const results = [];
        // 为了性能考虑，我们采用分表并行查询，然后再根据 id 排序
        const promises = collections.map(col => 
          db.collection(col).where({
            _id: db.command.in(ids)
          }).get()
        );

        const allRes = await Promise.all(promises);
        allRes.forEach(res => {
          if (res.result.data) {
            res.result.data.forEach(item => {
              results.push({
                ...item,
                correctAnswer: item.answer !== undefined ? item.answer : item.correctAnswer,
                userAnswer: null
              });
            });
          }
        });

        // 恢复原始顺序
        const sortedResults = ids.map(id => results.find(r => r._id === id)).filter(Boolean);

        if (sortedResults.length > 0) {
          this.questionQueue = sortedResults;
          this.dailyLimit = sortedResults.length;
          this.currentIndex = 0;
          this.startTime = Date.now();
          if (mode === 'review') {
            this.isSubmitted = true;
          }
          this.checkIdCollected();
        } else {
          uni.showToast({ title: '未找到相关题目', icon: 'none' });
        }
      } catch (e) {
        console.error('加载多题异常:', e);
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },

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
            // 关键修正：确保数据库字段与前端字段对齐
            correctAnswer: item.answer !== undefined ? item.answer : item.correctAnswer,
            analysis: item.explanation || item.analysis || '暂无解析',
            recommendedTime: item.recommendedTime || 0,
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
          modules: {},
          modulesCorrect: {} // 新增：记录各模块正确数
        };
        
        // --- 收集错题 and 知识点信息 ---
        const wrongQuestions = [];
        const results = []; // 包含每题的正确性、知识点和技能

        this.questionQueue.forEach(q => {
          // 优先使用题目自带的 type，如果没有则使用当前模块的 type
          let moduleKey = q.type || this.currentModuleType || 'unknown';
          
          // 关键修正：确保中文模块名映射到英文 key，以便后端正确累加到 moduleStats.xxx
          const typeMapping = {
            '言语理解': 'verbal',
            '数量关系': 'quantitative',
            '判断推理': 'reasoning',
            '资料分析': 'dataAnalysis',
            '常识判断': 'commonSense',
            '政治理论': 'politics',
            '时政聚焦': 'politics',
            '时政热点': 'politics',
            '政治理解': 'politics',
            'politics': 'politics'
          };
          
          if (typeMapping[moduleKey]) {
            moduleKey = typeMapping[moduleKey];
          }

          if (!stats.modules[moduleKey]) stats.modules[moduleKey] = 0;
          stats.modules[moduleKey]++;

          const isCorrect = q.userAnswer === q.correctAnswer;
          
          // 收集详细知识点统计
          results.push({
            id: q._id,
            knowledgePoint: q.knowledgePoint || q.category || '未分类',
            skill: q.skill || (q.knowledgePoint ? '综合分析' : '基础知识'),
            isCorrect: isCorrect,
            moduleType: moduleKey
          });

          // 记录正确数
          if (isCorrect) {
            stats.totalCorrect++;
            if (!stats.modulesCorrect[moduleKey]) stats.modulesCorrect[moduleKey] = 0;
            stats.modulesCorrect[moduleKey]++;
          } else {
            // 只要做了（不管是选错还是未选），都进入错题集或记录
            // 如果 userAnswer 为 null，说明是跳过的，也算错
            wrongQuestions.push({
              id: q._id,
              moduleType: moduleKey,
              userAnswer: q.userAnswer === null ? -1 : q.userAnswer // -1 表示未作答
            });
          }
        });

        // 2. 异步上传到云端（不阻塞用户看解析）
        uniCloud.callFunction({
          name: 'updateUserProgress',
          data: {
            userId: userId,
            stats: stats,
            results: results, // 传入逐题结果
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
        const { result } = await uniCloud.callFunction({
          name: 'toggleCollection',
          data: {
            userId: userId,
            questionId: q._id,
            action: 'check'
          }
        });
        if (result.code === 0) {
          this.isCollected = result.isCollected;
        }
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
      if (!q) return;

      try {
        const { result } = await uniCloud.callFunction({
          name: 'toggleCollection',
          data: {
            userId: userId,
            questionId: q._id,
            moduleType: q.type || this.currentModuleType || 'unknown',
            action: 'toggle'
          }
        });

        if (result.code === 0) {
          this.isCollected = result.isCollected;
          uni.vibrateShort();
          uni.showToast({
            title: result.isCollected ? '收藏成功' : '取消收藏',
            icon: 'success'
          });
        } else {
          uni.showToast({ title: result.message || '操作失败', icon: 'none' });
        }
      } catch (e) {
        console.error('切换收藏状态失败', e);
        uni.showToast({ title: '网络异常', icon: 'none' });
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