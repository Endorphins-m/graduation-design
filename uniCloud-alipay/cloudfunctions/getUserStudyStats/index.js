'use strict';
const db = uniCloud.database()
const $ = db.command.aggregate

// 获取最近7天刷题趋势
async function getRecentTrend(userId) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const now = new Date();
  const trend = [];
  
  try {
    // 1. 获取过去 7 天的日期字符串数组
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      last7Days.push({
        dateStr,
        dayName: days[d.getDay()]
      });
    }

    // 2. 从 practice_logs 聚合统计每日刷题量
    // 修正：删除重复定义的 logsRes 变量，并修复聚合语法错误
    const logsRes = await db.collection('practice_logs').aggregate()
      .match({
        userId: userId,
        createTime: db.command.gte(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      })
      .project({
        date: $.dateToString({
          date: $.add([new Date(0), '$createTime']),
          format: '%Y-%m-%d'
        }),
        totalCount: 1
      })
      .group({
        _id: '$date',
        count: $.sum('$totalCount')
      })
      .end();

    const logsMap = {};
    if (logsRes.data) {
      logsRes.data.forEach(item => {
        // 去掉日期中不必要的 0 以匹配 2024-4-5 格式
        const parts = item._id.split('-');
        const normalizedId = `${parseInt(parts[0])}-${parseInt(parts[1])}-${parseInt(parts[2])}`;
        logsMap[normalizedId] = item.count;
      });
    }

    const trend = [];
    last7Days.forEach(day => {
      trend.push({
        date: day.dayName,
        score: logsMap[day.dateStr] || 0
      });
    });
    return trend;
  } catch (e) {
    console.error('获取趋势失败:', e);
    // 兜底返回 0
    return days.map(d => ({ date: d, score: 0 }));
  }
  
  return trend;
}

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
    
    // --- 新增：知识点能力画像处理 ---
    const profile = user.profile || {};
    const knowledgePoints = profile.knowledgePoints || {};
    const skills = profile.skills || {};
    
    // 转换为前端需要的格式 (例如：计算正确率得分)
    const formattedKP = {};
    for (let kp in knowledgePoints) {
      const data = knowledgePoints[kp];
      formattedKP[kp] = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    }

    // 2. 获取今日练习统计
    // 逻辑优化：直接从用户表的 todayDone 字段获取，确保与更新逻辑一致
    let todayDone = 0;
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    
    // 如果最后练习日期是今天，则返回 todayDone，否则返回 0
    if (user.lastPracticeDate === todayStr) {
      todayDone = user.todayDone || 0;
    }

    // 3. 查询错题集与收藏数量
    const [wrongCountRes, collectCountRes, wrongListRes] = await Promise.all([
      db.collection('wrong_questions').where({ userId: userId }).count(),
      db.collection('collection_records').where({ userId: userId }).count(),
      // 额外拉取错题列表，按模块分类统计，用于计算分模块正确率
      db.collection('wrong_questions').where({ userId: userId }).field({ moduleType: true }).get()
    ]);

    // 统计各模块错题数 (支持中英文映射)
    const typeMapping = {
      '言语理解': 'verbal',
      '数量关系': 'quantitative',
      '判断推理': 'reasoning',
      '资料分析': 'dataAnalysis',
      '常识判断': 'commonSense',
      '时政热点': 'politics'
    };

    const wrongCountMap = {
      verbal: 0,
      quantitative: 0,
      reasoning: 0,
      dataAnalysis: 0,
      commonSense: 0,
      politics: 0
    };

    if (wrongListRes.data) {
      wrongListRes.data.forEach(item => {
        let type = item.moduleType;
        // 如果是中文，转换为英文 key
        if (typeMapping[type]) {
          type = typeMapping[type];
        }
        
        if (wrongCountMap[type] !== undefined) {
          wrongCountMap[type]++;
        }
      });
    }

    // 4. 构建返回数据 (计算提升幅度)
    const statsHistory = user.statsHistory || [];
    let improvement = 0;
    if (statsHistory.length >= 2) {
      const last = statsHistory[statsHistory.length - 1].accuracy || 0;
      const prev = statsHistory[statsHistory.length - 2].accuracy || 0;
      improvement = last - prev;
    }

    return {
      code: 0,
      data: {
        nickname: user.nickname || '考公达人',
        username: user.username || 'user_' + userId.slice(-4),
        avatar: user.avatar || '/static/default-avatar.png',
        level: user.level || '初级学员',
        streak: user.streak || 0,
        todayDone: todayDone,
        dailyTarget: user.learningPrefs?.dailyLimit || 50,
        totalQuestions: user.totalQuestions || 0,
        accuracy: user.accuracy || 0,
        studyHours: user.studyHours || 0,
        improvement: improvement, // 返回真实的提升幅度
        wrongCount: wrongCountRes.total || 0,
        collectCount: collectCountRes.total || 0,
        // 各模块进度
        moduleStats: {
          verbal: user.moduleStats?.verbal || 0,
          quantitative: user.moduleStats?.quantitative || 0,
          reasoning: user.moduleStats?.reasoning || 0,
          dataAnalysis: user.moduleStats?.dataAnalysis || 0,
          commonSense: user.moduleStats?.commonSense || 0,
          politics: user.moduleStats?.politics || 0
        },
        // 各模块错题数，用于前端计算正确率
        wrongCountMap: wrongCountMap,
        // 添加细粒度能力画像数据
        skills: skills, // 技能原始分 (2/题)
        knowledgePoints: formattedKP, // 知识点正确率 (0-100)
        // 5. 获取最近7天刷题趋势
        recentTrend: await getRecentTrend(userId)
      }
    }
  } catch (error) {
    console.error('获取学习报告失败:', error)
    return { code: -1, message: '获取学习报告失败: ' + error.message }
  }
}

// 移除原本错误的导出方式