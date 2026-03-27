'use strict';
const db = uniCloud.database()
const { validatePhone, generateCode, response } = require('../common/utils.js')

exports.main = async (event, context) => {
  const { phone, type = 'login' } = event
  
  // 参数验证
  if (!phone) {
    return response(-1, '手机号不能为空')
  }
  
  if (!validatePhone(phone)) {
    return response(-1, '手机号格式错误')
  }
  
  try {
    // 检查发送频率（60秒内不能重复发送）
    const oneMinuteAgo = Date.now() - 60000
    const { data: recentRecords } = await db.collection('verify_codes')
      .where({
        phone: phone,
        createdAt: db.command.gt(oneMinuteAgo)
      })
      .get()
    
    if (recentRecords.length > 0) {
      return response(-1, '发送过于频繁，请60秒后重试')
    }
    
    // 生成验证码
    const code = generateCode()
    
    // 保存到数据库（5分钟有效）
    await db.collection('verify_codes').add({
      phone: phone,
      code: code,
      type: type,
      used: false,
      createdAt: Date.now(),
      expireAt: Date.now() + 5 * 60 * 1000
    })
    
    // TODO: 接入短信服务（阿里云/腾讯云）
    // 开发环境：直接返回验证码
    console.log(`[验证码] ${phone}: ${code}`)
    
    return response(0, '发送成功', { 
      // 生产环境不要返回code，这里仅用于开发测试
      code: process.env.NODE_ENV === 'development' ? code : undefined 
    })
    
  } catch (error) {
    console.error('发送验证码失败:', error)
    return response(-1, '发送失败，请稍后重试')
  }
}