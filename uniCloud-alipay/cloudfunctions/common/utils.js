const crypto = require('crypto')

module.exports = {
  // 生成Token
  generateToken(userId) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    return crypto.createHash('md5').update(userId + timestamp + random).digest('hex')
  },
  
  // 加密密码
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
  },
  
  // 验证手机号
  validatePhone(phone) {
    const reg = /^1[3-9]\d{9}$/
    return reg.test(phone)
  },
  
  // 生成6位验证码
  generateCode() {
    return Math.random().toString().slice(2, 8)
  },
  
  // 统一响应格式
  response(code, message, data = null) {
    return { code, message, data }
  },
  
  // 获取客户端IP
  getClientIP(context) {
    return context.CLIENTIP || 'unknown'
  }
}