'use strict';
const db = uniCloud.database()

exports.main = async (event, context) => {
  // 接收前端传参：userId(用户ID), limit(题量), type(指定题型，可选)
  const { userId, limit = 10, type } = event
  
  // 默认能力画像（用于未登录或新用户）
  const defaultProfile = { 
    verbal: 50, 
    quantitative: 50, 
    reasoning: 50, 
    dataAnalysis: 50, 
    commonSense: 50,
    politics: 50
  }
  
  let userProfile = defaultProfile;
  let userModuleStats = {}; // 新增：保存用户详细能力统计
  let queryModule = type; // 初始查询目标设为前端传入的 type

  // 1. 获取用户信息和能力画像
  if (userId && userId !== 'test-user-id') {
    try {
      const userRes = await db.collection('users').doc(userId).get()
      if (userRes.data && userRes.data.length > 0) {
        const userData = userRes.data[0];
        userProfile = userData.profile || defaultProfile;
        userModuleStats = userData.moduleStats || {}; // 获取模块正确率统计
      }
    } catch (e) {
      console.error('获取用户信息失败:', e)
    }
  }

  // 1.1 如果前端没有指定 type，则需要通过算法分析出用户的薄弱项
  if (!queryModule) {
    // 找出画像中分值最低的模块
    let minScore = 101 
    for (let key in userProfile) {
      if (userProfile[key] < minScore) {
        minScore = userProfile[key];
        queryModule = key;
      }
    }
  }

  // 1. 映射表，将 type 映射到对应的数据库集合名称
  const collectionMap = {
    verbal: 'verbal_questions',
    quantitative: 'quantitative_questions',
    reasoning: 'reasoning_questions',
    dataAnalysis: 'data_analysis_questions',
    data_analysis: 'data_analysis_questions',
    commonSense: 'common_sense_questions',
    common_sense: 'common_sense_questions',
    politics: 'politics_questions'
  };

  // --- 兼容性映射：如果传入的是中文，转为英文标识 ---
  const reverseMap = {
    '言语理解': 'verbal',
    '数量关系': 'quantitative',
    '判断推理': 'reasoning',
    '资料分析': 'dataAnalysis',
    '常识判断': 'commonSense',
    '政治理论': 'politics',
    '政治理解': 'politics',
    '时事政治': 'politics',
    '时政聚焦': 'politics',
    '时政热点': 'politics'
  };
  if (reverseMap[queryModule]) {
    queryModule = reverseMap[queryModule];
  }

  // 2. 核心修复：确定要查询的集合
  // 必须使用解析后的 queryModule（它包含了前端传入的 type 或 算法算出的薄弱项）
  let targetCollection = collectionMap[queryModule];
  
  // 如果还没匹配到，尝试下划线转换 (例如 dataAnalysis -> data_analysis)
  if (!targetCollection && queryModule) {
    const snakeCase = queryModule.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
    targetCollection = collectionMap[snakeCase] || `${snakeCase}_questions`;
  }

  // --- 新增：获取用户已做题 ID 列表用于排重 ---
  let doneQuestionIds = [];
  if (userId && userId !== 'test-user-id') {
    try {
      const userRes = await db.collection('users').doc(userId).field({ doneQuestionIds: 1 }).get();
      if (userRes.data && userRes.data.length > 0) {
        doneQuestionIds = userRes.data[0].doneQuestionIds || [];
      }
    } catch (e) {
      console.error('获取已做题记录失败:', e);
    }
  }

  try {
    // 3. 构建抽题流水线
    let query = db.collection(targetCollection).aggregate();
    
    // A. 先尝试排除已做过的题
    let matchStage = {};
    if (doneQuestionIds.length > 0) {
      matchStage._id = db.command.nin(doneQuestionIds);
      query = query.match(matchStage);
    }

    // B. 数据字段投影与清洗 (兼容不同表结构)
    query = query.project({
      _id: 1,
      content: 1,
      options: 1,
      answer: 1,
      correctAnswer: 1,
      explanation: 1,
      analysis: 1,
      difficulty: 1,
      recommendedTime: 1,
      knowledgePoints: 1, // 必须保留原始数组供后续标准化使用
      questions: 1,       // 关键：导出资料分析的子题目数组
      material: 1,        // 关键：导出资料分析的材料内容
      source: 1,
      type: type || '$type'
    });

    // 4. 执行随机抽题
    // 逻辑修正：如果是资料分析（复合题），我们通常只需要取 1 大组（内含 5 小题），否则展开后题目过多
    const isDataAnalysis = targetCollection === 'data_analysis_questions';
    const sampleSize = isDataAnalysis ? 1 : limit;
    
    let res = await query.sample({ size: sampleSize }).end();

    // --- 资料分析专项逻辑：拆解复合题目 ---
    if (res.data && res.data.length > 0) {
      // 提取所有云存储 ID 准备转换为临时链接
      const cloudIds = res.data
        .filter(item => item.material && item.material.image && item.material.image.startsWith('cloud://'))
        .map(item => item.material.image);
      
      let fileList = [];
      if (cloudIds.length > 0) {
        try {
          const tempRes = await uniCloud.getTempFileURL({ fileList: cloudIds });
          fileList = tempRes.fileList;
        } catch (e) {
          console.error('获取临时链接失败:', e);
        }
      }

      let expandedData = [];
      res.data.forEach(item => {
        // 如果包含 questions 数组（资料分析复合题格式）
        if (item.questions && Array.isArray(item.questions)) {
          // 获取转换后的真实链接
          let finalImageUrl = (item.material && item.material.image) ? item.material.image : '';
          if (finalImageUrl.startsWith('cloud://')) {
            const fileInfo = fileList.find(f => f.fileID === finalImageUrl);
            if (fileInfo && fileInfo.tempFileURL) {
              finalImageUrl = fileInfo.tempFileURL;
            }
          }

          const materialHtml = item.material ? `
            <div style="background-color:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:15px; border-left:4px solid #2E5BFF; font-size:14px; line-height:1.6; color:#444;">
              <div style="font-weight:bold; color:#2E5BFF; margin-bottom:8px;">[阅读材料]</div>
              ${finalImageUrl ? `<img src="${finalImageUrl}" style="width:100% !important; display:block; margin:10px 0; border-radius:4px;" />` : ''}
              <div>${(item.material && item.material.text) ? item.material.text : ''}</div>
            </div>
          ` : '';
          
          item.questions.forEach((subQ, idx) => {
            const subId = subQ.qid || subQ._id || `sub${idx}`;
            expandedData.push({
              ...subQ,
              _id: `${item._id}_${subId}`,
              type: 'dataAnalysis', // 强制指定类型，方便收藏夹分类
              content: materialHtml + subQ.content, // 将材料注入题干
              source: item.source || subQ.source || '资料分析真题',
              difficulty: subQ.difficulty || item.difficulty || 3,
              recommendedTime: subQ.recommendedTime || item.recommendedTime || 25,
              knowledgePoints: subQ.knowledgePoints || item.knowledgePoints
            });
          });
        } else {
          expandedData.push(item);
        }
      });
      res.data = expandedData;
    }

    // C. 如果抽题后没数据（或者刚才拆解后为空），尝试关闭排重再抽一次
    if (!res.data || res.data.length === 0) {
      let fallbackRes = await db.collection(targetCollection)
        .aggregate()
        .project({
          _id: 1, content: 1, options: 1, answer: 1, correctAnswer: 1, explanation: 1, analysis: 1,
          recommendedTime: 1, knowledgePoints: 1, questions: 1, material: 1, source: 1,
          type: type || '$type'
        })
        .sample({ size: sampleSize })
        .end();
        
      if (fallbackRes.data && fallbackRes.data.length > 0) {
        let expandedFallback = [];
        fallbackRes.data.forEach(item => {
          if (item.questions && Array.isArray(item.questions)) {
            const materialHtml = item.material ? `<div style="background:#f8f9fa; padding:12px; margin-bottom:12px; font-size:14px; color:#444;">${item.material.text || ''}</div>` : '';
            item.questions.forEach(subQ => {
              expandedFallback.push({
                ...subQ,
                content: materialHtml + subQ.content,
                source: item.source || '资料分析'
              });
            });
          } else {
            expandedFallback.push(item);
          }
        });
        res.data = expandedFallback;
      }
    }

    // D. 数据标准化处理及动态时长调整
    if (res.data && res.data.length > 0) {
      res.data = res.data.map(q => {
        let kp = q.knowledgePoint || (Array.isArray(q.knowledgePoints) ? q.knowledgePoints[0] : q.knowledgePoints);
        
        // --- 核心逻辑：根据用户掌握程度动态调整推荐用时 ---
        // 1. 确定题目的模块 key (处理中英文转换及大小写)
        let moduleKey = q.type || queryModule || 'verbal';
        const reverseMap = {
          '言语理解': 'verbal', '数量关系': 'quantitative', '判断推理': 'reasoning',
          '资料分析': 'dataAnalysis', '常识判断': 'commonSense', '时政聚焦': 'politics'
        };
        if (reverseMap[moduleKey]) moduleKey = reverseMap[moduleKey];
        
        // 2. 获取该模块正确率 (如果没有数据则默认为 50%)
        const userAccuracy = userModuleStats[moduleKey] || 50;
        
        // 3. 计算动态调整比例
        // 规则：正确率 > 80% (强项) 乘 0.7; > 60% 乘 0.85; < 40% (弱项) 乘 1.2
        let ratio = 1.0;
        if (userAccuracy > 80) ratio = 0.7;
        else if (userAccuracy > 60) ratio = 0.85;
        else if (userAccuracy < 40) ratio = 1.2;
        
        const originalTime = q.recommendedTime || 60; // 默认 60s
        const dynamicTime = Math.round(originalTime * ratio);
        
        return {
          ...q,
          answer: (q.answer !== undefined) ? q.answer : q.correctAnswer,
          explanation: q.explanation || q.analysis || '暂无解析',
          knowledgePoint: kp || '未分类',
          recommendedTime: dynamicTime, // 覆盖为动态计算后的时间
          originalTime: originalTime    // 可选：保留原始时间备查
        };
      });
    }

    // 5. 最终兜底：如果专项库整个是空的，才去全库找
    if (!res.data || res.data.length === 0) {
      // 关键修复：从 questions 库抽题时也要匹配 type，否则随机抽会抽到其他类别的题
      const matchCriteria = queryModule ? { type: queryModule } : {};
      const allRes = await db.collection('questions')
        .aggregate()
        .match(matchCriteria) 
        .project({
          _id: 1, 
          content: 1, 
          options: 1, 
          answer: 1,
          correctAnswer: 1, // 兼容旧表字段名
          explanation: 1,
          analysis: 1,      // 兼容旧表解析字段名
          knowledgePoint: '$knowledgePoints',
          type: 1
        })
        .sample({ 
          size: limit 
        })
        .end()
        
      if (allRes.data) {
        allRes.data = allRes.data.map(q => {
          let kp = q.knowledgePoint;
          if (Array.isArray(kp)) kp = kp[0];
          // 统一字段名：answer 和 explanation
          const finalAnswer = (q.answer !== undefined) ? q.answer : q.correctAnswer;
          const finalExpl = q.explanation || q.analysis || '暂无解析';
          return { 
            ...q, 
            answer: finalAnswer,
            explanation: finalExpl,
            knowledgePoint: kp || '未分类' 
          };
        });
      }
        
      return {
        code: 0,
        recommendReason: queryModule ? `题库该专项暂无新题，为您推荐历史数据` : '智能推荐混合练习',
        data: allRes.data
      }
    }

    // 6. 成功返回结果
    const moduleLabel = getModuleName(queryModule || 'verbal');
    return {
      code: 0,
      recommendReason: type ? `专项练习: ${moduleLabel}` : `智能推荐`,
      data: res.data
    }
    
  } catch (e) {
    console.error('查询数据库异常:', e)
    return {
      code: -1,
      message: '数据库查询失败：' + e.message
    }
  }
};

