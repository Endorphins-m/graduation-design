'use strict';
const db = uniCloud.database()

exports.main = async (event, context) => {
	const { userId, questionId, action, moduleType } = event
	
	if (!userId || !questionId) {
		return { code: -1, message: '参数缺失' }
	}

	try {
		const collection = db.collection('collection_records')
		
		// 1. 检查收藏状态
		if (action === 'check') {
			const res = await collection.where({ userId, questionId }).get()
			return {
				code: 0,
				isCollected: res.data.length > 0
			}
		}

		// 2. 切换收藏状态
		if (action === 'toggle') {
			const res = await collection.where({ userId, questionId }).get()
			if (res.data.length > 0) {
				// 取消收藏
				await collection.doc(res.data[0]._id).remove()
				return { code: 0, isCollected: false, message: '已取消收藏' }
			} else {
				// 添加收藏
				await collection.add({
					userId,
					questionId,
					moduleType: moduleType || 'unknown',
					updateTime: Date.now(),
					createTime: Date.now()
				})
				return { code: 0, isCollected: true, message: '收藏成功' }
			}
		}

		return { code: -1, message: '无效的操作' }
	} catch (e) {
		return { code: -1, message: e.message }
	}
};