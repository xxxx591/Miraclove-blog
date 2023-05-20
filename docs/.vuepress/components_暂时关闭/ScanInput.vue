<template>
  <div class="scan-code">
    <van-field
      class="scan-input"
      border
      clearable
      left-icon="scan"
      v-bind="$attrs"
      v-on="$listeners"
    />
  </div>
</template>

<script>
export default {
  name: 'scan'
};
</script>

<style lang="scss" scoped></style>
