'use strict';
const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
  const { userId } = event
  if (!userId) {
    return { code: -1, message: '用户ID不能为空' }
  }

  try {
    // 1. 获取用户信息和能力画像
    const userRes = await db.collection('users').doc(userId).get()
    if (!userRes.data || userRes.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const user = userRes.data[0]
    const moduleStats = user.moduleStats || {}
    
    const dailyLimit = 30; // 固定题量，移除了偏好设置依赖
    
    // 2. 这里的核心逻辑：根据用户能力画像分配任务比例
    // 我们按照 60% (薄弱题) / 30% (基础题) / 10% (拔高题) 的比例
    
    // 排序找出最薄弱和最强的模块
    const modules = [
      { key: 'verbal', name: '言语理解', score: moduleStats.verbal || 0 },
      { key: 'quantitative', name: '数量关系', score: moduleStats.quantitative || 0 },
      { key: 'reasoning', name: '判断推理', score: moduleStats.reasoning || 0 },
      { key: 'dataAnalysis', name: '资料分析', score: moduleStats.dataAnalysis || 0 },
      { key: 'commonSense', name: '常识判断', score: moduleStats.commonSense || 0 }
    ].sort((a, b) => a.score - b.score)

    const now = new Date()
    const todayStr = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()

    // 3. 构造今日任务列表
    const todayTasks = [
      {
        name: modules[0].name,
        type: 'weak',
        typeKey: modules[0].key,
        total: Math.round(dailyLimit * 0.6),
        completed: user.lastPracticeDate === todayStr ? (user.moduleStatsToday?.[modules[0].key] || 0) : 0,
        estimatedTime: Math.round(dailyLimit * 0.6 * 1.5),
        priority: '高'
      },
      {
        name: modules[1].name,
        type: 'base',
        typeKey: modules[1].key,
        total: Math.round(dailyLimit * 0.3),
        completed: user.lastPracticeDate === todayStr ? (user.moduleStatsToday?.[modules[1].key] || 0) : 0,
        estimatedTime: Math.round(dailyLimit * 0.3 * 1.0),
        priority: '中'
      },
      {
        name: modules[modules.length - 1].name,
        type: 'strong',
        typeKey: modules[modules.length - 1].key,
        total: Math.max(1, Math.round(dailyLimit * 0.1)),
        completed: user.lastPracticeDate === todayStr ? (user.moduleStatsToday?.[modules[modules.length - 1].key] || 0) : 0,
        estimatedTime: Math.round(dailyLimit * 0.1 * 0.8),
        priority: '低'
      }
    ]

    // 4. 获取本周概览数据 (计算实时指标)
    const nowTimestamp = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const currentDayOfWeek = now.getDay() || 7; // 1-7 (周一到周日)
    const mondayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - (currentDayOfWeek - 1) * oneDayMs;

    // 从练习记录中统计本周累计时长（精确到分钟）
    const practiceStats = await db.collection('practice_records')
      .where({
        userId,
        createTime: dbCmd.gte(mondayStart)
      })
      .get();
    
    let weeklyTotalTime = 0;
    let weeklyCompleted = 0;
    let weeklyCorrect = 0;
    
    practiceStats.data.forEach(p => {
      weeklyTotalTime += (p.duration || 0); // 假设存的是秒
      weeklyCompleted += (p.totalQuestions || 0);
      weeklyCorrect += (p.correctQuestions || 0);
    });

    // 计算本周日均时长：本周总秒数 / 60 / 本周已过天数
    const realAvgTime = Math.round((weeklyTotalTime / 60) / currentDayOfWeek);
    const weeklyAccuracy = weeklyCompleted > 0 ? Math.round((weeklyCorrect / weeklyCompleted) * 100) : (user.accuracy || 0);

    const abilityTrends = modules.map(m => {
      let trend = 'stable';
      if (m.score >= 85) trend = 'up';
      else if (m.score >= 60) trend = 'stable';
      else trend = 'accumulate';
      
      return {
        name: m.name,
        score: Math.round(m.score),
        trend: trend
      }
    })

    return {
      code: 0,
      data: {
        weekRange: getWeekRange(),
        weeklyTarget: dailyLimit * 7,
        completedCount: weeklyCompleted, 
        accuracy: weeklyAccuracy,
        studyDays: user.streak || 0,
        avgTime: realAvgTime > 0 ? realAvgTime : 0,
        currentDay: getDayOfYearProgress(),
        today: (now.getMonth() + 1) + '月' + now.getDate() + '日',
        todayTasks: todayTasks,
        abilityTrends: abilityTrends,
        // 5. 生成本周 7 天的动态推荐计划 (算法推荐)
        mockWeeklyPlan: generateWeeklyPlan(modules, dailyLimit)
      }
    }
  } catch (e) {
    return { code: -1, message: '生成计划失败: ' + e.message }
  }
}

