<script>
export default {
  onLaunch() {
    console.log('App Launch')
	// 检查 uniCloud 配置
		const config = uniCloud.getConfig && uniCloud.getConfig()
		console.log('uniCloud 配置:', config)
		
		// 检查服务空间信息
		console.log('服务空间ID:', config && config.spaceId)
		console.log('服务空间名称:', config && config.spaceName)
  }
}
</script>

<style lang="scss">
@import "uview-ui/index.scss";

/* 全局CSS变量 */
page {
  --primary: #2E5BFF;
  --primary-light: #E8EFFF;
  --weak: #FF4D4F;
  --base: #FAAD14;
  --strong: #52C41A;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --bg-gray: #F3F4F6;
  
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-gray);
}

/* 通用卡片样式 */
.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #2E5BFF 0%, #1E90FF 100%);
  color: #ffffff;
  border-radius: 40rpx;
  padding: 24rpx 60rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.btn-secondary {
  background: #ffffff;
  color: var(--primary);
  border: 2rpx solid var(--primary);
  border-radius: 40rpx;
  padding: 20rpx 50rpx;
}

/* 题型标签 */
.tag-weak {
  background: rgba(255, 77, 79, 0.1);
  color: var(--weak);
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.tag-base {
  background: rgba(250, 173, 20, 0.1);
  color: var(--base);
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.tag-strong {
  background: rgba(82, 196, 26, 0.1);
  color: var(--strong);
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

/* 进度条样式 */
.progress-weak {
  background: linear-gradient(90deg, #FF4D4F 0%, #FF7875 100%);
}

.progress-base {
  background: linear-gradient(90deg, #FAAD14 0%, #FFC53D 100%);
}

.progress-strong {
  background: linear-gradient(90deg, #52C41A 0%, #73D13D 100%);
}
</style>