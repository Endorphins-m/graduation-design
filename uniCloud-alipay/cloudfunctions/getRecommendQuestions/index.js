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
  let queryModule = type; // 初始查询目标设为前端传入的 type

  // 1. 如果前端没有指定 type，则需要通过算法分析出用户的薄弱项
  if (!queryModule) {
    if (userId && userId !== 'test-user-id') {
      try {
        const userRes = await db.collection('users').doc(userId).get()
        if (userRes.data && userRes.data.length > 0) {
          userProfile = userRes.data[0].profile || defaultProfile
        }
      } catch (e) {
        console.error('获取用户信息失败:', e)
      }
    }
    
    // 找出画像中分值最低的模块
    let minScore = 101 
    for (let key in userProfile) {
      if (userProfile[key] < minScore) {
        minScore = userProfile[key];
        queryModule = key;
      }
    }
  }

  try {
    // 2. 聚合查询：从数据库随机抽取题目
    // 使用 match 阶段进行筛选，使用 sample 阶段进行随机
    let res = await db.collection('questions')
      .aggregate()
      .match({
        type: queryModule 
      })
      .sample({ 
        size: limit 
      })
      .end()

    // 3. 兜底逻辑：如果该特定模块还没导入题目（结果为空），则从全库随机抽取题目
    if (!res.data || res.data.length === 0) {
      const allRes = await db.collection('questions')
        .aggregate()
        .sample({ 
          size: limit 
        })
        .end()
        
      return {
        code: 0,
        recommendReason: '题库该模块暂无题目，为你全库随机推荐',
        data: allRes.data
      }
    }

    // 4. 成功返回结果
    const moduleLabel = getModuleName(queryModule);
    return {
      code: 0,
      recommendReason: type ? `专项练习: ${moduleLabel}` : `智能推荐(薄弱项): ${moduleLabel}`,
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
 * 模块名称映射函数：将数据库 value 转为���文显示
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