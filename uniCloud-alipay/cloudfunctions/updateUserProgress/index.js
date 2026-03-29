'use strict';
const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
  const { userId, stats } = event; // stats 包含：{ verbal: 5, quantitative: 2, totalCorrect: 7, totalCount: 10 }
  
  if (!userId) return { code: -1, message: '用户ID缺失' };

  try {
    // 1. 动态构建更新对象
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    
    const updateData = {
      totalQuestions: dbCmd.inc(stats.totalCount),
      lastPracticeTime: now.getTime(),
      lastPracticeDate: todayStr
    };

    // 2. 检查并更新今日练习数
    const userRes = await db.collection('users').doc(userId).get();
    const user = userRes.data[0];
    
    // 如果是新的一天，重置 todayDone，否则累加
    if (user.lastPracticeDate === todayStr) {
      updateData.todayDone = dbCmd.inc(stats.totalCount);
    } else {
      updateData.todayDone = stats.totalCount;
    }

    // 3. 更新具体模块的练习数 (moduleStats.verbal 等)
    for (let key in stats.modules) {
      updateData[`moduleStats.${key}`] = dbCmd.inc(stats.modules[key]);
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

    return { code: 0, message: '进度同步成功' };
  } catch (e) {
    return { code: -1, message: e.message };
  }
};