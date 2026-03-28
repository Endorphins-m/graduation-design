'use strict';
const db = uniCloud.database()
const $ = db.command.aggregate

exports.main = async (event, context) => {
  const { userId } = event
  if (!userId) {
    return { code: -1, message: '用户ID不能为空' }
  }

  try {
    // 1. 获取用户信息（基础指标：总刷题数、正确率、学习偏好）
    const userRes = await db.collection('users').doc(userId).get()
    if (!userRes.data || userRes.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const user = userRes.data[0]

    // 2. 获取今日练习统计
    // 逻辑优化：直接从用户表的 todayDone 字段获取，确保与更新逻辑一致
    let todayDone = 0;
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    
    // 如果最后练习日期是今天，则返回 todayDone，否则返回 0
    if (user.lastPracticeDate === todayStr) {
      todayDone = user.todayDone || 0;
    }

    // 3. 构建返回数据
    return {
      code: 0,
      data: {
        todayDone: todayDone,
        dailyTarget: user.learningPrefs?.dailyLimit || 50,
        totalQuestions: user.totalQuestions || 0,
        accuracy: user.accuracy || 0,
        studyDays: user.streak || 0,
        // 各模块进度
        moduleStats: {
          verbal: user.moduleStats?.verbal || 0,
          quantitative: user.moduleStats?.quantitative || 0,
          reasoning: user.moduleStats?.reasoning || 0,
          dataAnalysis: user.moduleStats?.dataAnalysis || 0,
          commonSense: user.moduleStats?.commonSense || 0,
          politics: user.moduleStats?.politics || 0
        }
      }
    }
  } catch (e) {
    return {
      code: -1,
      message: '获取统计失败：' + e.message
    }
  }
}