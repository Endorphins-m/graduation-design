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
      totalCorrect: dbCmd.inc(stats.totalCorrect || 0), // 记录累计正确数
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
    if (stats.modules) {
      for (let key in stats.modules) {
        updateData[`moduleStats.${key}`] = dbCmd.inc(stats.modules[key]);
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

    return { code: 0, message: '进度同步成功' };
  } catch (e) {
    return { code: -1, message: e.message };
  }
};