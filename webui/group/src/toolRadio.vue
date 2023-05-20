<template>
  <!-- 
    参考： https://vant-contrib.gitee.io/vant/v2/#/zh-CN/radio
    其他属性 同 van-radio-group 的属性
    options 数组 
        label: 显示内容
        value: 绑定值
        labelStype: 显示内容对应样式
  -->
  <van-radio-group
    class="tool-radio"
    v-model="$attrs.value"
    v-bind="modelProps"
    v-on="$listeners"
  >
    <van-radio
      v-for="item in modelProps.options"
      :key="item.label"
      :name="item.value"
      v-bind="item"
      v-on="$listeners"
    >
      <span :style="item.labelStyle || defaultLabelStyle">{{ item.label }}</span>
    </van-radio>
  </van-radio-group>
</template>

<script>
export default {
  name: 'tool-radio',
  data() {
        return {
            // 默认传参
            modelProps: {},
            // 默认单选框显示内容样式
            defaultLabelStyle: {}
        }
    },
    methods: {},
    // 数据初始化后 调用的方法
    created() {
        this.modelProps = Object.assign(this.modelProps, {
            direction: 'horizontal',
            'checked-color': '#000'
        }, this.$attrs)
        this.defaultLabelStyle = {
            color: this.modelProps['checked-color'],
            fontSize: '16px',
            fontWeight: 600
        }
    },
    // Dom加载完后 调用的方法
    mounted(){},
    // 组件销毁后 调用的方法
    beforeDestroy(){}
};
</script>

<style lang="scss" scoped></style>
