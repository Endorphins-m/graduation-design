<template>
  <view class="profile-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <u-avatar :src="userInfo.avatar" size="120" bg-color="#2E5BFF"></u-avatar>
        <view class="user-details">
          <text class="username">{{ userInfo.username }}</text>
          <view class="user-badges">
            <u-tag :text="'Lv.' + userInfo.level" type="primary" size="mini" mode="dark"></u-tag>
            <u-tag :text="userInfo.title" type="warning" mode="light" size="mini"></u-tag>
          </view>
          <view class="streak-box">
            <u-icon name="fire-fill" color="#FF4D4F" size="32"></u-icon>
            <text class="streak">连续打卡 {{ userInfo.streak }} 天</text>
          </view>
        </view>
        <u-icon name="setting-fill" color="#FFFFFF" size="48" @click="goSettings"></u-icon>
      </view>
      
      <view class="user-stats">
        <view class="stat-box">
          <text class="stat-num">{{ userInfo.totalQuestions }}</text>
          <text class="stat-label">总刷题</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-box">
          <text class="stat-num">{{ userInfo.accuracy }}%</text>
          <text class="stat-label">正确率</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-box">
          <text class="stat-num">{{ userInfo.studyHours }}h</text>
          <text class="stat-label">学习时长</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-box">
          <text class="stat-num">{{ userInfo.avgDaily }}m</text>
          <text class="stat-label">日均学习</text>
        </view>
      </view>
    </view>
    
    <!-- 能力画像雷达图 -->
    <view class="ability-card card">
      <view class="card-header">
        <view class="header-left">
          <text class="card-title">能力画像</text>
          <u-icon name="question-circle" color="#9CA3AF" size="32" @click="showAbilityHelp"></u-icon>
        </view>
        <text class="update-info">下次全量更新: {{ nextUpdate }}</text>
      </view>
      
      <view class="radar-wrapper">
        <ability-radar 
          :data="abilityData" 
          :size="320"
          @regionClick="onRadarRegionClick"
        ></ability-radar>
      </view>
      
      <view class="radar-legend">
        <view class="legend-item">
          <view class="legend-color weak"></view>
          <text class="legend-text">薄弱 (<60分)</text>
        </view>
        <view class="legend-item">
          <view class="legend-color base"></view>
          <text class="legend-text">基础 (60-80分)</text>
        </view>
        <view class="legend-item">
          <view class="legend-color strong"></view>
          <text class="legend-text">良好 (>80分)</text>
        </view>
      </view>
      
      <text class="radar-hint">点击雷达图区域可手动修正能力评估</text>
    </view>
    
    <!-- 详细能力数据 -->
    <view class="detail-ability card">
      <view class="card-header">
        <text class="card-title">详细数据</text>
        <view class="header-right">
          <text class="auto-label">自动更新</text>
          <u-switch v-model="autoUpdate" active-color="#2E5BFF" size="36"></u-switch>
        </view>
      </view>
      
      <view class="ability-list">
        <view 
          v-for="(item, index) in abilityDetails" 
          :key="index"
          class="ability-item"
          :class="{ 'expanded': expandedIndex === index }"
        >
          <!-- 主要信息行 -->
          <view class="ability-main" @click="toggleExpand(index)">
            <view class="ability-icon" :class="getStatusBgClass(item.score)">
              <text class="icon-text">{{ item.icon }}</text>
            </view>
            
            <view class="ability-content">
              <view class="ability-header">
                <view class="name-row">
                  <text class="name">{{ item.name }}</text>
                  <view class="status-tag" :class="getStatusClass(item.score)">
                    {{ getStatusText(item.score) }}
                  </view>
                </view>
                <text class="ability-score" :class="getScoreClass(item.score)">
                  {{ item.score }}分
                </text>
              </view>
              
              <!-- 进度条 -->
              <view class="score-progress">
                <view 
                  class="progress-fill" 
                  :class="getStatusClass(item.score)"
                  :style="{ width: item.score + '%' }"
                ></view>
              </view>
              
              <!-- 关键指标 -->
              <view class="key-metrics">
                <text class="metric">正确率 {{ item.correctRate }}%</text>
                <text class="metric">平均 {{ item.avgTime }}秒/题</text>
                <text class="metric trend" :class="item.trend">
                  {{ item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→' }} {{ item.change }}%
                </text>
              </view>
            </view>
            
            <u-icon 
              :name="expandedIndex === index ? 'arrow-up' : 'arrow-down'" 
              color="#9CA3AF" 
              size="32"
            ></u-icon>
          </view>
          
          <!-- 展开详情 -->
          <view v-if="expandedIndex === index" class="ability-detail">
            <!-- 详细指标 -->
            <view class="detail-metrics">
              <view class="detail-metric">
                <text class="label">练习次数</text>
                <text class="value">{{ item.practiceCount }}次</text>
              </view>
              <view class="detail-metric">
                <text class="label">累计用时</text>
                <text class="value">{{ item.totalTime }}分钟</text>
              </view>
              <view class="detail-metric">
                <text class="label">最近练习</text>
                <text class="value">{{ item.lastPractice }}</text>
              </view>
            </view>
            
            <!-- 能力分析 -->
            <view class="ability-analysis">
              <text class="analysis-title">能力分析</text>
              <text class="analysis-text">{{ item.analysis }}</text>
            </view>
            
            <!-- 手动修正操作 -->
            <view class="manual-actions">
              <text class="actions-title">手动修正 (优先级高于自动计算)</text>
              <view class="action-btns">
                <u-button 
                  :type="item.manualOverride === 'mastered' ? 'success' : 'default'"
                  size="mini"
                  @click="setManualOverride(item, 'mastered')"
                >
                  ✓ 已掌握
                </u-button>
                <u-button 
                  :type="item.manualOverride === 'weak' ? 'error' : 'default'"
                  size="mini"
                  @click="setManualOverride(item, 'weak')"
                >
                  ! 仍薄弱
                </u-button>
                <u-button 
                  :type="item.manualOverride === 'ignore' ? 'warning' : 'default'"
                  size="mini"
                  @click="setManualOverride(item, 'ignore')"
                >
                  ✕ 不感兴趣
                </u-button>
                <u-button 
                  v-if="item.manualOverride"
                  type="info"
                  size="mini"
                  plain
                  @click="clearOverride(item)"
                >
                  清除标记
                </u-button>
              </view>
            </view>
            
            <!-- 快捷操作 -->
            <view class="quick-actions">
              <u-button 
                type="primary" 
                size="medium"
                shape="circle"
                @click="startPractice(item)"
              >
                开始练习
              </u-button>
              <u-button 
                type="info" 
                size="medium"
                shape="circle"
                plain
                @click="viewHistory(item)"
              >
                练习记录
              </u-button>
            </view>
          </view>
          
          <!-- 手动标记提示 -->
          <view v-if="item.manualOverride" class="override-banner" :class="item.manualOverride">
            <u-icon name="info-circle-fill" size="28"></u-icon>
            <text class="banner-text">
              手动标记: {{ getOverrideText(item.manualOverride) }} | 系统将根据此标记调整推荐策略
            </text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 学习统计图表 -->
    <view class="statistics-card card">
      <view class="card-header">
        <text class="card-title">学习统计</text>
        <u-tabs 
          :list="timeRanges" 
          :current="currentRange"
          @change="changeTimeRange"
          height="60"
          font-size="24"
          active-color="#2E5BFF"
        ></u-tabs>
      </view>
      
      <!-- 学习趋势图 -->
      <view class="trend-chart">
        <view class="chart-y-axis">
          <text v-for="n in 5" :key="n" class="y-label">{{ (5-n+1)*20 }}</text>
        </view>
        <view class="chart-content">
          <view 
            v-for="(point, index) in trendData" 
            :key="index"
            class="chart-bar"
            :style="{ height: point.score + '%' }"
          >
            <view class="bar-tooltip">{{ point.score }}分</view>
          </view>
        </view>
        <view class="chart-x-axis">
          <text v-for="(point, index) in trendData" :key="index" class="x-label">
            {{ point.date }}
          </text>
        </view>
      </view>
      
      <!-- 统计摘要 -->
      <view class="stats-summary">
        <view class="summary-item">
          <text class="summary-value">{{ rangeStats.totalQuestions }}</text>
          <text class="summary-label">刷题总数</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ rangeStats.avgScore }}</text>
          <text class="summary-label">平均分</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ rangeStats.improvement }}%</text>
          <text class="summary-label">提升幅度</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">{{ rangeStats.studyDays }}</text>
          <text class="summary-label">学习天数</text>
        </view>
      </view>
    </view>
    
    <!-- 功能入口 -->
    <view class="feature-grid card">
      <view 
        v-for="(feature, index) in features" 
        :key="index"
        class="feature-item"
        @click="handleFeature(feature)"
      >
        <view class="feature-icon" :style="{ background: feature.bgColor }">
          <u-icon :name="feature.icon" color="#FFFFFF" size="44"></u-icon>
        </view>
        <text class="feature-name">{{ feature.name }}</text>
        <text v-if="feature.badge" class="feature-badge">{{ feature.badge }}</text>
      </view>
    </view>
    
    <!-- 底部操作 -->
    <view class="bottom-actions">
      <u-button type="error" plain shape="circle" @click="logout">
        退出登录
      </u-button>
    </view>
    
    <!-- 能力修正弹窗 -->
    <u-popup v-model="showEditModal" mode="center" border-radius="16" width="80%">
      <view class="edit-modal">
        <view class="modal-header">
          <text class="modal-title">修正 {{ editingAbility ? editingAbility.name : '' }} 能力评估</text>
          <text class="modal-subtitle">当前系统评估: {{ editingAbility ? editingAbility.score : 0 }}分</text>
        </view>
        
        <view class="score-slider">
          <text class="slider-label">您认为的实际水平:</text>
          <u-slider 
            v-model="editScore" 
            min="0" 
            max="100" 
            step="5"
            active-color="#2E5BFF"
            block-width="40"
          ></u-slider>
          <text class="slider-value">{{ editScore }}分</text>
        </view>
        
        <view class="edit-reason">
          <text class="reason-label">修正原因:</text>
          <u-radio-group v-model="editReason">
            <u-radio 
              v-for="(reason, index) in editReasons" 
              :key="index"
              :name="reason.value"
            >
              {{ reason.label }}
            </u-radio>
          </u-radio-group>
        </view>
        
        <view class="modal-actions">
          <u-button type="info" plain @click="showEditModal = false">取消</u-button>
          <u-button type="primary" @click="confirmEdit">确认修正</u-button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import AbilityRadar from '@/components/ability-radar.vue'

