<template>
  <view class="radar-container">
    <canvas 
      v-if="canvasId" 
      :id="canvasId" 
      :canvas-id="canvasId" 
      class="radar-canvas"
      :style="{ width: size + 'rpx', height: size + 'rpx' }"
    ></canvas>
    <view v-else class="radar-placeholder">
       <text>雷达图加载中...</text>
    </view>
  </view>
</template>

<script>
/**
 * 简易能力雷达图组件 (能力画像)
 */
export default {
  name: 'AbilityRadar',
  props: {
    data: {
      type: Object,
      default: () => ({})
    },
    size: {
      type: Number,
      default: 320
    }
  },
  data() {
    return {
      canvasId: 'radarCanvas'
    }
  },
  mounted() {
    this.$nextTick(() => {
        setTimeout(() => {
            this.drawRadar();
        }, 100);
    });
  },
  methods: {
    drawRadar() {
      const ctx = uni.createCanvasContext(this.canvasId, this);
      if (!ctx) return;
      
      const centerX = uni.upx2px(this.size) / 2;
      const centerY = uni.upx2px(this.size) / 2;
      const radius = uni.upx2px(this.size) / 2 - 20;
      const sides = 5; // 五角雷达图
      const angle = (Math.PI * 2) / sides;
      
      // 1. 绘制背景网格
      ctx.setStrokeStyle('#E5E7EB');
      ctx.setLineWidth(1);
      for (let j = 1; j <= 4; j++) {
        const r = (radius / 4) * j;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const x = centerX + r * Math.sin(i * angle);
          const y = centerY - r * Math.cos(i * angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
      
      // 2. 绘制轴线
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const x = centerX + radius * Math.sin(i * angle);
        const y = centerY - radius * Math.cos(i * angle);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // 3. 绘制能力区域 (模拟数据映射)
      const scores = [
        this.data.verbal || 0,
        this.data.quantitative || 0,
        this.data.reasoning || 0,
        this.data.dataAnalysis || 0,
        this.data.commonSense || 0
      ];
      
      ctx.beginPath();
      ctx.setFillStyle('rgba(46, 91, 255, 0.4)');
      ctx.setStrokeStyle('#2E5BFF');
      ctx.setLineWidth(2);
      
      for (let i = 0; i < sides; i++) {
        const r = (radius * scores[i]) / 100;
        const x = centerX + r * Math.sin(i * angle);
        const y = centerY - r * Math.cos(i * angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.draw();
    }
  }
}
</script>

<style scoped>
.radar-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
.radar-canvas {
  background-color: transparent;
}
.radar-placeholder {
  color: #999;
  font-size: 24rpx;
}
</style>
