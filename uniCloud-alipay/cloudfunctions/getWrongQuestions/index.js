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
			'言语理解': 'verbal_questions',
			'数量关系': 'quantitative_questions',
			'判断推理': 'reasoning_questions',
			'资料分析': 'data_analysis_questions',
			'常识判断': 'common_sense_questions',
			'时政热点': 'politics_questions',
			'政治理解': 'politics_questions',
			'时事政治': 'politics_questions',
			'政治': 'politics_questions'
		};

		const allCollections = [
			'verbal_questions',
			'quantitative_questions',
			'reasoning_questions',
			'data_analysis_questions',
			'common_sense_questions',
			'politics_questions',
			'questions'
		];

		const fetchGroups = {};
		listRes.data.forEach(item => {
			let collectionName = moduleToCollection[item.moduleType] || 'unknown';
			if (!fetchGroups[collectionName]) fetchGroups[collectionName] = [];
			fetchGroups[collectionName].push(item.questionId);
		});

		const qMap = {};

		// 处理已知集合
		const knownCollections = Object.keys(fetchGroups).filter(c => c !== 'unknown');
		for (const col of knownCollections) {
			await fetchFromCollection(col, fetchGroups[col]);
		}

		// 处理未匹配到的题目（兜底搜索）
		const missedIds = listRes.data
			.map(item => item.questionId)
			.filter(id => !qMap[id] && !qMap[String(id)]);

		if (missedIds.length > 0) {
			for (const col of allCollections) {
				const currentMissed = missedIds.filter(id => !qMap[id] && !qMap[String(id)]);
				if (currentMissed.length === 0) break;
				await fetchFromCollection(col, currentMissed);
			}
		}

		async function fetchFromCollection(col, rawIds) {
			try {
				// 获取去重后的真实父 ID (处理资料分析多级下划线)
				const parentIds = rawIds.map(id => {
					const idStr = String(id);
					if (idStr.includes('_')) {
						const parts = idStr.split('_');
						parts.pop();
						return parts.join('_');
					}
					return id;
				});

				const searchIds = [];
				parentIds.forEach(id => {
					searchIds.push(id);
					const idStr = String(id);
					if (/^\d+$/.test(idStr)) searchIds.push(Number(idStr));
					searchIds.push(idStr);
				});
				const uniqueSearchIds = Array.from(new Set(searchIds));

				const qRes = await db.collection(col).where({
					_id: db.command.in(uniqueSearchIds)
				}).get();

				qRes.data.forEach(item => {
					const itemIdStr = String(item._id);
					const standardizedItem = {
						...item,
						content: item.content || '无题干内容',
						correctAnswer: item.correctAnswer !== undefined ? item.correctAnswer : (item.answer !== undefined ? item.answer : 0)
					};
					
					rawIds.forEach(originalId => {
						const origIdStr = String(originalId);
						if (origIdStr === itemIdStr || origIdStr.startsWith(itemIdStr + '_')) {
							if (origIdStr.includes('_')) {
								const parts = origIdStr.split('_');
								const subId = parts[parts.length - 1]; 
								if (item.questions && Array.isArray(item.questions)) {
									const subQ = item.questions.find((q, idx) => 
										String(idx) === subId || String(q.qid) === subId || String(q._id) === subId
									);
									if (subQ) {
										qMap[originalId] = {
											...subQ,
											_id: originalId,
											content: `[${item.source || '资料分析'}] ${subQ.content || ''}`,
											correctAnswer: subQ.correctAnswer !== undefined ? subQ.correctAnswer : (subQ.answer !== undefined ? subQ.answer : 0),
											isComposite: true,
											parentMaterial: item.content || item.material
										};
									}
								}
							} else {
								qMap[originalId] = standardizedItem;
							}
						}
					});
				});
			} catch (err) {
				console.error(`查询集合 ${col} 失败:`, err);
			}
		}
		
		// 2.3 组装数据
		const combinedData = listRes.data.map(item => {
			const qInfo = qMap[item.questionId] || qMap[String(item.questionId)];
			return {
				...item,
				questionData: [qInfo || { content: '题目内容已失效或表名错误', _id: item.questionId }]
			};
		})

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