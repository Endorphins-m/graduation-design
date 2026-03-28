<script>
export default {
	onLaunch() {
		console.log('App Launch');
		
		// 1. 检查 uniCloud 服务空间配置（保持你原有的调试逻辑）
		const config = (uniCloud.getConfig && uniCloud.getConfig()) || {};
		console.log('uniCloud 配置:', config);
		console.log('服务空间ID:', config.spaceId);
		console.log('服务空间名称:', config.spaceName);

		// 2. 执行全局登录状态同步校验
		this.syncLoginStatus();
	},
	methods: {
		/**
		 * 同步并校验登录状态
		 */
		async syncLoginStatus() {
			const token = uni.getStorageSync('token');
			const userId = uni.getStorageSync('userId');

			if (!token || !userId) {
				console.log('App: 本地未检测到登录信息');
				return;
			}

			console.log('App: 正在校验登录状态...', userId);

			try {
				// 调用云函数校验 Token 是否依然有效
				const res = await uniCloud.callFunction({
					name: 'validateToken',
					data: { token, userId }
				});

				if (res.result && res.result.valid) {
					console.log('App: 登录状态有效');
				} else {
					console.warn('App: 登录已过期，清理缓存');
					this.clearAuthCache();
				}
			} catch (e) {
				console.error('App: 登录校验请求失败', e);
				// 网络异常时通常保留本地状态，允许离线查看或等待下次恢复
			}
		},

		/**
		 * 清理本地存储的授权信息
		 */
		clearAuthCache() {
			uni.removeStorageSync('token');
			uni.removeStorageSync('userId');
			uni.removeStorageSync('userInfo');
		}
	}
}
</script>

<style lang="scss">
/* 引入 uView 核心样式 */
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
	/* 解决H5端tabbar高度问题 */
	padding-bottom: constant(safe-area-inset-bottom);
	padding-bottom: env(safe-area-inset-bottom);
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
	color: #ffffff !important;
	border-radius: 40rpx;
	padding: 24rpx 60rpx;
	font-size: 32rpx;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	&::after { border: none; }
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

/* 进度条颜色梯度 */
.progress-weak {
	background: linear-gradient(90deg, #FF4D4F 0%, #FF7875 100%) !important;
}

.progress-base {
	background: linear-gradient(90deg, #FAAD14 0%, #FFC53D 100%) !important;
}

.progress-strong {
	background: linear-gradient(90deg, #52C41A 0%, #73D13D 100%) !important;
}
</style>