/**
 * 封装兜底逻辑：从旧的通用库 questions 抽题
 */
async function fetchFullLibraryFallback(db, limit, type) {
  // 关键：处理不同命名风格在旧表中的 match
  let matchType = type;
  const reverseMap = {
    '资料分析': 'dataAnalysis',
    '数据分析': 'dataAnalysis',
    'commonSense': 'commonSense',
    '政治理解': 'politics'
  };
  
  if (reverseMap[type]) matchType = reverseMap[type];

  const matchCriteria = matchType ? { type: matchType } : {};
  
  const allRes = await db.collection('questions')
    .aggregate()
    .match(matchCriteria) 
    .project({
      _id: 1, 
      content: 1, 
      options: 1, 
      answer: 1,
      correctAnswer: 1, // 兼容旧表字段名
      explanation: 1,
      analysis: 1,      // 兼容旧表解析字段名
      recommendedTime: 1, // 增加导出字段
      knowledgePoint: '$knowledgePoints',
      type: 1
    })
    .sample({ 
      size: limit 
    })
    .end()
    
  if (allRes.data) {
    allRes.data = allRes.data.map(q => {
      let kp = q.knowledgePoint;
      if (Array.isArray(kp)) kp = kp[0];
      // 统一字段名：answer 和 explanation
      const finalAnswer = (q.answer !== undefined) ? q.answer : q.correctAnswer;
      const finalExpl = q.explanation || q.analysis || '暂无解析';
      return { 
        ...q, 
        answer: finalAnswer,
        explanation: finalExpl,
        knowledgePoint: kp || '未分类' 
      };
    });
  }
    
  return {
    code: 0,
    recommendReason: '题库该模块暂无新题，为您推荐混合练习',
    data: allRes.data
  }
}

/**
 * 模块名称映射函数：将数据库 value 转为中文显示
 */
function getModuleName(val) {
  const map = { 
    verbal: '言语理解', 
    quantitative: '数量关系', 
    reasoning: '判断推理', 
    dataAnalysis: '资料分析', 
    commonSense: '常识判断',
    politics: '政治理解'
  }
  return map[val] || '综合模块'
}