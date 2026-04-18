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
    
    // 转换为前端需要的格式 (保留原始 total 和 correct，方便前端计算和显示)
    const formattedKP = {};
    for (let kpName in knowledgePoints) {
      const data = knowledgePoints[kpName];
      if (data && data.total > 0) {
        // 使用实际存储的数据，不再是简单的 accuracy 数值
        formattedKP[kpName] = {
          total: data.total || 0,
          correct: data.correct || 0,
          accuracy: Math.round(((data.correct || 0) / (data.total || 1)) * 100)
        };
      }
    }

    // --- 2. 统计各模块题目总数 ---
    const getAggregatedModuleStats = (statsObj, correctObj) => {
      const getSum = (keys) => {
        let total = 0;
        let correct = 0;
        keys.forEach(k => {
          total += (Number(statsObj?.[k]) || 0);
          correct += (Number(correctObj?.[k]) || 0);
        });
        return { total, correct };
      };

      return {
        verbal: getSum(['verbal', '言语理解']),
        quantitative: getSum(['quantitative', '数量关系']),
        reasoning: getSum(['reasoning', '判断推理', '逻辑判断']),
        dataAnalysis: getSum(['dataAnalysis', '资料分析']),
        commonSense: getSum(['commonSense', '常识判断']),
        politics: getSum(['politics', '时政聚焦', '政治理论', '政治理解', '时政热点'])
      };
    };

    const aggregatedBaseStats = getAggregatedModuleStats(user.moduleStats, user.moduleCorrect);

    const moduleTotalStats = {
      verbal: aggregatedBaseStats.verbal.total,
      quantitative: aggregatedBaseStats.quantitative.total,
      reasoning: aggregatedBaseStats.reasoning.total,
      dataAnalysis: aggregatedBaseStats.dataAnalysis.total,
      commonSense: aggregatedBaseStats.commonSense.total,
      politics: aggregatedBaseStats.politics.total
    };

    const moduleKpMap = {
      verbal: ["主旨", "细节", "词句", "排序", "填空", "辨析", "文章", "言语"],
      quantitative: ["代数", "几何", "行程", "排列", "概率", "工程", "利润", "容斥", "数量"],
      reasoning: ["图推", "类比", "定义", "逻辑", "关联词", "真假话", "判断"],
      dataAnalysis: ["增长率", "增长量", "比重", "倍数", "平均", "分析", "计算", "资料"],
      commonSense: ["法律", "人文", "历史", "科技", "政治", "地理", "经济", "常识"],
      politics: ["精神", "会议", "文件", "时政", "讲话", "党史", "政治", "马克思", "习近", "思想", "理论"]
    };

    // 如果 knowledgePoints 中有更完整的数据，则进行修正补全
    for (let kpName in knowledgePoints) {
      const kp = knowledgePoints[kpName];
      const normalizedKpName = String(kpName).trim();
      for (let mKey in moduleKpMap) {
        if (moduleKpMap[mKey].some(k => normalizedKpName.includes(k))) {
          // 这里不再累加，而是取模块统计与知识点统计的最大值，防止初期数据丢失
          moduleTotalStats[mKey] = Math.max(moduleTotalStats[mKey] || 0, (kp.total || 0));
        }
      }
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
      '时政热点': 'politics',
      '时政聚焦': 'politics',
      '政治理论': 'politics',
      '政治理解': 'politics'
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

    // --- 核算各模块真实正确率 (优先使用明确的模块统计，防止知识点模糊匹配) ---
    const moduleCalculatedStats = {
      verbal: { total: aggregatedBaseStats.verbal.total, correct: aggregatedBaseStats.verbal.correct },
      quantitative: { total: aggregatedBaseStats.quantitative.total, correct: aggregatedBaseStats.quantitative.correct },
      reasoning: { total: aggregatedBaseStats.reasoning.total, correct: aggregatedBaseStats.reasoning.correct },
      dataAnalysis: { total: aggregatedBaseStats.dataAnalysis.total, correct: aggregatedBaseStats.dataAnalysis.correct },
      commonSense: { total: aggregatedBaseStats.commonSense.total, correct: aggregatedBaseStats.commonSense.correct },
      politics: { total: aggregatedBaseStats.politics.total, correct: aggregatedBaseStats.politics.correct }
    };

    // 如果某些模块没有任何明确统计数据，尝试使用知识点累加作为补充
    for (let kpName in knowledgePoints) {
      const kp = knowledgePoints[kpName];
      const normalizedKpName = String(kpName).trim();
      const localKpMap = {
        verbal: ["主旨", "细节", "词句", "排序", "填空", "辨析", "文章", "言语理解", "言语"],
        quantitative: ["代数", "几何", "行程", "排列", "概率", "工程", "利润", "容斥", "数量关系", "数量"],
        reasoning: ["图推", "类比", "定义", "逻辑", "关联词", "真假话", "判断推理", "判断"],
        dataAnalysis: ["增长率", "增长量", "比重", "倍数", "平均", "分析", "计算", "资料分析", "资料"],
        commonSense: ["法律", "人文", "历史", "科技", "政治", "地理", "经济", "常识判断", "常识"],
        politics: ["精神", "会议", "文件", "时政", "讲话", "党史", "政治理论", "重要讲话", "理论", "时政聚焦", "政治理解", "时政热点"]
      };
      
      for (let mKey in localKpMap) {
        if (localKpMap[mKey].some(k => normalizedKpName.includes(k))) {
          // 特殊逻辑：如果命中"政治"，但在 commonSense 的排除列表里（比如它可能只是常识的一部分）
          // 但在这里我们先确保 politics 能够优先通过知识点匹配获取到数据
          
          // 如果该模块是 politics，且名称中包含这些强特征词，则累加
          if (moduleCalculatedStats[mKey].kpTotal === undefined) {
            moduleCalculatedStats[mKey].kpTotal = 0;
            moduleCalculatedStats[mKey].kpCorrect = 0;
          }
          moduleCalculatedStats[mKey].kpTotal += (Number(kp.total) || 0);
          moduleCalculatedStats[mKey].kpCorrect += (Number(kp.correct) || 0);
        }
      }
    }

    // 针对政治模块的特殊兜底：从 commonSense 中分离出含"政治"字样的知识点
    if (knowledgePoints) {
      for (let kpName in knowledgePoints) {
        if ((kpName.includes('政治') || kpName.includes('时政') || kpName.includes('习近')) && (moduleCalculatedStats.politics.kpTotal || 0) < 1) {
           const kp = knowledgePoints[kpName];
           moduleCalculatedStats.politics.kpTotal = (moduleCalculatedStats.politics.kpTotal || 0) + (Number(kp.total) || 0);
           moduleCalculatedStats.politics.kpCorrect = (moduleCalculatedStats.politics.kpCorrect || 0) + (Number(kp.correct) || 0);
        }
      }
    }

    // --- 综合正确率核算 (由各模块累加得出，确保与 profile 图表一致) ---
    const finalModuleStats = {};
    let totalAllCount = 0;
    let totalAllCorrect = 0;
    for (let key in moduleCalculatedStats) {
      const m = moduleCalculatedStats[key];
      
      // 核心对齐逻辑：
      // 1. 优先取【模块明确统计】(专项练习上报的原始数据)
      // 2. 只有模块统计为 0 时，才启用【知识点累加统计】(作为旧数据补充)
      // 严禁将两份统计交叉使用（如分母用模块，分子用知识点），否则百分比必定不对齐
      let finalTotal = 0;
      let finalCorrect = 0;
      
      const mTotal = Number(m.total) || 0;
      const mCorrect = Number(m.correct) || 0;
      const kpTotal = Number(m.kpTotal) || 0;
      const kpCorrect = Number(m.kpCorrect) || 0;
      
      if (mTotal > 0) {
        finalTotal = mTotal;
        finalCorrect = mCorrect;
      } else {
        finalTotal = kpTotal;
        finalCorrect = kpCorrect;
      }
      
      totalAllCount += finalTotal;
      totalAllCorrect += finalCorrect;
      
      if (finalTotal > 0) {
        // 计算百分比并限制在 0-100 之间
        finalModuleStats[key] = Math.max(0, Math.min(100, Math.round((finalCorrect / finalTotal) * 100)));
      } else {
        finalModuleStats[key] = 0;
      }
    }

    // 重新计算总正确率，覆盖用户表中的冗余字段
    const globalAccuracy = totalAllCount > 0 ? Math.round((totalAllCorrect / totalAllCount) * 100) : 0;

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
        totalQuestions: totalAllCount || user.totalQuestions || 0,
        accuracy: globalAccuracy,
        studyHours: user.studyHours || 0,
        improvement: improvement, // 返回真实的提升幅度
        wrongCount: wrongCountRes.total || 0,
        collectCount: collectCountRes.total || 0,
        // 各模块进度 (返回修正后的正确率)
        moduleStats: finalModuleStats,
        // 各模块真实总做题数，供题库页面使用
        moduleTotalStats: moduleTotalStats,
        // 各模块错题数，用于前端计算正确率
        wrongCountMap: wrongCountMap,
        // 各模块练习时长
        moduleDuration: user.moduleDuration || {},
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