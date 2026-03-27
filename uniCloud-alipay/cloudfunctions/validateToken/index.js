'use strict';
const db = uniCloud.database()

exports.main = async (event, context) => {
  const { token, userId } = event
  
  if (!token || !userId) {
    return { valid: false, message: '缺少参数' }
  }
  
  try {
    // 实际项目中应该使用redis或数据库存储token有效期
    // 这里简化处理，仅验证userId存在
    const { data } = await db.collection('users')
      .doc(userId)
      .field({ _id: true, status: true })
      .get()
    
    if (data.length === 0) {
      return { valid: false, message: '用户不存在' }
    }
    
    if (data[0].status === 'disabled') {
      return { valid: false, message: '账号已被禁用' }
    }
    
    return { valid: true, userId: userId }
    
  } catch (error) {
    return { valid: false, message: '验证失败' }
  }
}