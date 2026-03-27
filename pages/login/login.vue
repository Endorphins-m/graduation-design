<template>
  <view class="login-container">
    <!-- 顶部背景 -->
    <view class="header-bg">
      <view class="bg-pattern"></view>
      <view class="logo-area">
        <view class="logo-box">
          <text class="logo-icon">📚</text>
        </view>
        <text class="app-name">智学公考</text>
        <text class="app-slogan">个性化学习，科学备考</text>
      </view>
    </view>
    
    <!-- 登录卡片 -->
    <view class="login-card">
      <!-- 切换标签 -->
      <view class="tab-bar">
        <view 
          v-for="(tab, index) in tabs" 
          :key="index"
          class="tab-item"
          :class="{ active: currentTab === index }"
          @click="switchTab(index)"
        >
          <text class="tab-text">{{ tab.name }}</text>
          <view v-if="currentTab === index" class="tab-line"></view>
        </view>
      </view>
      
      <!-- 登录表单 -->
      <view class="form-area">
        <!-- 手机号输入 -->
        <view class="input-group">
          <view class="input-icon">
            <u-icon name="phone-fill" color="#9CA3AF" size="40"></u-icon>
          </view>
          <input 
            v-model="form.phone"
            type="number"
            maxlength="11"
            placeholder="请输入手机号"
            class="input-field"
            @blur="validatePhone"
          />
          <u-icon 
            v-if="form.phone" 
            name="close-circle-fill" 
            color="#D1D5DB" 
            size="36"
            @click="form.phone = ''"
          ></u-icon>
        </view>
        <text v-if="errors.phone" class="error-text">{{ errors.phone }}</text>
        
        <!-- 验证码输入 (验证码登录/注册) -->
        <view v-if="currentTab !== 1" class="input-group">
          <view class="input-icon">
            <u-icon name="lock-fill" color="#9CA3AF" size="40"></u-icon>
          </view>
          <input 
            v-model="form.code"
            type="number"
            maxlength="6"
            placeholder="请输入验证码"
            class="input-field code-input"
          />
          <view 
            class="code-btn"
            :class="{ disabled: counting }"
            @click="sendCode"
          >
            <text v-if="!counting">获取验证码</text>
            <text v-else>{{ count }}s后重试</text>
          </view>
        </view>
        
        <!-- 1. 设置密码 (在 密码登录 和 注册账号 时都显示) -->
        <view v-if="currentTab === 1 || currentTab === 2" class="input-group">
          <view class="input-icon">
            <u-icon name="lock-fill" color="#9CA3AF" size="40"></u-icon>
          </view>
          <input 
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="currentTab === 2 ? '请设置6-20位密码' : '请输入密码'"
            class="input-field"
            maxlength="20"
          />
          <u-icon 
            :name="showPassword ? 'eye-fill' : 'eye-off-fill'" 
            color="#9CA3AF" 
            size="40"
            @click="showPassword = !showPassword"
          ></u-icon>
        </view>
        
        <!-- 2. 再次确认密码 (仅在 注册账号 时显示) -->
        <view v-if="currentTab === 2" class="input-group">
          <view class="input-icon">
            <u-icon name="lock-fill" color="#9CA3AF" size="40"></u-icon>
          </view>
          <input 
            v-model="form.confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            placeholder="请再次输入密码以确认"
            class="input-field"
            maxlength="20"
          />
          <u-icon 
            :name="showConfirm ? 'eye-fill' : 'eye-off-fill'" 
            color="#9CA3AF" 
            size="40"
            @click="showConfirm = !showConfirm"
          ></u-icon>
        </view>
        
        <!-- 登录/注册按钮 -->
        <u-button 
          type="primary" 
          shape="circle"
          size="large"
          :loading="loading"
          :disabled="!canSubmit"
          @click="handleSubmit"
          custom-style="margin-top: 40rpx;"
        >
          {{ buttonText }}
        </u-button>
        
        <!-- 其他选项 -->
        <view class="other-options">
          <text v-if="currentTab !== 2" class="option-link" @click="goForgot">
            忘记密码？
          </text>
          <text v-if="currentTab === 1" class="option-link" @click="switchTab(0)">
            验证码登录
          </text>
          <text v-if="currentTab === 0" class="option-link" @click="switchTab(1)">
            密码登录
          </text>
        </view>
      </view>
    </view>
    
    <!-- 底部提示 -->
    <view class="bottom-hint">
      <text>未注册手机号验证后将自动创建账号</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      tabs: [
        { name: '验证码登录', type: 'code' },
        { name: '密码登录', type: 'password' },
        { name: '注册账号', type: 'register' }
      ],
      currentTab: 0,
      
      form: {
        phone: '',
        code: '',
        password: '',
        confirmPassword: ''
      },
      
      errors: {
        phone: ''
      },
      
      showPassword: false,
      showConfirm: false,
      counting: false,
      count: 60,
      timer: null,
      loading: false
    }
  },
  
  computed: {
    buttonText() {
      const texts = ['登录', '登录', '注册']
      return texts[this.currentTab]
    },
    
canSubmit() {
    if (!this.form.phone || this.errors.phone) {
      console.log('canSubmit false: 手机号问题')
      return false
    }
    
    if (this.currentTab === 0) { // 验证码登录
      const result = this.form.code.length === 6
      console.log('验证码登录 canSubmit:', result)
      return result
    } else if (this.currentTab === 1) { // 密码登录
      const result = this.form.password.length >= 6
      console.log('密码登录 canSubmit:', result)
      return result
    } else { // 注册
      const result = this.form.code.length === 6 && 
             this.form.password.length >= 6 &&
             this.form.password === this.form.confirmPassword
      console.log('注册 canSubmit:', result, {
        codeLength: this.form.code.length,
        pwdLength: this.form.password.length,
        pwdMatch: this.form.password === this.form.confirmPassword
      })
      return result
    }
  },
  },
  
  onUnload() {
    this.clearTimer()
  },
  
  methods: {
    // 切换标签
    switchTab(index) {
      this.currentTab = index
      this.clearForm()
    },
    
    // 清空表单
    clearForm() {
      this.form.code = ''
      this.form.password = ''
      this.form.confirmPassword = ''
      this.errors.phone = ''
    },
    
    // 验证手机号
    validatePhone() {
      const reg = /^1[3-9]\d{9}$/
      if (!this.form.phone) {
        this.errors.phone = '请输入手机号'
        return false
      } else if (!reg.test(this.form.phone)) {
        this.errors.phone = '手机号格式错误'
        return false
      } else {
        this.errors.phone = ''
        return true
      }
    },
    
    // 发送验证码
    async sendCode() {
      if (this.counting) return
      if (!this.validatePhone()) return
      
      try {
        uni.showLoading({ title: '发送中...' })
        
        const { result } = await uniCloud.callFunction({
          name: 'sendVerifyCode',
          data: {
            phone: this.form.phone,
            type: this.currentTab === 2 ? 'register' : 'login'
          }
        })
        
        uni.hideLoading()
        
        if (result.code === 0) {
          uni.showToast({ title: '验证码已发送', icon: 'success' })
          this.startCount()
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: '发送失败', icon: 'none' })
      }
    },
    
    // 倒计时
    startCount() {
      this.counting = true
      this.count = 60
      this.timer = setInterval(() => {
        this.count--
        if (this.count <= 0) {
          this.clearTimer()
        }
      }, 1000)
    },
    
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      this.counting = false
    },
    
    // 提交
    async handleSubmit() {

		  console.log('=== 注册按钮点击 ===')
  console.log('当前标签:', this.currentTab)
  console.log('手机号:', this.form.phone)
  console.log('验证码:', this.form.code)
  console.log('密码:', this.form.password)
  console.log('canSubmit:', this.canSubmit)
  console.log('loading:', this.loading)
      if (!this.validatePhone()) return
      
      this.loading = true
      
      try {
        let result
        
        if (this.currentTab === 0) {
          // 验证码登录
          result = await uniCloud.callFunction({
            name: 'loginByCode',
            data: {
              phone: this.form.phone,
              code: this.form.code
            }
          })
        } else if (this.currentTab === 1) {
          // 密码登录
          result = await uniCloud.callFunction({
            name: 'loginByPassword',
            data: {
              phone: this.form.phone,
              password: this.form.password
            }
          })
        } else {
          // 注册
          result = await uniCloud.callFunction({
            name: 'register',
            data: {
              phone: this.form.phone,
              code: this.form.code,
              password: this.form.password
            }
          })
        }
        
        if (result.result.code === 0) {
          // 保存登录状态
          uni.setStorageSync('token', result.result.token)
          uni.setStorageSync('userId', result.result.userId)
          uni.setStorageSync('userInfo', result.result.userInfo)
          
          // 设置全局数据
          getApp().globalData.userId = result.result.userId
          getApp().globalData.token = result.result.token
          
          uni.showToast({ 
            title: this.currentTab === 2 ? '注册成功' : '登录成功', 
            icon: 'success' 
          })
          
          // 新用户跳转到测评页，老用户跳转到首页
          setTimeout(() => {
            if (result.result.isNewUser) {
              uni.redirectTo({ url: '/pages/assessment/assessment' })
            } else {
              uni.switchTab({ url: '/pages/plan/plan' })
            }
          }, 1500)
        } else {
          uni.showToast({ title: result.result.message, icon: 'none' })
        }
	} catch (e) {
  // 重点：把错误打印出来，或者用 Modal 弹出来
  console.error('注册过程中发生的真实错误：', e);
  uni.showModal({
    title: '排查错误',
    content: e.message || JSON.stringify(e),
    showCancel: false
  });
} finally {
  this.loading = false
}
    },
    
    // 忘记密码
    goForgot() {
      uni.navigateTo({ url: '/pages/forgot-password/index' })
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: #F3F4F6;
  position: relative;
}

