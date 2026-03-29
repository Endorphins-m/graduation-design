<template>
	<view class="container">
		<!-- 统计卡片 -->
		<view class="stats-header">
			<view class="total-stats">
				<view class="stat-box">
					<text class="num">{{ totalCount }}</text>
					<text class="label">练习总次数</text>
				</view>
				<view class="stat-box">
					<text class="num">{{ totalQuestions }}</text>
					<text class="label">累计刷题数</text>
				</view>
			</view>
		</view>

		<!-- 记录列表 -->
		<view class="list-container">
			<scroll-view scroll-y class="history-scroll" @scrolltolower="loadMore">
				<view v-if="historyList.length === 0" class="empty-state">
					<u-empty text="还没有练习记录，快去刷题吧" mode="list"></u-empty>
				</view>

				<view 
					v-for="(item, index) in historyList" 
					:key="item._id" 
					class="record-card"
					@click="goToDetail(item)"
				>
					<view class="card-left">
						<view class="date-box">
							<text class="day">{{ getDay(item.createTime) }}</text>
							<text class="month">{{ getMonth(item.createTime) }}月</text>
						</view>
					</view>
					
					<view class="card-main">
						<view class="record-title">
							<text class="type-tag">{{ getModuleLabel(item.moduleType) }}</text>
							<text class="time-str">{{ getTimeStr(item.createTime) }}</text>
						</view>
						<view class="record-data">
							<view class="data-item">
								<text class="val">{{ item.totalCount }}</text>
								<text class="lab">总题数</text>
							</view>
							<view class="data-item">
								<text class="val correct">{{ item.totalCorrect }}</text>
								<text class="lab">正确数</text>
							</view>
							<view class="data-item">
								<text class="val">{{ formatDuration(item.duration) }}</text>
								<text class="lab">耗时</text>
							</view>
						</view>
					</view>
					
					<view class="accuracy-circle">
						<text class="acc-val">{{ getAccuracy(item) }}%</text>
						<text class="acc-lab">正确率</text>
					</view>
				</view>
				
				<u-loadmore :status="loadStatus" v-if="historyList.length > 0"></u-loadmore>
			</scroll-view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			historyList: [],
			totalCount: 0,
			totalQuestions: 0,
			page: 1,
			pageSize: 15,
			loadStatus: 'loadmore',
			userId: ''
		}
	},
	onLoad() {
		this.userId = uni.getStorageSync('userId');
		if (this.userId) {
			this.fetchHistory();
		}
	},
	methods: {
		async fetchHistory() {
			this.loadStatus = 'loading';
			try {
				const { result } = await uniCloud.callFunction({
					name: 'getPracticeHistory',
					data: {
						userId: this.userId,
						page: this.page,
						pageSize: this.pageSize
					}
				});

				if (result.code === 0) {
					if (this.page === 1) {
						this.historyList = result.data;
						this.totalCount = result.total;
						// 计算累计题目总数
						this.totalQuestions = this.historyList.reduce((sum, item) => sum + (item.totalCount || 0), 0);
					} else {
						this.historyList = [...this.historyList, ...result.data];
					}

					if (result.data.length < this.pageSize) {
						this.loadStatus = 'nomore';
					} else {
						this.loadStatus = 'loadmore';
					}
				}
			} catch (e) {
				console.error(e);
				uni.showToast({ title: '加载失败', icon: 'none' });
			}
		},
		loadMore() {
			if (this.loadStatus !== 'loadmore') return;
			this.page++;
			this.fetchHistory();
		},
		goToDetail(item) {
			if (!item.questionIds || item.questionIds.length === 0) {
				uni.showToast({ title: '暂无题目明细', icon: 'none' });
				return;
			}
			uni.navigateTo({
				url: `/pages/practice/practice?ids=${item.questionIds.join(',')}&mode=review&name=练习回顾`
			});
		},
		getDay(ts) {
			return new Date(ts).getDate();
		},
		getMonth(ts) {
			return new Date(ts).getMonth() + 1;
		},
		getTimeStr(ts) {
			const d = new Date(ts);
			return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
		},
		formatDuration(seconds) {
			if (!seconds) return '0s';
			if (seconds < 60) return seconds + 's';
			return Math.floor(seconds / 60) + 'm' + (seconds % 60) + 's';
		},
		getAccuracy(item) {
			if (!item.totalCount) return 0;
			return Math.round((item.totalCorrect / item.totalCount) * 100);
		},
		getModuleLabel(type) {
			if (!type) return '综合练习';
			const map = {
				'verbal': '言语理解',
				'quantitative': '数量关系',
				'reasoning': '判断推理',
				'dataAnalysis': '资料分析',
				'commonSense': '常识判断',
				'politics': '时政热点'
			};
			// 如果是多个模块逗号分隔，返回第一个
			const firstType = type.split(',')[0];
			return map[firstType] || firstType || '综合练习';
		}
	}
}
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: #F7F8FA;
}

.stats-header {
	background: linear-gradient(135deg, #2E5BFF 0%, #1A3EB2 100%);
	padding: 60rpx 40rpx;
	color: #FFFFFF;
	.total-stats {
		display: flex;
		justify-content: space-around;
		.stat-box {
			text-align: center;
			.num {
				display: block;
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

.list-container {
	padding: 20rpx;
	height: calc(100vh - 200rpx);
}

.history-scroll {
	height: 100%;
}

.record-card {
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
}

.card-left {
	border-right: 2rpx solid #F1F5F9;
	padding-right: 20rpx;
	margin-right: 20rpx;
	.date-box {
		text-align: center;
		.day {
			display: block;
			font-size: 36rpx;
			font-weight: bold;
			color: #1E293B;
		}
		.month {
			font-size: 20rpx;
			color: #64748B;
		}
	}
}

.card-main {
	flex: 1;
	.record-title {
		margin-bottom: 16rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		.type-tag {
			font-size: 22rpx;
			color: #2E5BFF;
			background-color: #EBF1FF;
			padding: 4rpx 16rpx;
			border-radius: 6rpx;
		}
		.time-str {
			font-size: 20rpx;
			color: #94A3B8;
		}
	}
	.record-data {
		display: flex;
		gap: 30rpx;
		.data-item {
			.val {
				display: block;
				font-size: 28rpx;
				font-weight: bold;
				color: #1E293B;
				&.correct { color: #52C41A; }
			}
			.lab {
				font-size: 18rpx;
				color: #94A3B8;
			}
		}
	}
}

.accuracy-circle {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	border: 6rpx solid #EBF1FF;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	.acc-val {
		font-size: 22rpx;
		font-weight: bold;
		color: #1E293B;
	}
	.acc-lab {
		font-size: 14rpx;
		color: #94A3B8;
	}
}

.empty-state {
	padding-top: 200rpx;
}
</style>