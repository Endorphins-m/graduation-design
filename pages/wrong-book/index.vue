<template>
	<view class="container">
		<!-- 顶部统计 -->
		<view class="header-card">
			<view class="stats-row">
				<view class="stat-item">
					<text class="value">{{ totalCount }}</text>
					<text class="label">待消灭错题</text>
				</view>
				<view class="stat-item">
					<text class="value">{{ masteredCount }}</text>
					<text class="label">已掌握</text>
				</view>
			</view>
		</view>

		<!-- 模块分类筛选 -->
		<view class="filter-section">
			<scroll-view scroll-x class="module-scroll">
				<view 
					v-for="(item, index) in modules" 
					:key="index"
					class="module-tab"
					:class="{ active: currentModule === item.value }"
					@click="changeModule(item.value)"
				>
					{{ item.label }}
				</view>
			</scroll-view>
		</view>

		<!-- 错题列表 -->
		<scroll-view scroll-y class="list-container" @scrolltolower="loadMore" :scroll-anchoring="true" :enable-back-to-top="true">
			<view v-if="wrongList.length === 0" class="empty-state">
				<u-empty text="暂无错题，继续保持哦~" mode="list"></u-empty>
			</view>
			
			<view 
				v-for="item in wrongList" 
				:key="item._id" 
				class="wrong-item card"
				@click="goToDetail(item)"
			>
				<view class="item-header">
					<view class="module-tag">{{ getModuleLabel(item.moduleType) }}</view>
					<text class="time">{{ formatDate(item.updateTime) }}</text>
				</view>
				<view class="item-content">
					<text class="question-text u-line-2">{{ item.questionData.content }}</text>
				</view>
				<view class="item-footer">
					<view class="error-info">
						<u-icon name="error-circle" size="28" color="#FF4D4F"></u-icon>
						<text class="error-count">错误 {{ item.errorCount || 1 }} 次</text>
					</view>
				</view>
			</view>
			
			<u-loadmore :status="loadStatus" v-if="wrongList.length > 0"></u-loadmore>
		</scroll-view>

		<!-- 底部操作栏 -->
		<view class="bottom-bar">
			<u-button type="primary" shape="circle" @click="startBatchReview">
				<u-icon name="play-circle" size="32" class="u-m-r-10"></u-icon>
				开启错题特训
			</u-button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			totalCount: 0,
			masteredCount: 0,
			currentModule: 'all',
			modules: [
				{ label: '全部', value: 'all' },
				{ label: '言语理解', value: 'verbal' },
				{ label: '数量关系', value: 'quantitative' },
				{ label: '判断推理', value: 'reasoning' },
				{ label: '资料分析', value: 'dataAnalysis' },
				{ label: '常识判断', value: 'commonSense' }
			],
			wrongList: [],
			page: 1,
			pageSize: 10,
			loadStatus: 'loadmore',
			userId: ''
		}
	},
	onShow() {
		this.userId = uni.getStorageSync('userId');
		if (this.userId) {
			this.refreshList();
			this.getStats();
		}
	},
	methods: {
		async getStats() {
			try {
				const { result } = await uniCloud.callFunction({
					name: 'getWrongQuestions',
					data: { userId: this.userId, action: 'stats' }
				});
				if (result.code === 0) {
					this.totalCount = result.total;
					this.masteredCount = result.mastered || 0;
				}
			} catch (e) {
				console.error('获取统计失败', e);
			}
		},
		async refreshList() {
			this.page = 1;
			this.wrongList = [];
			this.loadStatus = 'loading';
			await this.fetchData();
		},
		async loadMore() {
			if (this.loadStatus === 'nomore' || this.loadStatus === 'loading') return;
			this.page++;
			await this.fetchData();
		},
		async fetchData() {
			this.loadStatus = 'loading';
			try {
				const { result } = await uniCloud.callFunction({
					name: 'getWrongQuestions',
					data: {
						userId: this.userId,
						moduleType: this.currentModule,
						page: this.page,
						pageSize: this.pageSize
					}
				});

				if (result.code === 0) {
					const data = result.data.map(item => ({
						...item,
						questionData: item.questionData[0] || { content: '题目加载失败' }
					}));

					if (data.length < this.pageSize) {
						this.loadStatus = 'nomore';
					} else {
						this.loadStatus = 'loadmore';
					}

					this.wrongList = [...this.wrongList, ...data];
				} else {
					uni.showToast({ title: result.message || '加载失败', icon: 'none' });
				}
			} catch (e) {
				console.error('加载详情失败', e);
				uni.showToast({ title: '网络异常', icon: 'none' });
			}
		},
		changeModule(val) {
			this.currentModule = val;
			this.refreshList();
		},
		getModuleLabel(type) {
			const m = this.modules.find(i => i.value === type);
			return m ? m.label : '未知';
		},
		formatDate(timestamp) {
			if (!timestamp) return '-';
			const date = new Date(timestamp);
			return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
		},
		goToDetail(item) {
			uni.navigateTo({
				url: `/pages/practice/practice?id=${item.questionId}&mode=review`
			});
		},
		startReview(item) {
			this.goToDetail(item);
		},
		startBatchReview() {
			uni.navigateTo({
				url: `/pages/practice/practice?module=${this.currentModule}&mode=wrong_special`
			});
		}
	}
}
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: #F7F8FA;
	padding-bottom: 120rpx;
}

.header-card {
	background: linear-gradient(135deg, #2E5BFF 0%, #1A3EB2 100%);
	padding: 60rpx 40rpx;
	color: #FFFFFF;
	
	.stats-row {
		display: flex;
		justify-content: space-around;
		
		.stat-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			
			.value {
				font-size: 48rpx;
				font-weight: bold;
				margin-bottom: 8rpx;
			}
			.label {
				font-size: 24rpx;
				opacity: 0.8;
			}
		}
	}
}

.filter-section {
	background-color: #FFFFFF;
	padding: 20rpx 0;
	position: sticky;
	top: 0;
	z-index: 10;
	
	.module-scroll {
		white-space: nowrap;
		padding: 0 30rpx;
		
		.module-tab {
			display: inline-block;
			padding: 12rpx 30rpx;
			margin-right: 20rpx;
			border-radius: 30rpx;
			background-color: #F0F2F5;
			font-size: 26rpx;
			color: #64748B;
			
			&.active {
				background-color: #2E5BFF;
				color: #FFFFFF;
			}
		}
	}
}

.list-container {
	padding: 20rpx 30rpx;
	height: calc(100vh - 240rpx - 100rpx - 120rpx); /* 减去 header、filter 和 bottom 的大致高度 */
}

.card {
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.wrong-item {
	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		
		.module-tag {
			padding: 4rpx 16rpx;
			background-color: #EBF1FF;
			color: #2E5BFF;
			font-size: 22rpx;
			border-radius: 6rpx;
		}
		
		.time {
			font-size: 24rpx;
			color: #94A3B8;
		}
	}
	
	.item-content {
		margin-bottom: 20rpx;
		.question-text {
			font-size: 28rpx;
			color: #1E293B;
			line-height: 1.5;
		}
	}
	
	.item-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1rpx solid #F1F5F9;
		padding-top: 20rpx;
		
		.error-info {
			display: flex;
			align-items: center;
			.error-count {
				font-size: 24rpx;
				color: #FF4D4F;
				margin-left: 8rpx;
			}
		}
	}
}

.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20rpx 40rpx;
	background-color: #FFFFFF;
	box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.05);
	padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.empty-state {
	padding-top: 100rpx;
}
</style>