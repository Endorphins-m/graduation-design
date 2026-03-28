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
        
        <!-- 1. 密码输入 (密码登录 和 注册账号) -->
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
          <text v-if="currentTab !== 2" class="option-link" @click="goForgot">忘记密码？</text>
          <text v-if="currentTab === 1" class="option-link" @click="switchTab(0)">验证码登录</text>
          <text v-if="currentTab === 0" class="option-link" @click="switchTab(1)">密码登录</text>
          <text v-if="currentTab !== 2" class="option-link" @click="switchTab(2)">注册账号</text>
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
      form: { phone: '', code: '', password: '', confirmPassword: '' },
      errors: { phone: '' },
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
      return ['登录', '登录', '注册'][this.currentTab]
    },
    canSubmit() {
      if (!this.form.phone || this.errors.phone) return false
      if (this.currentTab === 0) return this.form.code.length === 6
      if (this.currentTab === 1) return this.form.password.length >= 6
      return this.form.code.length === 6 && 
             this.form.password.length >= 6 &&
             this.form.password === this.form.confirmPassword
    }
  },
  
  onUnload() { this.clearTimer() },
  
  methods: {
    switchTab(index) {
      this.currentTab = index
      this.clearForm()
    },
    clearForm() {
      this.form.code = ''; this.form.password = ''; this.form.confirmPassword = ''; this.errors.phone = ''
    },
    validatePhone() {
      const reg = /^1[3-9]\d{9}$/
      if (!this.form.phone) {
        this.errors.phone = '请输入手机号'; return false
      } else if (!reg.test(this.form.phone)) {
        this.errors.phone = '手机号格式错误'; return false
      } else {
        this.errors.phone = ''; return true
      }
    },
    async sendCode() {
      if (this.counting || !this.validatePhone()) return
      try {
        uni.showLoading({ title: '发送中...' })
        const res = await uniCloud.callFunction({
          name: 'sendVerifyCode',
          data: { phone: this.form.phone, type: this.currentTab === 2 ? 'register' : 'login' }
        })
        uni.hideLoading()
        if (res.result.code === 0) {
          uni.showToast({ title: '验证码已发送' })
          this.startCount()
        } else {
          uni.showToast({ title: res.result.message, icon: 'none' })
        }
      } catch (e) {
        uni.hideLoading(); uni.showToast({ title: '发送失败', icon: 'none' })
      }
    },
    startCount() {
      this.counting = true; this.count = 60
      this.timer = setInterval(() => {
        this.count--; if (this.count <= 0) this.clearTimer()
      }, 1000)
    },
    clearTimer() {
      if (this.timer) { clearInterval(this.timer); this.timer = null }
      this.counting = false
    },
    
    // 核心提交逻辑
    async handleSubmit() {
      if (!this.validatePhone()) return
      this.loading = true
      
      try {
        let res
        const params = { phone: this.form.phone }
        
        if (this.currentTab === 0) {
          res = await uniCloud.callFunction({ name: 'loginByCode', data: { ...params, code: this.form.code } })
        } else if (this.currentTab === 1) {
          res = await uniCloud.callFunction({ name: 'loginByPassword', data: { ...params, password: this.form.password } })
        } else {
          res = await uniCloud.callFunction({ name: 'register', data: { ...params, code: this.form.code, password: this.form.password } })
        }
        
        const result = res.result
        if (result.code === 0) {
          // 1. 强制同步存入本地缓存
          uni.setStorageSync('token', result.data.token)
          uni.setStorageSync('userId', result.data.userId)
          uni.setStorageSync('userInfo', result.data.userInfo)
          
          // 2. 设置全局内存变量（双重保险）
          getApp().globalData.userId = result.data.userId
          getApp().globalData.token = result.data.token

          console.log('【LOGIN】缓存写入确认, userId:', uni.getStorageSync('userId'))

          uni.showToast({ 
            title: this.currentTab === 2 ? '注册成功' : '登录成功', 
            icon: 'success' 
          })
          
          // 3. 延迟跳转，确保缓存写入并清空 Toast
          setTimeout(() => {
            if (result.data.isNewUser) {
              uni.redirectTo({ url: '/pages/assessment/assessment' })
            } else {
              // 统一跳转到题库页（因为你是从题库进来的）
              uni.switchTab({ 
                url: '/pages/library/library',
                success: () => console.log('【LOGIN】跳转到题库页成功'),
                fail: (err) => console.error('【LOGIN】跳转失败:', err)
              })
            }
          }, 800)
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (e) {
        console.error('【LOGIN】提交异常:', e)
        uni.showToast({ title: '操作失败，请重试', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    goForgot() {
      uni.navigateTo({ url: '/pages/forgot-password/index' })
    }
  }
}
</script>

<style scoped>
/* 样式部分保持不变，确保视觉统一 */
.login-container { min-height: 100vh; background: #F3F4F6; position: relative; }
.header-bg { height: 400rpx; background: linear-gradient(135deg, #2E5BFF 0%, #1E40AF 100%); position: relative; display: flex; align-items: center; justify-content: center; }
.bg-pattern { position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background-image: radial-gradient(circle at 20% 50%, #FFFFFF 2px, transparent 2px), radial-gradient(circle at 80% 30%, #FFFFFF 1px, transparent 1px); background-size: 60rpx 60rpx, 40rpx 40rpx; }
.logo-area { display: flex; flex-direction: column; align-items: center; z-index: 1; }
.logo-box { width: 140rpx; height: 140rpx; background: #FFFFFF; border-radius: 32rpx; display: flex; align-items: center; justify-content: center; box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.2); margin-bottom: 24rpx; }
.logo-icon { font-size: 80rpx; }
.app-name { font-size: 48rpx; font-weight: bold; color: #FFFFFF; margin-bottom: 12rpx; }
.app-slogan { font-size: 28rpx; color: rgba(255, 255, 255, 0.8); }
.login-card { background: #FFFFFF; border-radius: 32rpx 32rpx 0 0; margin-top: -40rpx; padding: 40rpx 30rpx; min-height: calc(100vh - 360rpx); }
.tab-bar { display: flex; justify-content: space-around; margin-bottom: 40rpx; border-bottom: 2rpx solid #F3F4F6; padding-bottom: 20rpx; }
.tab-item { position: relative; padding: 20rpx 30rpx; cursor: pointer; }
.tab-text { font-size: 30rpx; color: #6B7280; transition: all 0.3s; }
.tab-item.active .tab-text { color: #2E5BFF; font-weight: bold; }
.tab-line { position: absolute; bottom: -22rpx; left: 50%; transform: translateX(-50%); width: 48rpx; height: 6rpx; background: #2E5BFF; border-radius: 3rpx; }
.input-group { display: flex; align-items: center; background: #F9FAFB; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; border: 2rpx solid transparent; transition: all 0.3s; }
.input-group:focus-within { border-color: #2E5BFF; background: #FFFFFF; }
.input-icon { margin-right: 20rpx; }
.input-field { flex: 1; font-size: 30rpx; color: #1F2937; height: 48rpx; }
.code-btn { padding: 16rpx 24rpx; background: #E8EFFF; border-radius: 12rpx; margin-left: 20rpx; }
.code-btn text { font-size: 26rpx; color: #2E5BFF; font-weight: 500; }
.code-btn.disabled { background: #F3F4F6; }
.code-btn.disabled text { color: #9CA3AF; }
.error-text { font-size: 24rpx; color: #FF4D4F; margin-left: 24rpx; margin-bottom: 16rpx; display: block; }
.other-options { display: flex; justify-content: space-between; margin-top: 30rpx; }
.option-link { font-size: 26rpx; color: #2E5BFF; }
.bottom-hint { text-align: center; padding: 30rpx; margin-top: 20rpx; }
.bottom-hint text { font-size: 24rpx; color: #9CA3AF; }
</style>