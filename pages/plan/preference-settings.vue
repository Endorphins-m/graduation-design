<template>
	<view class="container">
		<view class="header-bg"></view>
		
		<view class="content">
			<view class="header">
				<text class="title">学习偏好设置</text>
				<text class="subtitle">我们将根据您的偏好，为您量身定制每日学习计划</text>
			</view>

			<view class="form-container">
				<!-- 每日目标 -->
				<view class="setting-card animate-slide-up" style="animation-delay: 0.1s;">
					<view class="card-header">
						<view class="icon-wrap target">
							<u-icon name="target" size="32" color="#FFFFFF"></u-icon>
						</view>
						<view class="header-text">
							<text class="card-title">每日目标题量</text>
							<text class="card-desc">合理设置题量，保持学习节奏</text>
						</view>
					</view>
					<view class="slider-box">
						<u-slider v-model="prefs.dailyLimit" :min="10" :max="100" step="5" active-color="#2E5BFF" block-width="38" block-color="#2E5BFF"></u-slider>
						<view class="slider-labels">
							<text>温和</text>
							<view class="current-val">
								<text class="num">{{ prefs.dailyLimit }}</text>
								<text class="unit">题/天</text>
							</view>
							<text>高强度</text>
						</view>
					</view>
				</view>

				<!-- 备考焦点 -->
				<view class="setting-card animate-slide-up" style="animation-delay: 0.2s;">
					<view class="card-header">
						<view class="icon-wrap focus">
							<u-icon name="tags-fill" size="32" color="#FFFFFF"></u-icon>
						</view>
						<view class="header-text">
							<text class="card-title">当前备考重点</text>
							<text class="card-desc">决定每日任务模组的权重分配</text>
						</view>
					</view>
					<view class="tag-grid">
						<view 
							v-for="(item, index) in focusOptions" 
							:key="index"
							class="tag-card"
							:class="{ active: prefs.focusArea === item.value }"
							@tap="prefs.focusArea = item.value"
						>
							<text class="tag-label">{{ item.label }}</text>
							<u-icon v-if="prefs.focusArea === item.value" name="checkmark-circle-fill" size="28" color="#2E5BFF" class="check-icon"></u-icon>
						</view>
					</view>
				</view>

				<!-- 提醒设置 -->
				<view class="setting-card animate-slide-up" style="animation-delay: 0.3s;">
					<view class="card-header">
						<view class="icon-wrap reminder">
							<u-icon name="bell-fill" size="32" color="#FFFFFF"></u-icon>
						</view>
						<view class="header-text">
							<text class="card-title">任务提醒</text>
							<text class="card-desc">定时提醒，告别拖延症</text>
						</view>
						<u-switch v-model="prefs.enableReminder" active-color="#2E5BFF" size="36"></u-switch>
					</view>
					
					<u-transition :show="prefs.enableReminder" mode="fade-down">
						<view class="time-picker-box" @tap="showTimePicker = true">
							<text class="label">每日提醒时间</text>
							<view class="time-val">
								<text>{{ prefs.reminderTime }}</text>
								<u-icon name="arrow-right" size="24" color="#94A3B8"></u-icon>
							</view>
						</view>
					</u-transition>
				</view>
			</view>

			<view class="footer-btn animate-fade-in" style="animation-delay: 0.4s;">
				<u-button 
					type="primary" 
					shape="circle" 
					block 
					:loading="loading"
					@click="savePrefs"
					:custom-style="saveBtnStyle"
				>保存并应用偏好</u-button>
				<text class="tip-text">偏好修改后，系统将即时重新计算今日推荐任务</text>
			</view>
		</view>

		<u-picker 
			v-model="showTimePicker" 
			mode="time" 
			@confirm="onTimeConfirm"
			:default-time="prefs.reminderTime"
		></u-picker>
	</view>
</template>

