<template>
	<view class="container">
		<!-- 顶部统计 -->
		<view class="header-card">
			<view class="stats-row">
				<view class="stat-item">
					<text class="value">{{ totalCount }}</text>
					<text class="label">已收藏题目</text>
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

		<!-- 收藏列表 -->
		<scroll-view scroll-y class="list-container" @scrolltolower="loadMore" :scroll-anchoring="true">
			<view v-if="collectionList.length === 0" class="empty-state">
				<u-empty text="暂无收藏，快去刷题收藏吧~" mode="favor"></u-empty>
			</view>
			
			<view 
				v-for="item in collectionList" 
				:key="item._id" 
				class="collection-item card"
				@click="goToDetail(item)"
			>
				<view class="item-header">
					<view class="module-tag">{{ getModuleLabel(item.moduleType) }}</view>
					<text class="time">{{ formatDate(item.updateTime) }}</text>
				</view>
				<view class="item-content">
					<text class="question-text u-line-2">{{ item.questionData[0].content }}</text>
				</view>
				<view class="item-footer">
					<view class="action-info">
						<u-icon name="star-fill" size="28" color="#FAAD14"></u-icon>
						<text class="action-text">已收藏</text>
					</view>
					<u-button size="mini" type="error" plain @click.stop="removeCollection(item)">取消收藏</u-button>
				</view>
			</view>
			
			<u-loadmore :status="loadStatus" v-if="collectionList.length > 0"></u-loadmore>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			totalCount: 0,
			currentModule: 'all',
			modules: [
				{ label: '全部', value: 'all' },
				{ label: '言语理解', value: 'verbal' },
				{ label: '数量关系', value: 'quantitative' },
				{ label: '判断推理', value: 'reasoning' },
				{ label: '资料分析', value: 'dataAnalysis' },
				{ label: '常识判断', value: 'commonSense' }
			],
			collectionList: [],
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
					name: 'getCollectionRecords',
					data: { userId: this.userId, action: 'stats' }
				});
				if (result.code === 0) {
					this.totalCount = result.total;
				}
			} catch (e) {
				console.error('获取统计失败', e);
			}
		},
		async refreshList() {
			this.page = 1;
			this.collectionList = [];
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
					name: 'getCollectionRecords',
					data: {
						userId: this.userId,
						moduleType: this.currentModule,
						page: this.page,
						pageSize: this.pageSize
					}
				});

				if (result.code === 0) {
					const data = result.data;
					if (data.length < this.pageSize) {
						this.loadStatus = 'nomore';
					} else {
						this.loadStatus = 'loadmore';
					}
					this.collectionList = [...this.collectionList, ...data];
				}
			} catch (e) {
				console.error('加载失败', e);
			}
		},
		changeModule(val) {
			this.currentModule = val;
			this.refreshList();
		},
		getModuleLabel(type) {
			const m = this.modules.find(i => i.value === type);
			return m ? m.label : (type || '未知');
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
		async removeCollection(item) {
			uni.showModal({
				title: '提示',
				content: '确定要取消收藏吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							const db = uniCloud.database();
							await db.collection('collection_records').doc(item._id).remove();
							uni.showToast({ title: '已取消收藏', icon: 'success' });
							this.refreshList();
							this.getStats();
						} catch (e) {
							uni.showToast({ title: '操作失败', icon: 'none' });
						}
					}
				}
			});
		}
	}
}
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: #F7F8FA;
}

.header-card {
	background: linear-gradient(135deg, #FAAD14 0%, #D48806 100%);
	padding: 40rpx;
	color: #FFFFFF;
	.stats-row {
		display: flex;
		justify-content: center;
		.stat-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			.value {
				font-size: 48rpx;
				font-weight: bold;
			}
			.label {
				font-size: 24rpx;
				opacity: 0.9;
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
				background-color: #FAAD14;
				color: #FFFFFF;
			}
		}
	}
}

.list-container {
	padding: 20rpx 30rpx;
	height: calc(100vh - 160rpx - 100rpx);
}

.card {
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.collection-item {
	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		.module-tag {
			padding: 4rpx 16rpx;
			background-color: #FFFBE6;
			color: #FAAD14;
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
		.action-info {
			display: flex;
			align-items: center;
			.action-text {
				font-size: 24rpx;
				color: #FAAD14;
				margin-left: 8rpx;
			}
		}
	}
}

.empty-state {
	padding-top: 100rpx;
}
</style>