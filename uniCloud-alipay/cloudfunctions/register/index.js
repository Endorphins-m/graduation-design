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
	const { phone, code, password } = event
	
	console.log('注册请求:', { phone, code: '***', password: '***' })
	
	// 参数验证
	if (!phone || !code || !password) {
		return response(-1, '手机号、验证码和密码不能为空')
	}
	
	// 手机号格式验证
	const phoneReg = /^1[3-9]\d{9}$/
	if (!phoneReg.test(phone)) {
		return response(-1, '手机号格式错误')
	}
	
	// 密码长度验证
	if (password.length < 6 || password.length > 20) {
		return response(-1, '密码长度应为6-20位')
	}
	
	try {
		// 验证验证码
		const now = Date.now()
		const { data: records } = await db.collection('verify_codes')
			.where({
				phone: phone,
				code: code,
				type: 'register',
				used: false,
				expireAt: db.command.gt(now)
			})
			.orderBy('createdAt', 'desc')
			.limit(1)
			.get()
		
		console.log('验证码查询结果:', records.length)
		
		if (records.length === 0) {
			return response(-1, '验证码错误或已过期')
		}
		
		// 检查手机号是否已注册
		const { data: existing } = await db.collection('users')
			.where({ phone: phone })
			.get()
		
		if (existing.length > 0) {
			return response(-1, '该手机号已注册，请直接登录')
		}
		
		// 密码加密
		const hashedPassword = hashPassword(password)
		
		// 创建用户
		const result = await db.collection('users').add({
			phone: phone,
			password: hashedPassword,
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
		
		console.log('用户创建成功:', result.id)
		
		// 标记验证码已使用
		await db.collection('verify_codes').doc(records[0]._id).update({
			used: true
		})
		
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