export default {
  components: { AbilityRadar },
  
  data() {
    return {
      // 用户信息
      userInfo: {
        username: '马鑫',
        avatar: '',
        level: 5,
        title: '备考达人',
        streak: 12,
        totalQuestions: 342,
        accuracy: 67,
        studyHours: 28,
        avgDaily: 45
      },
      
      // 自动更新开关
      autoUpdate: true,
      nextUpdate: '3天后',
      
      // 能力数据 (0-100分)
      abilityData: {
        verbal: 75,
        quantitative: 45,
        reasoning: 68,
        dataAnalysis: 52,
        commonSense: 60
      },
      
      // 详细能力数据
      abilityDetails: [
        {
          name: '数量关系',
          icon: '📊',
          score: 45,
          correctRate: 52,
          avgTime: 68,
          trend: 'up',
          change: 5,
          practiceCount: 45,
          totalTime: 52,
          lastPractice: '2小时前',
          analysis: '基础薄弱，建议加强方程法和速算技巧训练。近期有提升趋势，继续保持。',
          manualOverride: null,
          typeKey: 'quantitative'
        },
        {
          name: '言语理解',
          icon: '📝',
          score: 75,
          correctRate: 78,
          avgTime: 35,
          trend: 'stable',
          change: 0,
          practiceCount: 68,
          totalTime: 40,
          lastPractice: '昨天',
          analysis: '基础扎实，逻辑填空部分表现优秀。可适度减少推送，专注提升片段阅读速度。',
          manualOverride: null,
          typeKey: 'verbal'
        },
        {
          name: '判断推理',
          icon: '🧩',
          score: 68,
          correctRate: 71,
          avgTime: 42,
          trend: 'up',
          change: 8,
          analysis: '图形推理部分进步明显，逻辑判断需加强。建议增加论证分析类题目练习。',
          manualOverride: null,
          typeKey: 'reasoning'
        },
        {
          name: '资料分析',
          icon: '📈',
          score: 52,
          correctRate: 58,
          avgTime: 85,
          trend: 'down',
          change: 3,
          analysis: '计算速度偏慢，建议专项训练速算技巧。注意审题准确性，减少粗心失误。',
          manualOverride: 'weak',
          typeKey: 'dataAnalysis'
        },
        {
          name: '常识判断',
          icon: '🌍',
          score: 60,
          correctRate: 62,
          avgTime: 25,
          trend: 'up',
          change: 2,
          analysis: '时政热点掌握较好，法律常识需补充。建议关注近期重要会议和政策文件。',
          manualOverride: null,
          typeKey: 'commonSense'
        }
      ],
      
      expandedIndex: null,
      
      // 时间范围
      timeRanges: [
        { name: '本周' },
        { name: '本月' },
        { name: '全部' }
      ],
      currentRange: 0,
      
      // 趋势数据
      trendData: [
        { date: '周一', score: 58 },
        { date: '周二', score: 62 },
        { date: '周三', score: 60 },
        { date: '周四', score: 65 },
        { date: '周五', score: 63 },
        { date: '周六', score: 68 },
        { date: '周日', score: 67 }
      ],
      
      rangeStats: {
        totalQuestions: 86,
        avgScore: 63,
        improvement: 12,
        studyDays: 5
      },
      
      // 功能入口
      features: [
        { name: '错题本', icon: 'file-text-fill', bgColor: '#FF4D4F', badge: '12', path: '/pages/wrong-book/index' },
        { name: '收藏夹', icon: 'star-fill', bgColor: '#FAAD14', badge: '8', path: '/pages/favorites/index' },
        { name: '练习记录', icon: 'calendar-fill', bgColor: '#2E5BFF', path: '/pages/history/index' },
        { name: '学习设置', icon: 'setting-fill', bgColor: '#52C41A', path: '/pages/settings/index' },
        { name: '能力测评', icon: 'file-text-fill', bgColor: '#722ED1', path: '/pages/assessment/index' },
        { name: '帮助反馈', icon: 'question-circle-fill', bgColor: '#13C2C2', path: '/pages/help/index' }
      ],
      
      // 编辑弹窗
      showEditModal: false,
      editingAbility: null,
      editScore: 50,
      editReason: '',
      editReasons: [
        { label: '系统评估偏高', value: 'overestimate' },
        { label: '系统评估偏低', value: 'underestimate' },
        { label: '近期状态波动', value: 'fluctuation' },
        { label: '其他原因', value: 'other' }
      ]
    }
  },
  
  onShow() {
    this.loadUserData()
  },
  
  methods: {
    // 加载用户数据
    async loadUserData() {
      const userId = uni.getStorageSync('userId');
      if (!userId) {
        uni.navigateTo({ url: '/pages/login/login' });
        return;
      }

      uni.showLoading({ title: '加载中...' });
      try {
        const { result } = await uniCloud.callFunction({
          name: 'getUserStudyStats',
          data: { userId }
        });

        if (result && result.code === 0) {
          const { data } = result;
          // 1. 更新顶部统计卡片（使用云函数返回的完整用户信息）
          this.userInfo = {
            username: data.nickname || data.username || '学霸君',
            avatar: data.avatar || '',
            level: data.level || 1,
            title: data.title || '备考萌新',
            streak: data.studyDays || 0,
            totalQuestions: data.totalQuestions || 0,
            accuracy: data.accuracy || 0,
            studyHours: data.studyHours || 0,
            avgDaily: data.avgDaily || 0
          };

          // 2. 更新功能入口角标（错题和收藏）
          this.$set(this.features[0], 'badge', data.wrongCount.toString());
          this.$set(this.features[1], 'badge', data.collectCount.toString());

          // 3. 更新雷达图与详细能力数据
          this.renderStatsData(data);
        } else {
          uni.showToast({ title: result.message || '加载失败', icon: 'none' });
        }
      } catch (e) {
        console.error('加载用户数据失败', e);
        uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },
    
    renderStatsData(data) {
      const stats = data.moduleStats || {};
      
      // 简单算法：根据做题数模拟能力分（基础40 + 做题权重，上限100）
      const calculateScore = (done) => Math.min(40 + (done * 2), 100);

      const moduleScores = {
        verbal: calculateScore(stats.verbal || 0),
        quantitative: calculateScore(stats.quantitative || 0),
        reasoning: calculateScore(stats.reasoning || 0),
        dataAnalysis: calculateScore(stats.dataAnalysis || 0),
        commonSense: calculateScore(stats.commonSense || 0),
        politics: calculateScore(stats.politics || 0)
      };

      this.abilityData = moduleScores;
      
      // 更新下方详细能力列表
      this.abilityDetails.forEach(item => {
        const done = stats[item.typeKey] || 0;
        item.score = moduleScores[item.typeKey];
        item.practiceCount = done;
      });
    },

    // 展开/收起详情
    toggleExpand(index) {
      this.expandedIndex = this.expandedIndex === index ? null : index
    },
    
    // 获取状态样式
    getStatusClass(score) {
      if (score < 60) return 'weak'
      if (score < 80) return 'base'
      return 'strong'
    },
    
    getStatusBgClass(score) {
      if (score < 60) return 'weak-bg'
      if (score < 80) return 'base-bg'
      return 'strong-bg'
    },
    
    getStatusText(score) {
      if (score < 60) return '薄弱'
      if (score < 80) return '基础'
      return '良好'
    },
    
    getScoreClass(score) {
      if (score < 60) return 'weak-text'
      if (score < 80) return 'base-text'
      return 'strong-text'
    },
    
    getOverrideText(type) {
      const map = {
        'mastered': '已掌握 - 减少推送',
        'weak': '仍薄弱 - 加强训练',
        'ignore': '不感兴趣 - 暂不推荐'
      }
      return map[type] || type
    },
    
    // 雷达图区域点击
    onRadarRegionClick(type) {
      const abilityMap = {
        'verbal': '言语理解',
        'quantitative': '数量关系',
        'reasoning': '判断推理',
        'dataAnalysis': '资料分析',
        'commonSense': '常识判断'
      }
      
      const abilityName = abilityMap[type]
      const ability = this.abilityDetails.find(a => a.name === abilityName)
      
      if (ability) {
        this.openEditModal(ability)
      }
    },
    
    // 打开修正弹窗
    openEditModal(ability) {
      this.editingAbility = ability
      this.editScore = ability.score
      this.showEditModal = true
    },
    
    // 确认修正
    async confirmEdit() {
      if (!this.editReason) {
        uni.showToast({ title: '请选择修正原因', icon: 'none' })
        return
      }
      
      const userId = uni.getStorageSync('userId');
      if (!userId) return;

      try {
        const db = uniCloud.database();
        const updateObj = {};
        updateObj[`profile.${this.editingAbility.typeKey}`] = this.editScore;
        
        await db.collection('users').doc(userId).update(updateObj);
        
        // 更新本地数据
        this.editingAbility.score = this.editScore
        this.abilityData[this.editingAbility.typeKey] = this.editScore
        
        uni.showToast({ title: '能力评估已更新', icon: 'success' })
        this.showEditModal = false
      } catch (e) {
        uni.showToast({ title: '更新失败', icon: 'none' })
      }
    },
    
    // 设置手动覆盖
    async setManualOverride(item, type) {
      item.manualOverride = type
      const userId = uni.getStorageSync('userId');
      if (!userId) return;

      try {
        const db = uniCloud.database();
        const updateObj = {};
        updateObj[`manualOverrides.${item.typeKey}`] = type;
        
        await db.collection('users').doc(userId).update(updateObj);
        
        uni.showToast({ 
          title: type === 'mastered' ? '已标记为掌握' : type === 'weak' ? '已标记为薄弱' : '已减少推荐',
          icon: 'none'
        })
      } catch (e) {
        console.error('设置失败', e)
      }
    },
    
    // 清除覆盖
    async clearOverride(item) {
      item.manualOverride = null
      const userId = uni.getStorageSync('userId');
      if (!userId) return;

      try {
        const db = uniCloud.database();
        const updateObj = {};
        updateObj[`manualOverrides.${item.typeKey}`] = db.command.remove();
        
        await db.collection('users').doc(userId).update(updateObj);
        uni.showToast({ title: '已恢复自动评估', icon: 'none' })
      } catch (e) {
        console.error('清除失败', e)
      }
    },
    
    // 根据覆盖调整计划
    adjustPlanForOverride(item, type) {
      // 实时调整学习计划
      if (type === 'mastered') {
        // 减少该题型推送
        uni.showToast({ title: '系统将减少该题型推送', icon: 'none' })
      } else if (type === 'weak') {
        // 增加该题型推送
        uni.showToast({ title: '系统将加强该题型训练', icon: 'none' })
      }
    },
    
    // 重新生成计划
    regeneratePlan() {
      uniCloud.callFunction({
        name: 'regeneratePlan',
        data: { userId: getApp().globalData.userId }
      })
    },
    
    // 开始练习
    startPractice(item) {
      uni.navigateTo({
        url: `/pages/practice/index?type=${item.typeKey}&count=10&priority=${item.score < 60 ? 'high' : 'medium'}`
      })
    },
    
    // 查看历史
    viewHistory(item) {
      uni.navigateTo({
        url: `/pages/history/index?type=${item.typeKey}`
      })
    },
    
    // 切换时间范围
    changeTimeRange(index) {
      this.currentRange = index
      this.loadTrendData(index)
    },
    
    loadTrendData(range) {
      // 加载不同时间范围的数据
      const ranges = ['week', 'month', 'all']
      // 调用云函数获取数据...
    },
    
    // 功能入口
    handleFeature(feature) {
      if (feature.path) {
        uni.navigateTo({ url: feature.path })
      }
    },
    
    // 其他操作
    goSettings() {
      uni.navigateTo({ url: '/pages/settings/index' })
    },
    
    showAbilityHelp() {
      uni.showModal({
        title: '能力画像说明',
        content: '能力画像基于您的答题正确率(50%)、答题耗时效率(30%)和考点掌握度(20%)加权计算。每周进行一次全量更新，日常基于单题数据增量更新。点击雷达图可手动修正评估。',
        showCancel: false
      })
    },
    
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '退出后将清除本地登录状态',
        confirmColor: '#FF4D4F',
        success: (res) => {
          if (res.confirm) {
            // 清除本地存储
            uni.clearStorageSync();
            // 重定向至登录页
            uni.reLaunch({
              url: '/pages/login/login'
            });
          }
        }
      });
    }
  }
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #F3F4F6;
  padding-bottom: 40rpx;
}

