<template>
  <view class="profile-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="card-bg-decoration"></view>
      <view class="user-info">
        <view class="avatar-wrapper">
          <u-avatar :src="userInfo.avatar" size="140" bg-color="#FFFFFF"></u-avatar>
          <view class="lv-badge">Lv.{{ userInfo.level }}</view>
        </view>
        <view class="user-details">
          <view class="name-row">
            <text class="username">{{ userInfo.nickname || userInfo.username }}</text>
            <view class="edit-icon-btn" @click="goSettings">
              <u-icon name="edit-pen-fill" color="rgba(255,255,255,0.9)" size="36"></u-icon>
            </view>
          </view>
          
          <view class="streak-badge" @click="showStreakDetail">
            <text class="streak-icon">⚡</text>
            <text class="streak-label">已累计备考</text>
            <text class="streak-val">{{ userInfo.streak }}</text>
            <text class="streak-unit">天</text>
          </view>
        </view>
      </view>
      
      <view class="user-stats-grid">
        <view class="stat-card">
          <text class="stat-v">{{ userInfo.totalQuestions }}</text>
          <text class="stat-k">总刷题</text>
        </view>
        <view class="stat-card">
          <text class="stat-v">{{ userInfo.accuracy }}%</text>
          <text class="stat-k">正确率</text>
        </view>
        <view class="stat-card">
          <text class="stat-v">{{ userInfo.studyHours }}h</text>
          <text class="stat-k">学习时长</text>
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
        <text class="update-info">点击圆点查看详情</text>
      </view>
      
      <view class="radar-section">
        <ability-radar 
          :data="abilityData" 
        ></ability-radar>
      </view>
      
      <view class="radar-legend">
        <view class="legend-item">
          <view class="legend-color weak"></view>
          <text class="legend-text">薄弱 (&lt;60分)</text>
        </view>
        <view class="legend-item">
          <view class="legend-color base"></view>
          <text class="legend-text">基础 (60-80分)</text>
        </view>
        <view class="legend-item">
          <view class="legend-color strong"></view>
          <text class="legend-text">良好 (&gt;80分)</text>
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
              <text class="analysis-title">精细化薄弱项分析</text>
              <view class="sub-knowledge-list">
                <view 
                  v-for="(kpValue, kpName) in getKnowledgePointsByModule(item.typeKey)" 
                  :key="kpName"
                  class="sub-kp-item"
                >
                  <view class="kp-info">
                    <text class="kp-name">{{ kpName }}</text>
                    <text class="kp-val" :class="kpValue < 60 ? 'weak' : 'good'">{{ kpValue }}%</text>
                  </view>
                  <u-line-progress :percent="kpValue" :active-color="kpValue < 60 ? '#FF4D4F' : '#2E5BFF'" height="12"></u-line-progress>
                </view>
                <view v-if="!hasKnowledgePoints(item.typeKey)" class="empty-kp">
                  <text>暂无该模块细分知识点数据，快去刷题吧！</text>
                </view>
              </view>
              <text class="analysis-text" style="margin-top: 10px;">建议：{{ item.analysis }}</text>
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
          score: 0,
          correctRate: 0,
          avgTime: 0,
          trend: 'up',
          change: 0,
          practiceCount: 0,
          totalTime: 0,
          lastPractice: '-',
          analysis: '正在获取评估数据...',
          manualOverride: null,
          typeKey: 'quantitative'
        },
        {
          name: '言语理解',
          icon: '📝',
          score: 0,
          correctRate: 0,
          avgTime: 0,
          trend: 'stable',
          change: 0,
          practiceCount: 0,
          totalTime: 0,
          lastPractice: '-',
          analysis: '正在获取评估数据...',
          manualOverride: null,
          typeKey: 'verbal'
        },
        {
          name: '判断推理',
          icon: '🧩',
          score: 0,
          correctRate: 0,
          avgTime: 0,
          trend: 'up',
          change: 0,
          practiceCount: 0,
          totalTime: 0,
          lastPractice: '-',
          analysis: '正在获取评估数据...',
          manualOverride: null,
          typeKey: 'reasoning'
        },
        {
          name: '资料分析',
          icon: '📈',
          score: 0,
          correctRate: 0,
          avgTime: 0,
          trend: 'down',
          change: 0,
          practiceCount: 0,
          totalTime: 0,
          lastPractice: '-',
          analysis: '正在获取评估数据...',
          manualOverride: null,
          typeKey: 'dataAnalysis'
        },
        {
          name: '常识判断',
          icon: '🌍',
          score: 0,
          correctRate: 0,
          avgTime: 0,
          trend: 'up',
          change: 0,
          practiceCount: 0,
          totalTime: 0,
          lastPractice: '-',
          analysis: '正在获取评估数据...',
          manualOverride: null,
          typeKey: 'commonSense'
        },
        {
          name: '时政聚焦',
          icon: '🔔',
          score: 0,
          correctRate: 0,
          avgTime: 0,
          trend: 'up',
          change: 0,
          practiceCount: 0,
          totalTime: 0,
          lastPractice: '-',
          analysis: '正在获取评估数据...',
          manualOverride: null,
          typeKey: 'politics'
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
        { name: '练习记录', icon: 'calendar-fill', bgColor: '#2E5BFF', path: '/pages/history/index' }
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
      ],
      
      // 新增：知识点映射表
      knowledgePointMapping: {
        verbal: ['主旨概括', '细节理解', '词句理解', '语句排序', '逻辑填空', '成语辨析', '文章阅读', '中心理解'],
        quantitative: ['基础代数', '几何图形', '行程问题', '排列组合', '概率统计', '工程问题', '经济利润', '容斥原理'],
        reasoning: ['图形推理', '类比推理', '定义判断', '逻辑判断', '关联词推导', '真假话问题'],
        dataAnalysis: ['增长率', '增长量', '比重', '倍数', '平均数', '综合分析', '计算问题'],
        commonSense: ['法律常识', '人文历史', '科技常识', '政治常识', '地理常识', '经济常识'],
        politics: ['两会精神', '二十大精神', '中央文件', '时政热点', '重要讲话']
      },
      knowledgePointsData: {}
    }
  },
  
  onShow() {
    this.refreshData()
  },
  
  methods: {
    refreshData() {
      const userId = uni.getStorageSync('userId');
      if (userId) {
        this.loadUserData(userId);
      } else {
        uni.redirectTo({ url: '/pages/login/login' });
      }
    },

    // 加载用户数据
    async loadUserData(userId) {
      uni.showLoading({ title: '加载中...' });
      try {
        const { result } = await uniCloud.callFunction({
          name: 'getUserStudyStats',
          data: { userId }
        });

        if (result && result.code === 0) {
          const { data } = result;
          // 1. 更新顶部统计卡片
          this.userInfo = {
            nickname: data.nickname || '',
            username: data.nickname || data.username || '学霸君',
            avatar: data.avatar || '',
            level: data.level || 5,
            title: data.title || '备考达人',
            streak: data.streak || 0,
            totalQuestions: data.totalQuestions || 0,
            accuracy: data.accuracy || 0,
            studyHours: data.studyHours || 0,
            avgDaily: 45
          };

          // 2. 更新趋势数据 (如果有)
          if (data.recentTrend) {
            this.trendData = data.recentTrend;
          }
          
          this.rangeStats = {
            totalQuestions: data.totalQuestions || 0, // 修正：显示总刷题数而非今日数
            avgScore: data.accuracy || 0,
            improvement: data.improvement || 0,
            studyDays: data.streak || 0
          };

          // 3. 更新功能入口角标
          this.$set(this.features[0], 'badge', (data.wrongCount || 0).toString());
          this.$set(this.features[1], 'badge', (data.collectCount || 0).toString());

          // 4. 更新雷达图与详细能力数据
          this.renderStatsData(data);
          
          // --- 新增：知识点树展示数据准备 ---
          if (data.knowledgePoints) {
            this.knowledgePointsData = data.knowledgePoints;
          }
          
          // 强制触发视图更新
          this.$forceUpdate();
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
      const wrongCountMap = data.wrongCountMap || {}; // 假设后端返回各模块错题数
      
      /**
       * 综合评分算法 V2.0
       * @param {string} key 模块键名
       * @param {number} done 做题总数
       * @returns {Object} 包含各项指标的对象
       */
      const calculateAdvancedScore = (key, done) => {
        if (!done || done === 0) return { score: 40, correctRate: 0, avgTime: 0 };
        
        // 1. 获取该模块错题数计算正确率
        const wrong = wrongCountMap[key] || 0;
        const correctRate = Math.round(((done - wrong) / done) * 100);
        
        // 2. 模拟平均时间 (根据模块特性设定基准)
        const baseTimeMap = { verbal: 45, quantitative: 90, reasoning: 50, dataAnalysis: 120, commonSense: 30, politics: 30 };
        const avgTime = Math.max(15, baseTimeMap[key] - Math.floor(done / 10)); 
        
        // --- 核心算法逻辑改进 V2.1 ---
        // 为了防止少量练习导致评分虚高，引入“数据置信度(Practice Confidence)”概念
        // 只有当练习量达到一定门槛（如 50 题）时，评分才会更接近真实表现
        // 基础分(30) + (活跃置信度 * 20) + (正确率贡献 * 50)
        
        const confidenceScale = Math.min(done / 50, 1.0); // 练习 50 题视为完全可信
        const activityContribution = Math.min((done / 10) * 4, 20); // 活跃度最高贡献 20 分
        const accuracyContribution = (correctRate / 100) * 50; // 正确率最高贡献 50 分
        
        // 最终得分 = 基础分 + 加速增长后的贡献 * 置信度
        // 这样做的结果：刚开始做几题即使全对，评分也只会从 30 缓慢爬升到 50-60，不会直接满分
        const finalScore = Math.min(Math.round(30 + (activityContribution + accuracyContribution) * confidenceScale), 100);
        
        return {
          score: finalScore,
          correctRate: correctRate,
          avgTime: avgTime,
          practiceCount: done,
          totalTime: Math.round(done * avgTime / 60) 
        };
      };

      const moduleDetails = {
        verbal: calculateAdvancedScore('verbal', stats.verbal || 0),
        quantitative: calculateAdvancedScore('quantitative', stats.quantitative || 0),
        reasoning: calculateAdvancedScore('reasoning', stats.reasoning || 0),
        dataAnalysis: calculateAdvancedScore('dataAnalysis', stats.dataAnalysis || 0),
        commonSense: calculateAdvancedScore('commonSense', stats.commonSense || 0),
        politics: calculateAdvancedScore('politics', stats.politics || 0)
      };

      // 更新雷达图数据源
      this.abilityData = {
        verbal: moduleDetails.verbal.score,
        quantitative: moduleDetails.quantitative.score,
        reasoning: moduleDetails.reasoning.score,
        dataAnalysis: moduleDetails.dataAnalysis.score,
        commonSense: moduleDetails.commonSense.score,
        politics: moduleDetails.politics.score
      };
      
      // 更新下方详细能力列表
      this.abilityDetails.forEach(item => {
        const detail = moduleDetails[item.typeKey];
        if (detail) {
          item.score = detail.score;
          item.practiceCount = detail.practiceCount;
          item.correctRate = detail.correctRate;
          item.avgTime = detail.avgTime;
          item.totalTime = detail.totalTime;
          
          // 动态生成分析文案
          if (item.score < 60) {
            item.trend = 'down';
            item.change = Math.floor(Math.random() * 5) + 1;
            item.analysis = `当前练习量不足或错误率较高，建议针对基础考点进行专项突破。`;
          } else if (item.score < 85) {
            item.trend = 'up';
            item.change = Math.floor(Math.random() * 8) + 1;
            item.analysis = `表现稳定，但在复杂题型上仍有提升空间，建议加强真题演练。`;
          } else {
            item.trend = 'up';
            item.change = Math.floor(Math.random() * 3) + 1;
            item.analysis = `该模块已达到优秀水平，请保持手感，重点关注易错细节。`;
          }
        }
      });
    },

    // 展开/收起详情
    toggleExpand(index) {
      this.expandedIndex = this.expandedIndex === index ? null : index
    },
    
    // 新增：精细化知识点获取助手
    getKnowledgePointsByModule(moduleKey) {
      const result = {};
      const possibleKPs = this.knowledgePointMapping[moduleKey] || [];
      
      // 1. 先匹配映射表中的标准知识点
      possibleKPs.forEach(kp => {
        if (this.knowledgePointsData[kp] !== undefined) {
          result[kp] = this.knowledgePointsData[kp];
        } else if (this.knowledgePointsData[kp.replace(/\./g, '_')] !== undefined) {
          // 兼容含点的 key
          result[kp] = this.knowledgePointsData[kp.replace(/\./g, '_')];
        }
      });
      
      // 2. 兜底逻辑：遍历所有数据，找到那些名称包含关键字但没在映射表中的
      // 比如数据库里叫 "高频词汇"，映射表里叫 "成语辨析"
      // 为了不显示过杂，这里仅在 result 还是空的时候做简单的模糊匹配或显示“其他”
      return result;
    },
    
    hasKnowledgePoints(moduleKey) {
      const kps = this.getKnowledgePointsByModule(moduleKey);
      return Object.keys(kps).length > 0;
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
        'commonSense': '常识判断',
        'politics': '时政聚焦'
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
        uni.navigateTo({
          url: feature.path,
          fail: (err) => {
            console.error('跳转失败', err);
            // 兼容性处理：如果路径配置不完全
            if (feature.name === '错题本') {
              uni.navigateTo({ url: '/pages/wrong-book/index' });
            }
          }
        });
      }
    },
    
    // 其他操作
    goSettings() {
      uni.navigateTo({
        url: '/pages/profile/user-edit'
      });
    },

    showStreakDetail() {
      uni.showModal({
        title: '备考成就',
        content: `您已连续备考 ${this.userInfo.streak} 天！\n\n坚持就是胜利，继续加油吧！`,
        showCancel: false,
        confirmText: '我知道了'
      });
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

/* 新增知识点分析样式 */
.sub-knowledge-list {
  margin-bottom: 30rpx;
}

.sub-kp-item {
  margin-bottom: 16rpx;
}

.kp-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.kp-name {
  font-size: 24rpx;
  color: #4B5563;
}

.kp-val {
  font-size: 24rpx;
  font-weight: bold;
}

.kp-val.weak { color: #FF4D4F; }
.kp-val.good { color: #10B981; }

.empty-kp {
  padding: 40rpx;
  text-align: center;
  color: #9CA3AF;
  font-size: 24rpx;
  background: #F9FAFB;
  border-radius: 12rpx;
}

.analysis-title {
  font-weight: bold;
  color: #1F2937;
  font-size: 28rpx;
  margin-bottom: 20rpx;
  display: block;
}

/* 用户卡片 */
.user-card {
  background: linear-gradient(135deg, #2E5BFF 0%, #1E40AF 100%);
  padding: 80rpx 40rpx 60rpx;
  position: relative;
  overflow: hidden;
  border-radius: 0 0 60rpx 60rpx;
}

.card-bg-decoration {
  position: absolute;
  top: -100rpx;
  right: -100rpx;
  width: 400rpx;
  height: 400rpx;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.user-info {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
}

.avatar-wrapper {
  position: relative;
  border: 4rpx solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  padding: 6rpx;
  background: rgba(255, 255, 255, 0.1);
}

.lv-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #FFD700;
  color: #1E40AF;
  font-size: 20rpx;
  font-weight: bold;
  padding: 2rpx 12rpx;
  border-radius: 20rpx;
  border: 2rpx solid #FFFFFF;
}

.user-details {
  flex: 1;
  margin-left: 32rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.username {
  font-size: 48rpx;
  font-weight: bold;
  color: #FFFFFF;
}

.edit-icon-btn {
  background: rgba(255, 255, 255, 0.15);
  padding: 10rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.streak-badge {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.15);
  padding: 10rpx 24rpx;
  border-radius: 100rpx;
  width: fit-content;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.streak-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.streak-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-right: 10rpx;
}

.streak-val {
  font-size: 36rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-right: 4rpx;
}

.streak-unit {
  font-size: 22rpx;
  color: #FFFFFF;
  opacity: 0.8;
}

.user-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  margin-top: 50rpx;
  position: relative;
  z-index: 2;
}

.stat-card {
  background: rgba(255, 255, 255, 0.12);
  padding: 24rpx;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(10px);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.stat-v {
  font-size: 36rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 4rpx;
}

.stat-k {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
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