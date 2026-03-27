<template>
  <view class="progress-ring" :style="{ width: size + 'rpx', height: size + 'rpx' }">
    <canvas 
      canvas-id="ringCanvas"
      id="ringCanvas"
      class="ring-canvas"
      :style="{ width: size + 'rpx', height: size + 'rpx' }"
    ></canvas>
    <view class="ring-content">
      <text class="percentage">{{ percentage }}%</text>
      <text class="label">{{ label }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ProgressRing',
  props: {
    percentage: {
      type: Number,
      default: 0
    },
    label: {
      type: String,
      default: '完成度'
    },
    size: {
      type: Number,
      default: 200
    },
    strokeWidth: {
      type: Number,
      default: 12
    },
    color: {
      type: String,
      default: '#2E5BFF'
    }
  },
  mounted() {
    this.drawRing()
  },
  watch: {
    percentage() {
      this.drawRing()
    }
  },
  methods: {
    drawRing() {
      const ctx = uni.createCanvasContext('ringCanvas', this)
      const sizePx = uni.upx2px(this.size)
      const centerX = sizePx / 2
      const centerY = sizePx / 2
      const radius = (sizePx - uni.upx2px(this.strokeWidth)) / 2
      
      // 清空画布
      ctx.clearRect(0, 0, sizePx, sizePx)
      
      // 绘制背景圆环
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = uni.upx2px(this.strokeWidth)
      ctx.lineCap = 'round'
      ctx.stroke()
      
      // 绘制进度圆环
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + (Math.PI * 2 * this.percentage / 100)
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.strokeStyle = this.color
      ctx.lineWidth = uni.upx2px(this.strokeWidth)
      ctx.lineCap = 'round'
      ctx.stroke()
      
      ctx.draw()
    }
  }
}
</script>

<style scoped>
.progress-ring {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ring-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.ring-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.percentage {
  font-size: 36rpx;
  font-weight: bold;
  color: #1F2937;
}

.label {
  font-size: 22rpx;
  color: #6B7280;
  margin-top: 8rpx;
}
</style>