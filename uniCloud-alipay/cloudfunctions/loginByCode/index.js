'use strict';
const db = uniCloud.database()
const { generateToken, response, getClientIP } = require('../common/utils.js')

exports.main = async (event, context) => {
  const { phone, code } = event
  
  // 参数验证
  if (!phone || !code) {
    return response(-1, '手机号和验证码不能为空')
  }
  
  try {
    // 验证验证码
    const now = Date.now()
    const { data: records } = await db.collection('verify_codes')
      .where({
        phone: phone,
        code: code,
        used: false,
        expireAt: db.command.gt(now)
      })
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get()
    
    if (records.length === 0) {
      return response(-1, '验证码错误或已过期')
    }
    
    // 标记验证码已使用
    await db.collection('verify_codes').doc(records[0]._id).update({
      used: true
    })
    
    // 查找或创建用户
    let { data: users } = await db.collection('users')
      .where({ phone: phone })
      .get()
    
    let userId
    let isNewUser = false
    let userInfo = null
    
    if (users.length === 0) {
      // 新用户：创建账号
      const result = await db.collection('users').add({
        phone: phone,
        username: '用户' + phone.slice(-4),
        avatar: '',
        level: 1,
        title: '备考新手',
        streak: 0,
        totalQuestions: 0,
        accuracy: 0,
        studyHours: 0,
        profile: {
          verbal: 50,
          quantitative: 50,
          reasoning: 50,
          dataAnalysis: 50,
          commonSense: 50
        },
        learningPrefs: {
          dailyLimit: 50,
          weakFocusRatio: 0.6,
          reminderTime: '20:00'
        },
        lastLogin: new Date(),
        createdAt: new Date(),
        status: 'active'
      })
      
      userId = result.id
      isNewUser = true
    } else {
      // 老用户：更新登录时间
      userId = users[0]._id
      userInfo = users[0]
      
      // 删除敏感字段
      delete userInfo.password
      
      await db.collection('users').doc(userId).update({
        lastLogin: new Date()
      })
    }
    
    // 生成Token
    const token = generateToken(userId)
    
    // 记录登录日志
    await db.collection('login_logs').add({
      userId: userId,
      phone: phone,
      type: 'code',
      ip: getClientIP(context),
      device: context.OS,
      status: 'success',
      createdAt: new Date()
    })
    
    return response(0, '登录成功', {
      token,
      userId,
      isNewUser,
      userInfo
    })
    
  } catch (error) {
    console.error('验证码登录失败:', error)
    return response(-1, '登录失败，请稍后重试')
  }
}