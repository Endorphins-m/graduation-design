'use strict';
const db = uniCloud.database()

exports.main = async (event, context) => {
	const { userId, moduleType, page = 1, pageSize = 10, action = 'list' } = event
	
	if (!userId) {
		return { code: -1, message: '用户ID不能为空' }
	}

	try {
		// 1. 获取统计信息
		if (action === 'stats') {
			const countRes = await db.collection('wrong_questions').where({ userId }).count()
			// 假设 status: 1 是已掌握
			const masteredRes = await db.collection('wrong_questions').where({ userId, status: 1 }).count()
			return {
				code: 0,
				total: countRes.total,
				mastered: masteredRes.total
			}
		}

		// 2. 获取列表 (兼容各题型分表)
		let query = { userId }
		if (moduleType && moduleType !== 'all') {
			query.moduleType = moduleType
		}

		// 2.1 获取错题基础记录
		const listRes = await db.collection('wrong_questions')
			.where(query)
			.orderBy('updateTime', 'desc') // 使用 orderBy 替代 sort
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.get()
		
		if (!listRes.data || listRes.data.length === 0) {
			return { code: 0, data: [], total: 0 }
		}

		// 2.2 按模块分类批量获取对应的题目详情
		const moduleToCollection = {
			'verbal': 'verbal_questions',
			'quantitative': 'quantitative_questions',
			'reasoning': 'reasoning_questions',
			'dataAnalysis': 'data_analysis_questions',
			'commonSense': 'common_sense_questions',
			'politics': 'politics_questions',
			// 兼容中文字符串
			'言语理解': 'verbal_questions',
			'数量关系': 'quantitative_questions',
			'判断推理': 'reasoning_questions',
			'资料分析': 'data_analysis_questions',
			'常识判断': 'common_sense_questions',
			'时政热点': 'politics_questions'
		};

		// 按集合分组 ids
		const fetchGroups = {};
		listRes.data.forEach(item => {
			const collectionName = moduleToCollection[item.moduleType] || 'questions';
			if (!fetchGroups[collectionName]) fetchGroups[collectionName] = [];
			fetchGroups[collectionName].push(item.questionId);
		});

		// 并行查询所有相关的题目表
		const qMap = {};
		const fetchPromises = Object.keys(fetchGroups).map(async (col) => {
			try {
				const qRes = await db.collection(col).where({
					_id: db.command.in(fetchGroups[col])
				}).get();
				qRes.data.forEach(q => {
					qMap[q._id] = q;
				});
			} catch (err) {
				console.error(`查询集合 ${col} 失败:`, err);
			}
		});
		await Promise.all(fetchPromises);
		
		// 2.3 组装数据
		const combinedData = listRes.data.map(item => ({
			...item,
			questionData: [qMap[item.questionId] || { content: '题目内容已失效或表名错误' }]
		}))

		const countTotal = await db.collection('wrong_questions').where(query).count()

		return {
			code: 0,
			total: countTotal.total,
			data: combinedData
		}
	} catch (e) {
		return {
			code: -1,
			message: '获取数据失败：' + e.message
		}
	}
};