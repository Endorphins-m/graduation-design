<template>
  <view class="radar-container">
    <canvas 
      canvas-id="radarCanvas" 
      id="radarCanvas"
      class="radar-canvas"
      :style="{ width: size + 'px', height: size + 'px' }"
    ></canvas>
    <view class="radar-labels">
      <text class="label top">言语({{data.verbal}})</text>
      <text class="label right-top">数量({{data.quantitative}})</text>
      <text class="label right-bottom">资料({{data.dataAnalysis}})</text>
      <text class="label bottom">判断({{data.reasoning}})</text>
      <text class="label left">常识({{data.commonSense}})</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'AbilityRadar',
  props: {
    data: {
      type: Object,
      default: () => ({
        verbal: 75,
        quantitative: 45,
        reasoning: 68,
        dataAnalysis: 52,
        commonSense: 60
      })
    },
    size: {
      type: Number,
      default: 300
    }
  },
  mounted() {
    this.drawRadar()
  },
  watch: {
    data: {
      deep: true,
      handler() {
        this.drawRadar()
      }
    }
  },
  methods: {
    drawRadar() {
      const ctx = uni.createCanvasContext('radarCanvas', this)
      const centerX = this.size / 2
      const centerY = this.size / 2
      const radius = this.size / 2 - 40
      
      // 清空画布
      ctx.clearRect(0, 0, this.size, this.size)
      
      // 绘制背景网格 (5层)
      const levels = 5
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = 1
      
      for (let i = 1; i <= levels; i++) {
        const r = (radius / levels) * i
        ctx.beginPath()
        for (let j = 0; j < 5; j++) {
          const angle = (Math.PI * 2 / 5) * j - Math.PI / 2
          const x = centerX + r * Math.cos(angle)
          const y = centerY + r * Math.sin(angle)
          if (j === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.stroke()
      }
      
      // 绘制轴线
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
      
      // 绘制数据区域
      const values = [
        this.data.verbal,
        this.data.quantitative,
        this.data.dataAnalysis,
        this.data.reasoning,
        this.data.commonSense
      ]
      
      ctx.beginPath()
      ctx.fillStyle = 'rgba(46, 91, 255, 0.3)'
      ctx.strokeStyle = '#2E5BFF'
      ctx.lineWidth = 3
      
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2
        const value = values[i] / 100
        const x = centerX + radius * value * Math.cos(angle)
        const y = centerY + radius * value * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        
        // 绘制数据点
        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#2E5BFF'
        ctx.fill()
        ctx.restore()
      }
      
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      
      ctx.draw()
    }
  }
}
</script>

<style scoped>
.radar-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20rpx;
}

.radar-canvas {
  z-index: 1;
}

.radar-labels {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.label {
  position: absolute;
  font-size: 24rpx;
  color: #6B7280;
  font-weight: 500;
}

.top {
  top: 10rpx;
  left: 50%;
  transform: translateX(-50%);
}

.right-top {
  top: 25%;
  right: 10rpx;
}

.right-bottom {
  bottom: 25%;
  right: 10rpx;
}

.bottom {
  bottom: 10rpx;
  left: 50%;
  transform: translateX(-50%);
}

.left {
  top: 50%;
  left: 10rpx;
  transform: translateY(-50%);
}
</style>