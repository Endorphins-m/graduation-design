'use strict';
const db = uniCloud.database()

exports.main = async (event, context) => {
	const { userId, page = 1, pageSize = 15 } = event
	
	if (!userId) {
		return { code: -1, message: '用户ID不能为空' }
	}

	try {
    // 练习记录直接从 users 表的历史字段或者专门的 practice_history 表获取
    // 考虑到目前的 updateUserProgress 逻辑是直接更新用户表字段，
    // 如果没有专门的 history 表，我们先假设存在一个 practice_logs 集合
    // 如果用户没有这个集合，我们需要引导用户创建或者修改更新逻辑。
    
    // 这里我们先实现一个通用的查询，假设存在 practice_logs (通常的做法)
    const res = await db.collection('practice_logs')
      .where({ userId })
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    const countRes = await db.collection('practice_logs').where({ userId }).count()

		return {
			code: 0,
			data: res.data,
			total: countRes.total
		}
	} catch (e) {
		return {
			code: -1,
			message: '获取记录失败：' + e.message
		}
	}
};