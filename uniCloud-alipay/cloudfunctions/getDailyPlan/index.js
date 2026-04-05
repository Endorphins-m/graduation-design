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
    
    // 2. 这里的核心逻辑：根据能力强弱分配任务比例
    // 我们按照 60% (薄弱题) / 30% (基础题) / 10% (拔高题) 的科学备考比例
    
    // 排序找出最薄弱和最强的模块
    const modules = [
      { key: 'verbal', name: '言语理解', score: moduleStats.verbal || 0 },
      { key: 'quantitative', name: '数量关系', score: moduleStats.quantitative || 0 },
      { key: 'reasoning', name: '判断推理', score: moduleStats.reasoning || 0 },
      { key: 'dataAnalysis', name: '资料分析', score: moduleStats.dataAnalysis || 0 },
      { key: 'commonSense', name: '常识判断', score: moduleStats.commonSense || 0 }
    ].sort((a, b) => a.score - b.score)

    const dailyLimit = user.learningPrefs?.dailyLimit || 30
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
        estimatedTime: Math.round(dailyLimit * 0.6 * 1.5), // 假设薄弱题用时较长
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
    const totalStudyHours = user.studyHours || 0
    const totalStreak = user.streak || 1
    // 计算平均时长：总小时 * 60 / 累计天数 = 平均分钟数
    const realAvgTime = Math.round((totalStudyHours * 60) / totalStreak)

    return {
      code: 0,
      data: {
        weekRange: getWeekRange(),
        weeklyTarget: dailyLimit * 7,
        completedCount: user.totalQuestions || 0, // 这里应为本周累计，暂时取总数演示
        accuracy: user.accuracy || 0,
        studyDays: user.streak || 0,
        avgTime: realAvgTime > 0 ? realAvgTime : 0,
        currentDay: getDayOfYearProgress(),
        today: (now.getMonth() + 1) + '月' + now.getDate() + '日',
        todayTasks: todayTasks,
        abilityTrends: modules.map(m => {
          let trend = 'stable';
          // 逻辑重新设计：
          // >= 85: 突破 (up)
          // 60-85: 稳健 (stable)
          // < 60: 筑基 (accumulate)
          if (m.score >= 85) trend = 'up';
          else if (m.score >= 60) trend = 'stable';
          else trend = 'accumulate';
          
          return {
            name: m.name,
            score: Math.round(m.score),
            trend: trend
          }
        })
      }
    }
  } catch (e) {
    return { code: -1, message: '生成计划失败: ' + e.message }
  }
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