/* 顶部背景 */
.header-bg {
  height: 400rpx;
  background: linear-gradient(135deg, #2E5BFF 0%, #1E40AF 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  background-image: radial-gradient(circle at 20% 50%, #FFFFFF 2px, transparent 2px),
                    radial-gradient(circle at 80% 30%, #FFFFFF 1px, transparent 1px);
  background-size: 60rpx 60rpx, 40rpx 40rpx;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}

.logo-box {
  width: 140rpx;
  height: 140rpx;
  background: #FFFFFF;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.2);
  margin-bottom: 24rpx;
}

.logo-icon {
  font-size: 80rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 12rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 登录卡片 */
.login-card {
  background: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  margin-top: -40rpx;
  padding: 40rpx 30rpx;
  min-height: calc(100vh - 360rpx);
}

/* 标签栏 */
.tab-bar {
  display: flex;
  justify-content: space-around;
  margin-bottom: 40rpx;
  border-bottom: 2rpx solid #F3F4F6;
  padding-bottom: 20rpx;
}

.tab-item {
  position: relative;
  padding: 20rpx 30rpx;
  cursor: pointer;
}

.tab-text {
  font-size: 30rpx;
  color: #6B7280;
  transition: all 0.3s;
}

.tab-item.active .tab-text {
  color: #2E5BFF;
  font-weight: bold;
}

.tab-line {
  position: absolute;
  bottom: -22rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 6rpx;
  background: #2E5BFF;
  border-radius: 3rpx;
}

/* 表单区域 */
.form-area {
  margin-bottom: 40rpx;
}

.input-group {
  display: flex;
  align-items: center;
  background: #F9FAFB;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;
}

.input-group:focus-within {
  border-color: #2E5BFF;
  background: #FFFFFF;
}

.input-icon {
  margin-right: 20rpx;
}

.input-field {
  flex: 1;
  font-size: 30rpx;
  color: #1F2937;
  height: 48rpx;
}

.input-field::placeholder {
  color: #9CA3AF;
}

.code-input {
  width: 200rpx;
}

.code-btn {
  padding: 16rpx 24rpx;
  background: #E8EFFF;
  border-radius: 12rpx;
  margin-left: 20rpx;
}

.code-btn text {
  font-size: 26rpx;
  color: #2E5BFF;
  font-weight: 500;
}

.code-btn.disabled {
  background: #F3F4F6;
}

.code-btn.disabled text {
  color: #9CA3AF;
}

.error-text {
  font-size: 24rpx;
  color: #FF4D4F;
  margin-left: 24rpx;
  margin-bottom: 16rpx;
  display: block;
}

/* 其他选项 */
.other-options {
  display: flex;
  justify-content: space-between;
  margin-top: 30rpx;
}

.option-link {
  font-size: 26rpx;
  color: #2E5BFF;
}

/* 底部提示 */
.bottom-hint {
  text-align: center;
  padding: 30rpx;
  margin-top: 20rpx;
}

.bottom-hint text {
  font-size: 24rpx;
  color: #9CA3AF;
}
</style>