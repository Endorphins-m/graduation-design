<template>
  <view class="login-container">
    <!-- 顶部背景 -->
    <view class="header-bg">
      <view class="bg-pattern"></view>
      <view class="logo-area">
        <view class="logo-box">
          <text class="logo-icon">📚</text>
        </view>
        <view class="app-info">
          <text class="app-name">智学公考</text>
          <text class="app-slogan">个性化学习，科学备考</text>
        </view>
      </view>
    </view>
    
    <!-- 登录卡片 -->
    <view class="main-card shadow-lg">
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
          <view v-if="currentTab === index" class="tab-line animated bounceIn"></view>
        </view>
      </view>
      
      <!-- 登录表单 -->
      <view class="form-area">
        <!-- 账号输入 -->
        <view class="input-group" :class="{ 'input-focus': focused === 'username' }">
          <view class="input-icon">
            <u-icon name="account" :color="focused === 'username' ? '#2E5BFF' : '#9CA3AF'" size="44"></u-icon>
          </view>
          <input 
            v-model="form.username"
            type="text"
            placeholder="请输入账号 (字母或数字)"
            class="input-field"
            @focus="focused = 'username'"
            @blur="focused = ''"
          />
          <u-icon 
            v-if="form.username" 
            name="close-circle-fill" 
            color="#D1D5DB" 
            size="36"
            @click="form.username = ''"
          ></u-icon>
        </view>
        
        <!-- 密码输入 (登录和注册共用) -->
        <view class="input-group" :class="{ 'input-focus': focused === 'password' }">
          <view class="input-icon">
            <u-icon name="lock" :color="focused === 'password' ? '#2E5BFF' : '#9CA3AF'" size="44"></u-icon>
          </view>
          <input 
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="currentTab === 1 ? '请设置6-20位密码' : '请输入密码'"
            class="input-field"
            maxlength="20"
            @focus="focused = 'password'"
            @blur="focused = ''"
          />
          <view class="eye-box" @click="showPassword = !showPassword">
            <view class="eye-wrapper" :class="{ 'is-active': showPassword }">
              <u-icon 
                :name="showPassword ? 'eye' : 'eye-off'" 
                :color="showPassword ? '#2E5BFF' : '#9CA3AF'" 
                size="42"
              ></u-icon>
            </view>
          </view>
        </view>
        
        <!-- 再次确认密码 (仅在注册时显示) -->
        <view v-if="currentTab === 1" class="input-group animated fadeIn" :class="{ 'input-focus': focused === 'confirm' }">
          <view class="input-icon">
            <u-icon name="lock-fill" :color="focused === 'confirm' ? '#2E5BFF' : '#9CA3AF'" size="44"></u-icon>
          </view>
          <input 
            v-model="form.confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            placeholder="请再次确认密码"
            class="input-field"
            maxlength="20"
            @focus="focused = 'confirm'"
            @blur="focused = ''"
          />
          <view class="eye-box" @click="showConfirm = !showConfirm">
            <view class="eye-wrapper" :class="{ 'is-active': showConfirm }">
              <u-icon 
                :name="showConfirm ? 'eye' : 'eye-off'" 
                :color="showConfirm ? '#2E5BFF' : '#9CA3AF'" 
                size="42"
              ></u-icon>
            </view>
          </view>
        </view>
        
        <!-- 提交按钮 -->
        <view class="btn-group">
          <u-button 
            type="primary" 
            shape="circle"
            class="submit-btn"
            :loading="loading"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            {{ currentTab === 0 ? '立即登录' : '注册账号' }}
          </u-button>
        </view>
        
        <!-- 切换操作 -->
        <view class="footer-links">
          <text v-if="currentTab === 0" class="link-item" @click="switchTab(1)">没有账号？去注册</text>
          <text v-else class="link-item" @click="switchTab(0)">返回登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      tabs: [{ name: '密码登录' }, { name: '账号注册' }],
      currentTab: 0,
      protocolCheck: [],
      focused: '',
      form: { username: '', password: '', confirmPassword: '' },
      showPassword: false,
      showConfirm: false,
      loading: false
    }
  },
  
  computed: {
    canSubmit() {
      const { username, password, confirmPassword } = this.form
      if (!username || password.length < 6) return false
      if (this.currentTab === 1) return password === confirmPassword
      return true
    }
  },
  
  methods: {
    switchTab(index) {
      this.currentTab = index
      this.form.password = ''; this.form.confirmPassword = ''
    },
    
    // 核心提交逻辑
    async handleSubmit() {
      if (this.currentTab === 1 && this.form.password !== this.form.confirmPassword) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' })
        return
      }
      this.loading = true
      
      try {
        const cloudName = this.currentTab === 0 ? 'loginByPassword' : 'register'
        const res = await uniCloud.callFunction({
          name: cloudName,
          data: { 
            username: this.form.username, 
            password: this.form.password 
          }
        })
        
        const result = res.result
        if (result.code === 0) {
          uni.showToast({ 
            title: this.currentTab === 1 ? '注册成功' : '登录成功', 
            icon: 'success' 
          })
          
          uni.setStorageSync('token', result.data.token)
          uni.setStorageSync('userId', result.data.userId) // 添加这一行，存储userId
          uni.setStorageSync('userInfo', result.data.userInfo || { username: this.form.username })
          
          setTimeout(() => {
            if (result.data.isNewUser) {
              uni.redirectTo({ url: '/pages/assessment/assessment' })
            } else {
              uni.switchTab({ url: '/pages/library/library' })
            }
          }, 800)
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '操作失败，请重试', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    goForgot() {
      uni.showToast({ title: '请联系管理员重置密码', icon: 'none' })
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background-color: #f8faff;
  display: flex;
  flex-direction: column;
}

.header-bg {
  position: relative;
  height: 480rpx;
  background: linear-gradient(135deg, #2E5BFF 0%, #6485FF 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom-left-radius: 80rpx;
  border-bottom-right-radius: 80rpx;
  overflow: hidden;
  
  .bg-pattern {
    position: absolute;
    width: 150%;
    height: 150%;
    background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 40rpx 40rpx;
    transform: rotate(15deg);
  }
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  
  .logo-box {
    width: 140rpx;
    height: 140rpx;
    background: #fff;
    border-radius: 40rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.1);
    margin-bottom: 30rpx;
    .logo-icon { font-size: 70rpx; }
  }
  
  .app-name {
    font-size: 48rpx;
    font-weight: bold;
    color: #fff;
    letter-spacing: 4rpx;
  }
  
  .app-slogan {
    font-size: 24rpx;
    color: rgba(255,255,255,0.8);
    margin-top: 10rpx;
  }
}

.main-card {
  margin: -80rpx 40rpx 0;
  background: #fff;
  border-radius: 48rpx;
  padding: 60rpx 40rpx;
  z-index: 2;
  box-shadow: 0 20rpx 60rpx rgba(46, 91, 255, 0.08);
}

.tab-bar {
  display: flex;
  justify-content: space-around;
  margin-bottom: 60rpx;
  
  .tab-item {
    position: relative;
    padding: 20rpx 0;
    
    .tab-text {
      font-size: 32rpx;
      color: #9CA3AF;
      transition: all 0.3s;
    }
    
    &.active .tab-text {
      color: #1F2937;
      font-weight: bold;
      font-size: 36rpx;
    }
    
    .tab-line {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 8rpx;
      background: #2E5BFF;
      border-radius: 4rpx;
    }
  }
}

.input-group {
  display: flex;
  align-items: center;
  background: #F3F4F6;
  border-radius: 30rpx;
  padding: 0 30rpx;
  height: 110rpx;
  margin-bottom: 40rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;
  
  &.input-focus {
    background: #fff;
    border-color: #2E5BFF;
    box-shadow: 0 0 15rpx rgba(46, 91, 255, 0.1);
  }
  
  .input-icon { margin-right: 20rpx; }
  
  .input-field {
    flex: 1;
    font-size: 28rpx;
    color: #1F2937;
  }

  .eye-box {
    padding: 0 10rpx;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .eye-wrapper {
      width: 72rpx;
      height: 72rpx;
      background: #F0F2F5;
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &.is-active {
        background: rgba(46, 91, 255, 0.1);
        transform: rotate(15deg);
      }
      
      &:active {
        transform: scale(0.85);
        background: #E5E7EB;
      }
    }
  }
}

.btn-group {
  margin-top: 60rpx;
  
  .submit-btn {
    height: 100rpx !important;
    background: linear-gradient(90deg, #2E5BFF, #6485FF) !important;
    border: none !important;
    font-size: 32rpx !important;
    font-weight: bold !important;
    box-shadow: 0 10rpx 30rpx rgba(46, 91, 255, 0.3) !important;
  }
}

.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40rpx;
  
  .link-item {
    font-size: 26rpx;
    color: #2E5BFF;
    padding: 10rpx;
  }
}

.protocol-wrap {
  margin-top: auto;
  padding: 40rpx;
  display: flex;
  justify-content: center;
  
  .protocol-text {
    font-size: 24rpx;
    color: #9CA3AF;
    
    .highlight { color: #2E5BFF; }
  }
}

.animated { animation-duration: 0.5s; animation-fill-mode: both; }
.bounceIn { animation-name: bounceIn; }
@keyframes bounceIn {
  from, 20%, 40%, 60%, 80%, to { animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1); }
  0% { opacity: 0; transform: scale3d(0.3, 0.3, 0.3) translateX(-50%); }
  to { opacity: 1; transform: scale3d(1, 1, 1) translateX(-50%); }
}
</style>