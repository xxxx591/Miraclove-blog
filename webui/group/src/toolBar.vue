<template>
  <van-row
    type="flex"
    :justify="$attrs.justify"
    :style="$attrs.style"
    class="van-cell toolbar-style"
  >
    <van-col class="toolbar-style-radio" v-if="modelData.options.length > 0">
      <van-radio-group v-model="modelData.radio" direction="horizontal">
        <van-radio
          v-for="(item, index) in modelData.options"
          @click="handleClick"
          :key="index"
          :name="item.value"
          :shape="$attrs.shape ? $attrs.shape : 'round'"
          >{{ item.label }}</van-radio
        >
      </van-radio-group>
    </van-col>
    <van-col span="6" class="toolbar-style-btn">
      <van-button type="info" @click="handleSubmit" v-if="modelData.isShowBtn">{{
        modelData.btnName
      }}</van-button>
      <slot></slot>
    </van-col>
  </van-row>
</template>

<script>
export default {
  name: "ToolBar",
  data() {
    return {
      // oldRadio: -1,
      modelData: {
        radio: "",
        isShowBtn: false,
        btnName: "",
        options: [],
      },
    };
  },
  watch: {
    $attrs: {
      handler: function (newVal) {
        this.modelData.radio = newVal.radio;
      },

      deep: true,
    },
  },
  methods: {
    // 提交按钮
    handleSubmit() {
      this.$emit("submit", this.modelData.radio);
    },
    // 单选取反
    handleClick() {
      this.$emit("update", this.modelData.radio);
    },
  },
  mounted() {
    this.modelData = Object.assign(this.modelData, this.$attrs);
  },
};
</script>

<style lang="scss" scoped></style>
