<template>
  <view class="edit-container">
    <view class="form-card card">
      <view class="avatar-section" @click="chooseAvatar">
        <u-avatar :src="userInfo.avatar || '/static/default-avatar.png'" size="160" bg-color="#f5f5f5"></u-avatar>
        <view class="camera-icon">
          <u-icon name="camera-fill" color="#FFFFFF" size="32"></u-icon>
        </view>
        <text class="avatar-hint">点击更换头像</text>
      </view>

      <view class="form-item">
        <text class="label">昵称</text>
        <u-input 
          v-model="userInfo.nickname" 
          placeholder="请输入昵称" 
          border="none" 
          input-align="right"
        ></u-input>
      </view>
      
      <view class="form-item">
        <text class="label">用户名</text>
        <u-input 
          v-model="userInfo.username" 
          disabled 
          border="none" 
          input-align="right"
          color="#9CA3AF"
        ></u-input>
        <u-icon name="lock" color="#9CA3AF" size="28" style="margin-left: 10rpx;"></u-icon>
      </view>

      <view class="form-item">
        <text class="label">个人简介</text>
        <u-input 
          v-model="userInfo.bio" 
          type="textarea" 
          placeholder="写点什么介绍一下自己吧..." 
          border="none"
          auto-height
        ></u-input>
      </view>
    </view>

    <view class="action-bar">
      <u-button 
        type="primary" 
        text="保存修改" 
        shape="circle" 
        :loading="loading"
        @click="saveProfile"
      ></u-button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      userInfo: {
        nickname: '',
        username: '',
        avatar: '',
        bio: ''
      }
    }
  },
  onLoad() {
    this.loadCurrentInfo();
  },
  methods: {
    async loadCurrentInfo() {
      const userId = uni.getStorageSync('userId');
      if (!userId) return;

      try {
        const { result } = await uniCloud.callFunction({
          name: 'getUserStudyStats',
          data: { userId }
        });

        if (result.code === 0) {
          const data = result.data;
          this.userInfo = {
            nickname: data.nickname || '',
            username: data.username || '',
            avatar: data.avatar || '',
            bio: data.bio || '还没有简介哦~'
          };
        }
      } catch (e) {
        console.error(e);
      }
    },

    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0];
          uni.showLoading({ title: '上传中...' });
          
          try {
            const userId = uni.getStorageSync('userId') || 'guest';
            // 简化 cloudPath，移除多层级目录以排除权限配置干扰
            const cloudPath = `avatar_${userId}_${Date.now()}.jpg`;

            const uploadRes = await uniCloud.uploadFile({
              filePath: tempFilePath,
              cloudPath: cloudPath,
              onUploadProgress: (progress) => {
                console.log('上传进度：' + progress.loaded + '/' + progress.total);
              }
            });

            console.log('上传结果：', uploadRes);
            const fileID = uploadRes.fileID;
            
            // 解决逻辑：如果 fileID 是 https 链接则直接使用，如果是 cloud:// 则尝试转换为 https
            let avatarUrl = fileID;
            if (fileID.startsWith('cloud://')) {
              const tempUrlRes = await uniCloud.getTempFileURL({
                fileList: [fileID]
              });
              if (tempUrlRes.fileList && tempUrlRes.fileList[0].tempFileURL) {
                avatarUrl = tempUrlRes.fileList[0].tempFileURL;
              }
            }

            this.userInfo.avatar = avatarUrl;
            this.$forceUpdate();
            
            uni.showToast({ title: '已同步预览', icon: 'success' });
          } catch (e) {
            console.error('uniCloud.uploadFile 失败:', e);
            // 提示更详细的错误原因
            const errorMsg = e.message || e.errMsg || '网络错误';
            uni.showModal({
              title: '上传失败',
              content: `原因：${errorMsg}\n\n请检查：\n1. 阿里云/腾讯云服务是否已实名\n2. 文件存储空间是否已过期\n3. 域名白名单是否配置`,
              showCancel: false
            });
          } finally {
            uni.hideLoading();
          }
        }
      });
    },

    async saveProfile() {
      if (!this.userInfo.nickname) {
        uni.showToast({ title: '昵称不能为空', icon: 'none' });
        return;
      }

      this.loading = true;
      const userId = uni.getStorageSync('userId');
      
      try {
        // 使用云函数更新，绕过 ClientDB 匿名访问权限限制
        const { result } = await uniCloud.callFunction({
          name: 'updateUserProfile',
          data: {
            userId,
            nickname: this.userInfo.nickname,
            avatar: this.userInfo.avatar,
            bio: this.userInfo.bio
          }
        });

        if (result && result.code === 0) {
          uni.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({ title: result.message || '保存失败', icon: 'none' });
        }
      } catch (e) {
        uni.showToast({ title: '系统错误，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.edit-container {
  min-height: 100vh;
  background: #F3F4F6;
  padding: 30rpx;
}

.card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
  position: relative;
}

.camera-icon {
  position: absolute;
  bottom: 60rpx;
  right: 50%;
  transform: translateX(80rpx);
  background: #2E5BFF;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid #FFFFFF;
}

.avatar-hint {
  font-size: 24rpx;
  color: #9CA3AF;
  margin-top: 20rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 2rpx solid #F3F4FB;
}

.label {
  font-size: 30rpx;
  color: #374151;
  width: 160rpx;
  font-weight: 500;
}

.action-bar {
  margin-top: 80rpx;
  padding: 0 40rpx;
}
</style>
