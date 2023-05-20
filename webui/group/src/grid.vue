<template>
  <van-form
    class="grid"
    v-bind="$attrs"
    v-on="$listeners"
    :style="
      'grid-template-columns: repeat(' + ($attrs['template-columns'] || 6) + ', 1fr);'
    "
  >
    <slot></slot>
  </van-form>
</template>

<script>
export default {
  name: 'Grid',
};
</script>

<style lang="scss" scoped></style>
