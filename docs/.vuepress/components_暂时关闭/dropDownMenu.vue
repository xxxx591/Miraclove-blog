/**
参考：
下拉菜单 https://vant-contrib.gitee.io/vant/v2/#/zh-CN/dropdown-menu 
图标 https://vant-contrib.gitee.io/vant/v2/#/zh-CN/icon

其他属性 同 van-dropdown-menu 的属性
options 数组 
    value: 当前选择内容
    valueStyle:  当前选择内容对应样式
    valueLeftIcon: 左边图标名称或图片链接
    valueLeftIconProps 左边Icon相关属性
    valueRightIcon: 右边图标名称或图片链接
    valueRightIconProps 右边Icon相关属性
    其他属性同 van-dropdown-item 的属性
    options: 下拉菜单对应内容
        text 文本
        value 标识符 对应值
        icon 左侧图标名称或图片链接
*/ 
<template>
  <div
    class="dropdown-menu"
    :class="{ 'flex-end': $attrs.options && $attrs.options.length < 2 }"
  >
    <van-dropdown-menu v-bind="$attrs">
      <van-dropdown-item
        v-for="(item, index) in $attrs.options"
        :key="index"
        v-bind="item"
        v-model="item.value"
        v-on="$listeners"
      >
        <div slot="title" style="padding: 0 10px">
          <van-icon
            v-if="item.valueLeftIcon"
            :name="item.valueLeftIcon"
            v-bind="item.valueLeftIconProps"
          />
          <span :style="item.valueStyle">{{ item | getTitle }}</span>
          <van-icon
            v-if="item.valueRightIcon"
            :name="item.valueRightIcon"
            v-bind="item.valueRightIconProps"
          />
        </div>
      </van-dropdown-item>
    </van-dropdown-menu>
  </div>
</template>

<script>
export default {
  name: 'dropdown-menu',
  // 组件内部要使用的变量
  data() {
    return {};
  },
  filters: {
    getTitle(item) {
      const currentList = item.options.filter((it) => it.value === item.value);
      return currentList.length > 0 ? currentList[0].text : "";
    },
  },
  methods: {},
  // 数据初始化后 调用的方法
  created() {},
  // Dom加载完后 调用的方法
  mounted() {},
  // 组件销毁后 调用的方法
  beforeDestroy() {},
};
</script>

<style lang="scss" scoped></style>
