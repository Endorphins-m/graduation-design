'use strict';
const db = uniCloud.database()
const { generateToken, hashPassword, response, getClientIP } = require('../common/utils.js')

exports.main = async (event, context) => {
  const { username, password } = event
  
  // 参数验证
  if (!username || !password) {
    return response(-1, '账号和密码不能为空')
  }
  
  if (password.length < 6) {
    return response(-1, '密码至少6位')
  }
  
  try {
    // 查找用户
    const { data: users } = await db.collection('users')
      .where({ username: username })
      .get()
    
    if (users.length === 0) {
      return response(-1, '用户不存在')
    }
    
    const user = users[0]
    
    // 验证密码
    const hashedPassword = hashPassword(password)
    if (user.password !== hashedPassword) {
      // 记录失败日志
      await db.collection('login_logs').add({
        userId: user._id,
        username: username,
        type: 'password',
        ip: getClientIP(context),
        device: context.OS,
        status: 'failed',
        reason: '密码错误',
        createdAt: new Date()
      })
      
      return response(-1, '密码错误')
    }
    
    // 检查账号状态
    if (user.status === 'disabled') {
      return response(-1, '账号已被禁用')
    }
    
    // 更新登录时间
    await db.collection('users').doc(user._id).update({
      lastLogin: new Date()
    })
    
    // 生成Token
    const token = generateToken(user._id)
    
    // 准备用户信息（删除敏感字段）
    const userInfo = { ...user }
    delete userInfo.password
    
    // 记录成功日志
    await db.collection('login_logs').add({
      userId: user._id,
      username: username,
      type: 'password',
      ip: getClientIP(context),
      device: context.OS,
      status: 'success',
      createdAt: new Date()
    })
    
    return response(0, '登录成功', {
      token,
      userId: user._id,
      isNewUser: false,
      userInfo
    })
    
  } catch (error) {
    console.error('密码登录失败:', error)
    return response(-1, '登录失败，请稍后重试')
  }
}