'use strict';
const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
  const { userId, stats } = event; // stats 包含：{ verbal: 5, quantitative: 2, totalCorrect: 7, totalCount: 10 }
  
  if (!userId) return { code: -1, message: '用户ID缺失' };

  try {
    // 强制清理 totalCount 为 0 的异常 stats，防止 NaN 扩散
    if (stats && stats.totalCount === 0 && stats.totalCorrect > 0) {
       stats.totalCount = stats.totalCorrect;
    }

    // 1. 动态构建更新对象
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    
    const updateData = {
      totalQuestions: dbCmd.inc(Number(stats.totalCount) || 0),
      totalCorrect: dbCmd.inc(Number(stats.totalCorrect) || 0), // 记录累计正确数
      lastPracticeTime: now.getTime(),
      lastPracticeDate: todayStr
    };

    // 2. 检查并更新今日练习数
    const userRes = await db.collection('users').doc(userId).get();
    const user = userRes.data[0] || {}; // 防护处理

    // 计算新的正确率 (累计正确 / 累计总数)
    const currentTotal = (Number(user.totalQuestions) || 0) + Number(stats.totalCount || 0);
    const currentCorrect = (Number(user.totalCorrect) || 0) + Number(stats.totalCorrect || 0);
    
    // 只有当总题数大于 0 时才更新正确率
    if (currentTotal > 0) {
      updateData.accuracy = Math.round((currentCorrect / currentTotal) * 100);
    } else {
      updateData.accuracy = 0;
    }

    // 计算学习时长 (假设传入 stats.duration，单位为秒，转换为小时)
    if (stats.duration) {
      const addedHours = Number(stats.duration) / 3600;
      updateData.studyHours = dbCmd.inc(Number(addedHours.toFixed(2)));
    }
    
    // 如果是新的一天，累计备考天数，重置 todayDone，否则仅累加今日做题数
    if (user.lastPracticeDate === todayStr) {
      updateData.todayDone = dbCmd.inc(stats.totalCount);
    } else {
      updateData.todayDone = stats.totalCount;
      // 修改逻辑：改为累计做题天数，只要今天发生了做题行为且与上次练习日期不同，就累计+1
      updateData.streak = dbCmd.inc(1);
    }

    // 3. 更新具体模块的练习数 (moduleStats.verbal 等)
    // 这里的 stats.modules 应该存储的是练习过程中某大类的累加数值
    if (stats.modules) {
      for (let key in stats.modules) {
        let moduleKey = key;
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
        
        // 统一映射到英文 key
        const mappedKey = typeMapping[moduleKey] || moduleKey;
        
        // 使用累加而非覆盖处理：如果同一个请求报文中包含多个同类 key（如 '政治理论' 和 '时政聚焦'），需要将它们的数值累加后再用 dbCmd.inc
        if (updateData[`moduleStats.${mappedKey}`] === undefined) {
          updateData[`moduleStats.${mappedKey}`] = 0;
          updateData[`moduleCorrect.${mappedKey}`] = 0;
        }
        
        // 因为 updateData 是最终交给数据库的对象，不能直接在 updateData 中存原始数值再加 inc
        // 我们在这里做一个中间变量来合并重复模块
      }
      
      // 重新实现：合并同类项逻辑
      const consolidatedStats = {};
      const consolidatedCorrect = {};
      
      for (let key in stats.modules) {
        const typeMapping = {
          '言语理解': 'verbal', '数量关系': 'quantitative', '判断推理': 'reasoning', 
          '资料分析': 'dataAnalysis', '常识判断': 'commonSense', '政治理论': 'politics',
          '时政聚焦': 'politics', '时政热点': 'politics', '政治理解': 'politics', 'politics': 'politics'
        };
        const mKey = typeMapping[key] || key;
        consolidatedStats[mKey] = (consolidatedStats[mKey] || 0) + Number(stats.modules[key] || 0);
        
        // 核心修正：即便正确率为0，也显式赋 0 值，确保进入 consolidatedCorrect 映射
        const correctCount = (stats.modulesCorrect && stats.modulesCorrect[key] !== undefined) 
          ? Number(stats.modulesCorrect[key]) 
          : 0;
        consolidatedCorrect[mKey] = (consolidatedCorrect[mKey] || 0) + correctCount;
      }
      
      // 写入最终更新指令
      for (let mKey in consolidatedStats) {
        updateData[`moduleStats.${mKey}`] = dbCmd.inc(consolidatedStats[mKey]);
        // 关键修正：显式确保正确数累加，即便是 0 原子增加
        updateData[`moduleCorrect.${mKey}`] = dbCmd.inc(Number(consolidatedCorrect[mKey]) || 0);

        // 新增：记录分模块练习时长
        if (stats.duration) {
          // 按照该模块在本次练习中的题目占比，粗略分配总时长
          const ratio = consolidatedStats[mKey] / (stats.totalCount || 1);
          const moduleDuration = Math.round(stats.duration * ratio);
          updateData[`moduleDuration.${mKey}`] = dbCmd.inc(moduleDuration);
        }
      }
    }

    // --- 新增：粒度化知识点/技能追踪 ---
    if (event.results && event.results.length > 0) {
      for (const res of event.results) {
        let { knowledgePoint, skill, isCorrect, moduleType } = res;
        
        // 如果 moduleType 是 'politics' 相关，确保知识点名称包含政治关键词以便 getUserStudyStats 匹配
        if ((moduleType === 'politics' || moduleType === '时政聚焦' || moduleType === '政治理论' || moduleType === '时政热点') && (!knowledgePoint || knowledgePoint === '未分类')) {
          knowledgePoint = '时政聚焦';
        }
        
        // 更新知识点正确率：使用 profile 字段存储
        if (knowledgePoint) {
           // 修正点1: 统一格式处理，防止 "主旨理解 " 和 "主旨理解" 被存为两个不同的 key
           const kpName = String(knowledgePoint).trim().replace(/\./g, '_'); 
           const kpKey = `profile.knowledgePoints.${kpName}`;
           
           updateData[`${kpKey}.total`] = dbCmd.inc(1);
           if (isCorrect) {
             updateData[`${kpKey}.correct`] = dbCmd.inc(1);
           }
        }
        
        // 更新技能分数 (0-100)
        if (skill) {
          const sName = String(skill).trim().replace(/\./g, '_');
          const skillKey = `profile.skills.${sName}`;
          updateData[skillKey] = dbCmd.inc(isCorrect ? 2 : -1);
        }
      }
    }

    // --- 新增：记录已做题目 ID 列表，用于排重 ---
    if (event.questionIds && event.questionIds.length > 0) {
      updateData.doneQuestionIds = dbCmd.addToSet({
        $each: event.questionIds
      });
    }

    // --- 新增：错题集同步逻辑 ---
    if (event.wrongQuestions && event.wrongQuestions.length > 0) {
      for (const w of event.wrongQuestions) {
        // 使用 upsert 方式更新错题表：如果存在则累加错误次数，不存在则创建
        await db.collection('wrong_questions').where({
          userId: userId,
          questionId: w.id
        }).update({
          moduleType: w.moduleType,
          userAnswer: w.userAnswer,
          errorCount: dbCmd.inc(1),
          updateTime: new Date().getTime(),
          status: 0
        }).then(async res => {
          if (res.updated === 0) {
            await db.collection('wrong_questions').add({
              userId: userId,
              questionId: w.id,
              moduleType: w.moduleType,
              userAnswer: w.userAnswer,
              errorCount: 1,
              updateTime: new Date().getTime(),
              status: 0
            });
          }
        });
      }
    }

    // 4. 更新数据库
    await db.collection('users').doc(userId).update(updateData);

    // --- 新增：写入练习日志，用于显示练习记录页面 ---
    await db.collection('practice_logs').add({
      userId: userId,
      totalCount: stats.totalCount,
      totalCorrect: stats.totalCorrect,
      duration: stats.duration,
      moduleType: Object.keys(stats.modules || {}).join(','),
      questionIds: event.questionIds || [], // 记录本次练习的题目 ID 列表
      createTime: now.getTime()
    });

    return { code: 0, message: '进度同步成功' };
  } catch (e) {
    return { code: -1, message: e.message };
  }
};