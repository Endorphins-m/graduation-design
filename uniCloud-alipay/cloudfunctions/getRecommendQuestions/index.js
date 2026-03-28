'use strict';
const db = uniCloud.database()

exports.main = async (event, context) => {
  const { userId, limit = 10 } = event
  
  // 默认能力画像（用于未登录或新用户）
  const defaultProfile = { 
    verbal: 50, 
    quantitative: 50, 
    reasoning: 50, 
    dataAnalysis: 50, 
    commonSense: 50 
  }
  
  let userProfile = defaultProfile;

  // 1. 获取用户画像
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
  
  // 2. 找出最弱的模块（分值最低的）
  let weakModule = 'verbal'
  let minScore = 101 
  
  for (let key in userProfile) {
    if (userProfile[key] < minScore) {
      minScore = userProfile[key];
      weakModule = key;
    }
  }

  try {
    // 3. 聚合查询：从数据库随机抽取题目
    // 注意：聚合查询中使用 match 代替 where 进行筛选
    let res = await db.collection('questions')
      .aggregate()
      .match({
        type: weakModule // 确保数据库中的字段名是 type
      })
      .sample({ 
        size: limit 
      })
      .end()

    // 4. 兜底逻辑：如果该薄弱模块还没导入题目，则从全库随机抽取
    if (!res.data || res.data.length === 0) {
      const allRes = await db.collection('questions')
        .aggregate()
        .sample({ 
          size: limit 
        })
        .end()
        
      return {
        code: 0,
        recommendReason: '题库初次加载，为你随机推荐',
        data: allRes.data
      }
    }

    // 5. 成功返回薄弱项题目
    return {
      code: 0,
      recommendReason: `基于你的薄弱点: ${getModuleName(weakModule)}`,
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
 * 模块名称映射函数
 */
function getModuleName(val) {
  const map = { 
    verbal: '言语理解', 
    quantitative: '数量关系', 
    reasoning: '判断推理', 
    dataAnalysis: '资料分析', 
    commonSense: '常识判断' 
  }
  return map[val] || '综合模块'
}