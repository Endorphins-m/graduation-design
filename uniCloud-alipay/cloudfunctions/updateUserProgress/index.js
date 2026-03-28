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

    // 4. 更新数据库
    await db.collection('users').doc(userId).update(updateData);

    return { code: 0, message: '进度同步成功' };
  } catch (e) {
    return { code: -1, message: e.message };
  }
};