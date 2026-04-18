<template>
  <view class="radar-wrapper">
    <view class="radar-container" :style="{ width: size + 'rpx', height: size + 'rpx' }">
      <canvas 
        canvas-id="radarCanvas" 
        id="radarCanvas" 
        class="radar-canvas"
        :style="{ width: size + 'rpx', height: size + 'rpx' }"
        @touchstart="handleTouch"
      ></canvas>
      
      <!-- 点击显示具体数据 -->
      <view v-if="tooltip.show" class="radar-tooltip" :style="{ left: tooltip.x + 'px', top: (tooltip.y - 12) + 'px' }">
        <view class="tooltip-inner" @touchstart.stop>
          <text class="tooltip-title">{{ tooltip.title }}</text>
          <view class="tooltip-divider"></view>
          <text class="tooltip-val">得分: {{ tooltip.value }}</text>
        </view>
        <view class="tooltip-arrow"></view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "AbilityRadar",
  props: {
    data: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      canvasId: "radarCanvas",
      size: 680,
      tooltip: { show: false, x: 0, y: 0, title: "", value: 0 },
      points: [],
      timer: null
    }
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.render();
      }, 500);
    });
  },
  watch: {
    data: {
      deep: true,
      handler() {
        this.render();
      }
    }
  },
  methods: {
    handleTouch(e) {
      if (!this.points || this.points.length === 0) return;
      const touch = e.touches[0];
      const x = touch.x !== undefined ? touch.x : (touch.pageX - e.currentTarget.offsetLeft);
      const y = touch.y !== undefined ? touch.y : (touch.pageY - e.currentTarget.offsetTop);
      
      let found = null;
      let minDistance = 30;
      for (let p of this.points) {
        const d = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
        if (d < minDistance) {
          found = p;
          minDistance = d;
        }
      }
      
      if (found) {
        this.tooltip = { show: true, x: found.x, y: found.y, title: found.label, value: found.score };
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => { this.tooltip.show = false; }, 3000);
      } else {
        this.tooltip.show = false;
      }
    },
    render() {
      const ctx = uni.createCanvasContext(this.canvasId, this);
      if (!ctx) return;
      
      const s = uni.upx2px(this.size);
      const cx = s / 2;
      const cy = s / 2;
      const radius = (s / 2) - uni.upx2px(165);
      
      const sides = 6;
      const angle = (Math.PI * 2) / sides;
      const labels = ["言语理解", "数量关系", "判断推理", "资料分析", "常识判断", "政治理论"];
      const scores = [
        Math.round(this.data.verbal || 50),
        Math.round(this.data.quantitative || 50),
        Math.round(this.data.reasoning || 50),
        Math.round(this.data.dataAnalysis || 50),
        Math.round(this.data.commonSense || 50),
        Math.round(this.data.politics || 50)
      ];
      
      // 1. 背景网格
      ctx.setStrokeStyle("#E2E8F0");
      ctx.setLineWidth(1);
      for (let j = 1; j <= 5; j++) {
        const r = (radius / 5) * j;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const currAngle = i * angle;
          const tx = cx + r * Math.sin(currAngle);
          const ty = cy - r * Math.cos(currAngle);
          if (i === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 2. 轴线
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const currAngle = i * angle;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + radius * Math.sin(currAngle), cy - radius * Math.cos(currAngle));
      }
      ctx.stroke();

      // 3. 数据区域
      this.points = [];
      ctx.beginPath();
      ctx.setStrokeStyle("#3B82F6");
      ctx.setLineWidth(2);
      ctx.setFillStyle("rgba(59, 130, 246, 0.2)");
      for (let i = 0; i < sides; i++) {
        const currAngle = i * angle;
        const ratio = Math.min(scores[i], 100) / 100;
        const r = radius * ratio;
        const tx = cx + r * Math.sin(currAngle);
        const ty = cy - r * Math.cos(currAngle);
        this.points.push({ x: tx, y: ty, label: labels[i], score: scores[i] });
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4. 文字标签
      ctx.setFontSize(uni.upx2px(26));
      ctx.setFillStyle("#334155");
      const labelRadius = radius + uni.upx2px(50);
      for (let i = 0; i < sides; i++) {
        const currAngle = i * angle;
        const tx = cx + labelRadius * Math.sin(currAngle);
        const ty = cy - labelRadius * Math.cos(currAngle);
        
        const sinVal = Math.sin(currAngle);
        if (Math.abs(sinVal) < 0.1) {
          ctx.setTextAlign("center");
        } else if (sinVal > 0) {
          ctx.setTextAlign("left");
        } else {
          ctx.setTextAlign("right");
        }
        ctx.fillText(labels[i], tx, ty + uni.upx2px(10));
      }

      ctx.draw();
    }
  }
}
</script>

<style scoped>
.radar-wrapper { width: 100%; display: flex; justify-content: center; align-items: center; overflow: visible; }
.radar-container { position: relative; overflow: visible; }
.radar-canvas { background-color: transparent; }
.radar-tooltip { position: absolute; z-index: 10000; pointer-events: none; transform: translate(-50%, -100%); }
.tooltip-inner { background: rgba(15, 23, 42, 0.95); padding: 12rpx 20rpx; border-radius: 8rpx; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4rpx 15rpx rgba(0,0,0,0.2); border: 1px solid rgba(59, 130, 246, 0.3); }
.tooltip-title { color: #ffffff; font-size: 24rpx; font-weight: bold; }
.tooltip-divider { width: 100%; height: 1px; background: rgba(255,255,255,0.15); margin: 8rpx 0; }
.tooltip-val { color: #60A5FA; font-size: 26rpx; font-weight: bold; }
.tooltip-arrow { width: 0; height: 0; border-left: 12rpx solid transparent; border-right: 12rpx solid transparent; border-top: 12rpx solid rgba(15, 23, 42, 0.95); margin: 0 auto; }
</style>