/**
 * 核心推荐算法：基于用户五大模块分值的“智能削峰填谷”计划
 * 逻辑：
 * 1. 周一周二：重点突击分数最低的 2 个模块（筑基/突破）
 * 2. 周三周日：模拟考/总结（综合评估）
 * 3. 周四周五：均衡提升/资料专项
 * 4. 题量分配：根据分数低（耗时多）还是高（效率高）分配题量
 */
function generateWeeklyPlan(modules, dailyLimit) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const titles = [
    '周一 · 基础稳固', '周二 · 弱项突破', '周三 · 模拟实战', 
    '周四 · 资料专项', '周五 · 常识归纳', '周六 · 查漏补缺', '周日 · 总结预选'
  ];
  
  // 按分数排序：0 为最弱，4 为最强
  const weakest = modules[0];
  const secondWeak = modules[1];
  const strongest = modules[4];
  
  return days.map((day, index) => {
    let focus = [];
    let time = 60;
    let questions = dailyLimit;
    let desc = '';

    switch(index) {
      case 0: // 周一
        focus = [{label: weakest.name, type: 'weak'}, {label: '基础扫盲', type: 'base'}];
        time = Math.round(dailyLimit * 2.0); // 刚开始磨刀，用时设长点
        desc = `侧重${weakest.name}的底层逻辑梳理`;
        break;
      case 1: // 周二
        focus = [{label: secondWeak.name, type: 'weak'}, {label: weakest.name, type: 'weak'}];
        time = Math.round(dailyLimit * 1.8);
        desc = `深度攻克${weakest.name}和${secondWeak.name}的高频错题`;
        break;
      case 2: // 周三
        focus = [{label: '全模块模拟', type: 'all'}];
        questions = dailyLimit + 20; // 模拟日题量略多
        time = 120;
        desc = '由于处于模拟实战日，建议进行计时套题练习';
        break;
      case 3: // 周四
        focus = [{label: '资料分析', type: 'strong'}, {label: '速度提升', type: 'base'}];
        questions = Math.round(dailyLimit * 1.2);
        time = 75;
        desc = '侧重提升资料分析的运算精度与速度';
        break;
      case 4: // 周五
        focus = [{label: '常识归纳', type: 'base'}, {label: '政治理论', type: 'base'}];
        time = 50;
        desc = '复盘本周错题，并归纳最新政治理论考点';
        break;
      case 5: // 周六
        focus = [{label: '全量错题', type: 'weak'}, {label: '薄弱点复查', type: 'weak'}];
        time = 90;
        desc = '通过“错题本”进行针对性死穴扫描';
        break;
      case 6: // 周日
        focus = [{label: '能力评估', type: 'all'}];
        questions = Math.round(dailyLimit * 0.5); // 周日作为复盘日，题量减半
        time = 40;
        desc = '生成本周学习报告，智能预测下周学习权重';
        break;
    }

    return {
      day,
      title: titles[index],
      time,
      totalQuestions: questions,
      focus,
      desc
    }
  });
}

function getWeekRange() {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now.getTime() - (day - 1) * 24 * 60 * 60 * 1000)
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000)
  return `${monday.getMonth()+1}.${monday.getDate()}-${sunday.getMonth()+1}.${sunday.getDate()}`
}

function getDayOfYearProgress() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const oneDay = 1000 * 60 * 60 * 24
  const day = Math.floor(diff / oneDay)
  return day
}