/* 用户卡片 */
.user-card {
  background: linear-gradient(135deg, #2E5BFF 0%, #1E40AF 100%);
  border-radius: 0 0 32rpx 32rpx;
  padding: 40rpx 30rpx;
  color: #FFFFFF;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.user-details {
  flex: 1;
  margin-left: 24rpx;
}

.username {
  font-size: 40rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
}

.user-badges {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.streak-box {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.streak {
  font-size: 26rpx;
  opacity: 0.9;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  padding: 24rpx;
  backdrop-filter: blur(10px);
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.3);
}

/* 通用卡片样式 */
.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1F2937;
}

.update-info {
  font-size: 24rpx;
  color: #9CA3AF;
}

.auto-label {
  font-size: 24rpx;
  color: #6B7280;
}

/* 雷达图区域 */
.radar-wrapper {
  display: flex;
  justify-content: center;
  padding: 20rpx 0;
}

.radar-legend {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  margin-top: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.legend-color {
  width: 24rpx;
  height: 24rpx;
  border-radius: 6rpx;
}

.legend-color.weak {
  background: #FF4D4F;
}

.legend-color.base {
  background: #FAAD14;
}

.legend-color.strong {
  background: #52C41A;
}

.legend-text {
  font-size: 24rpx;
  color: #6B7280;
}

.radar-hint {
  text-align: center;
  font-size: 24rpx;
  color: #9CA3AF;
  margin-top: 20rpx;
  display: block;
}

/* 能力列表 */
.ability-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.ability-item {
  background: #F9FAFB;
  border-radius: 12rpx;
  overflow: hidden;
  transition: all 0.3s;
}

.ability-item.expanded {
  background: #FFFFFF;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.ability-main {
  display: flex;
  align-items: center;
  padding: 24rpx;
}

.ability-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.weak-bg {
  background: #FFF2F0;
}

.base-bg {
  background: #FFF7E6;
}

.strong-bg {
  background: #F6FFED;
}

.icon-text {
  font-size: 40rpx;
}

.ability-content {
  flex: 1;
}

.ability-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.name {
  font-size: 30rpx;
  font-weight: 500;
  color: #1F2937;
}

.status-tag {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.status-tag.weak {
  background: #FFF2F0;
  color: #FF4D4F;
}

.status-tag.base {
  background: #FFF7E6;
  color: #D48806;
}

.status-tag.strong {
  background: #F6FFED;
  color: #389E0D;
}

.ability-score {
  font-size: 32rpx;
  font-weight: bold;
}

.weak-text {
  color: #FF4D4F;
}

.base-text {
  color: #FAAD14;
}

.strong-text {
  color: #52C41A;
}

.score-progress {
  height: 12rpx;
  background: #E5E7EB;
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
}

.progress-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.5s ease;
}

.progress-fill.weak {
  background: #FF4D4F;
}

.progress-fill.base {
  background: #FAAD14;
}

.progress-fill.strong {
  background: #52C41A;
}

.key-metrics {
  display: flex;
  gap: 24rpx;
}

.metric {
  font-size: 24rpx;
  color: #6B7280;
}

.metric.warning {
  color: #FF4D4F;
  font-weight: 500;
}

.metric.trend.up {
  color: #52C41A;
}

.metric.trend.down {
  color: #FF4D4F;
}

/* 展开详情 */
.ability-detail {
  padding: 0 24rpx 24rpx;
  border-top: 2rpx solid #E5E7EB;
  margin-top: 20rpx;
  padding-top: 20rpx;
}

.detail-metrics {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24rpx;
}

.detail-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.detail-metric .label {
  font-size: 24rpx;
  color: #9CA3AF;
}

.detail-metric .value {
  font-size: 28rpx;
  color: #1F2937;
  font-weight: 500;
}

.ability-analysis {
  background: #E8EFFF;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}

.analysis-title {
  font-size: 26rpx;
  font-weight: 500;
  color: #2E5BFF;
  margin-bottom: 12rpx;
  display: block;
}

.analysis-text {
  font-size: 26rpx;
  color: #1F2937;
  line-height: 1.6;
}

.manual-actions {
  margin-bottom: 24rpx;
}

.actions-title {
  font-size: 26rpx;
  color: #6B7280;
  margin-bottom: 16rpx;
  display: block;
}

.action-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.quick-actions {
  display: flex;
  gap: 20rpx;
  justify-content: center;
}

/* 手动标记横幅 */
.override-banner {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  margin-top: 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.override-banner.mastered {
  background: #F6FFED;
  color: #389E0D;
}

.override-banner.weak {
  background: #FFF2F0;
  color: #CF1322;
}

.override-banner.ignore {
  background: #FFF7E6;
  color: #D48806;
}

.banner-text {
  flex: 1;
}

/* 统计图表 */
.trend-chart {
  margin: 30rpx 0;
  padding: 20rpx;
  background: #F9FAFB;
  border-radius: 12rpx;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 200rpx;
  position: absolute;
  left: 20rpx;
}

.y-label {
  font-size: 20rpx;
  color: #9CA3AF;
}

.chart-content {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200rpx;
  margin-left: 60rpx;
  padding-bottom: 40rpx;
  border-bottom: 2rpx solid #E5E7EB;
}

.chart-bar {
  width: 60rpx;
  background: linear-gradient(to top, #2E5BFF, #60A5FA);
  border-radius: 8rpx 8rpx 0 0;
  position: relative;
  transition: height 0.5s ease;
}

.bar-tooltip {
  position: absolute;
  top: -40rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #1F2937;
  color: #FFFFFF;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  opacity: 0;
  transition: opacity 0.3s;
}

.chart-bar:hover .bar-tooltip {
  opacity: 1;
}

.chart-x-axis {
  display: flex;
  justify-content: space-around;
  margin-left: 60rpx;
  margin-top: 12rpx;
}

.x-label {
  font-size: 22rpx;
  color: #6B7280;
}

.stats-summary {
  display: flex;
  justify-content: space-around;
  padding-top: 30rpx;
  border-top: 2rpx solid #E5E7EB;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.summary-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #2E5BFF;
}

.summary-label {
  font-size: 24rpx;
  color: #6B7280;
}

/* 功能网格 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30rpx;
  padding: 30rpx;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  position: relative;
}

.feature-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
}

.feature-name {
  font-size: 26rpx;
  color: #1F2937;
}

.feature-badge {
  position: absolute;
  top: -8rpx;
  right: 20rpx;
  background: #FF4D4F;
  color: #FFFFFF;
  font-size: 20rpx;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

/* 底部操作 */
.bottom-actions {
  padding: 30rpx;
}

/* 编辑弹窗 */
.edit-modal {
  padding: 40rpx;
}

.modal-header {
  text-align: center;
  margin-bottom: 40rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1F2937;
  display: block;
  margin-bottom: 12rpx;
}

.modal-subtitle {
  font-size: 28rpx;
  color: #6B7280;
}

.score-slider {
  margin-bottom: 40rpx;
}

.slider-label {
  font-size: 28rpx;
  color: #1F2937;
  margin-bottom: 20rpx;
  display: block;
}

.slider-value {
  text-align: center;
  font-size: 48rpx;
  font-weight: bold;
  color: #2E5BFF;
  margin-top: 20rpx;
  display: block;
}

.edit-reason {
  margin-bottom: 40rpx;
}

.reason-label {
  font-size: 28rpx;
  color: #1F2937;
  margin-bottom: 20rpx;
  display: block;
}

.modal-actions {
  display: flex;
  gap: 20rpx;
}

.modal-actions u-button {
  flex: 1;
}
</style>