'use strict';
const db = uniCloud.database()
const { hashPassword, response } = require('../common/utils.js')

exports.main = async (event, context) => {
  const { phone, code, newPassword } = event
  
  // 参数验证
  if (!phone || !code || !newPassword) {
    return response(-1, '参数不完整')
  }
  
  if (newPassword.length < 6 || newPassword.length > 20) {
    return response(-1, '密码长度应为6-20位')
  }
  
  try {
    // 验证验证码
    const now = Date.now()
    const { data: records } = await db.collection('verify_codes')
      .where({
        phone: phone,
        code: code,
        type: 'reset',
        used: false,
        expireAt: db.command.gt(now)
      })
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get()
    
    if (records.length === 0) {
      return response(-1, '验证码错误或已过期')
    }
    
    // 查找用户
    const { data: users } = await db.collection('users')
      .where({ phone: phone })
      .get()
    
    if (users.length === 0) {
      return response(-1, '用户不存在')
    }
    
    // 更新密码
    const hashedPassword = hashPassword(newPassword)
    await db.collection('users').doc(users[0]._id).update({
      password: hashedPassword,
      updatedAt: new Date()
    })
    
    // 标记验证码已使用
    await db.collection('verify_codes').doc(records[0]._id).update({
      used: true
    })
    
    return response(0, '密码重置成功，请使用新密码登录')
    
  } catch (error) {
    console.error('重置密码失败:', error)
    return response(-1, '重置失败，请稍后重试')
  }
}