<script>
export default {
	data() {
		return {
			loading: false,
			showTimePicker: false,
			focusOptions: [
				{ label: '均衡提升', value: 'balance' },
				{ label: '攻克薄弱', value: 'weak' },
				{ label: '题海提速', value: 'speed' },
				{ label: '稳固基础', value: 'base' }
			],
			prefs: {
				dailyLimit: 30,
				focusArea: 'balance',
				enableReminder: true,
				reminderTime: '20:00'
			},
			userId: '',
			saveBtnStyle: {
				background: 'linear-gradient(135deg, #2E5BFF 0%, #0045FF 100%)',
				height: '100rpx',
				fontSize: '32rpx',
				fontWeight: 'bold',
				border: 'none',
				boxShadow: '0 10rpx 20rpx rgba(46, 91, 255, 0.2)'
			}
		}
	},
	onLoad() {
		this.userId = uni.getStorageSync('userId');
		this.loadCurrentPrefs();
	},
	methods: {
		async loadCurrentPrefs() {
			if (!this.userId) return;
			const db = uniCloud.database();
			try {
				const res = await db.collection('users').doc(this.userId).get();
				if (res.result.data[0] && res.result.data[0].learningPrefs) {
					this.prefs = { ...this.prefs, ...res.result.data[0].learningPrefs };
				}
			} catch (e) {
				console.error('加载偏好失败', e);
			}
		},
		onTimeConfirm(e) {
			this.prefs.reminderTime = `${e.hour}:${e.minute}`;
		},
		async savePrefs() {
			this.loading = true;
			try {
				const db = uniCloud.database();
				await db.collection('users').doc(this.userId).update({
					learningPrefs: this.prefs,
					updateTime: Date.now()
				});
				uni.showToast({ title: '已更新偏好', icon: 'success' });
				// 发送事件通知其他页面更新
				uni.$emit('refreshDailyPlan');
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			} catch (e) {
				uni.showToast({ title: '保存失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: #F8FAFC;
	position: relative;
}

.header-bg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 360rpx;
	background: linear-gradient(180deg, #E8EFFF 0%, #F8FAFC 100%);
	z-index: 0;
}

.content {
	position: relative;
	z-index: 1;
	padding: 60rpx 40rpx;
}

.header {
	margin-bottom: 50rpx;
	.title {
		font-size: 52rpx;
		font-weight: 800;
		color: #1E293B;
		display: block;
		letter-spacing: -1rpx;
	}
	.subtitle {
		font-size: 28rpx;
		color: #64748B;
		margin-top: 16rpx;
		display: block;
		line-height: 1.5;
	}
}

.setting-card {
	background-color: #FFFFFF;
	border-radius: 32rpx;
	padding: 40rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 10rpx 30rpx rgba(30, 41, 59, 0.04);
	border: 1rpx solid rgba(226, 232, 240, 0.6);
	
	.card-header {
		display: flex;
		align-items: center;
		margin-bottom: 40rpx;
		
		.icon-wrap {
			width: 64rpx;
			height: 64rpx;
			border-radius: 18rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 24rpx;
			
			&.target { background: #2E5BFF; }
			&.focus { background: #F59E0B; }
			&.reminder { background: #10B981; }
		}
		
		.header-text {
			flex: 1;
			.card-title {
				font-size: 32rpx;
				font-weight: 700;
				color: #1E293B;
				display: block;
			}
			.card-desc {
				font-size: 24rpx;
				color: #94A3B8;
				margin-top: 4rpx;
			}
		}
	}
}

.slider-box {
	padding: 0 10rpx;
	.slider-labels {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 30rpx;
		font-size: 24rpx;
		color: #94A3B8;
		.current-val {
			background: #F1F5F9;
			padding: 8rpx 24rpx;
			border-radius: 100rpx;
			.num {
				font-size: 38rpx;
				font-weight: 800;
				color: #2E5BFF;
				font-family: 'DIN Alternate', sans-serif;
			}
			.unit {
				margin-left: 6rpx;
				font-size: 22rpx;
				color: #64748B;
			}
		}
	}
}

.tag-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20rpx;
	
	.tag-card {
		padding: 30rpx;
		background-color: #F8FAFC;
		border-radius: 20rpx;
		position: relative;
		border: 2rpx solid transparent;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		
		.tag-label {
			font-size: 28rpx;
			color: #334155;
			font-weight: 500;
		}
		
		.check-icon {
			position: absolute;
			top: 10rpx;
			right: 10rpx;
		}
		
		&.active {
			background-color: #FFFFFF;
			border-color: #2E5BFF;
			box-shadow: 0 4rpx 12rpx rgba(46, 91, 255, 0.1);
			.tag-label {
				color: #2E5BFF;
				font-weight: 700;
			}
		}
	}
}

.time-picker-box {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 30rpx;
	background: #F8FAFC;
	border-radius: 20rpx;
	margin-top: 20rpx;
	
	.label {
		font-size: 28rpx;
		color: #64748B;
	}
	.time-val {
		display: flex;
		align-items: center;
		font-size: 32rpx;
		font-weight: 700;
		color: #1E293B;
		u-icon {
			margin-left: 10rpx;
		}
	}
}

.footer-btn {
	margin-top: 80rpx;
	padding-bottom: 60rpx;
	text-align: center;
	
	.tip-text {
		display: block;
		margin-top: 24rpx;
		font-size: 24rpx;
		color: #94A3B8;
	}
}

/* 动画效果 */
@keyframes slideUp {
	from { opacity: 0; transform: translateY(30rpx); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

.animate-slide-up {
	animation: slideUp 0.6s ease forwards;
}

.animate-fade-in {
	animation: fadeIn 0.8s ease forwards;
}
</style>