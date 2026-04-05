'use strict';
const db = uniCloud.database()
const crypto = require('crypto')

// 工具函数
function hashPassword(password) {
	return crypto.createHash('sha256').update(password).digest('hex')
}

function generateToken(userId) {
	const timestamp = Date.now()
	const random = Math.random().toString(36).substring(2)
	return crypto.createHash('md5').update(userId + timestamp + random).digest('hex')
}

function response(code, message, data = null) {
	return { code, message, data }
}

exports.main = async (event, context) => {
	const { username, password } = event
	
	console.log('注册请求:', { username, password: '***' })
	
	// 参数验证
	if (!username || !password) {
		return response(-1, '账号和密码不能为空')
	}
	
	// 账号格式验证 (3-20位字母数字)
	const usernameReg = /^[a-zA-Z0-9_]{3,20}$/
	if (!usernameReg.test(username)) {
		return response(-1, '账号应为3-20位字母、数字或下划线')
	}
	
	// 密码长度验证
	if (password.length < 6 || password.length > 20) {
		return response(-1, '密码长度应为6-20位')
	}
	
	try {
		// 检查账号是否已注册
		const { data: existing } = await db.collection('users')
			.where({ username: username })
			.get()
		
		if (existing.length > 0) {
			return response(-1, '该账号已存在，请尝试其他账号')
		}
		
		// 密码加密
		const hashedPassword = hashPassword(password)
		
		// 创建用户
		const result = await db.collection('users').add({
			username: username,
			password: hashedPassword,
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
		
		console.log('用户创建成功:', result.id)
		
		// 生成Token
		const token = generateToken(result.id)
		
		return response(0, '注册成功', {
			token: token,
			userId: result.id,
			isNewUser: true
		})
		
	} catch (error) {
		console.error('注册失败:', error)
		return response(-1, '注册失败: ' + error.message)
	}
}