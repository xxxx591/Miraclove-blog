<template>
  <div class="tabbar-style">
    <div
      class="tabbar-style-item"
      v-for="(item, index) in $attrs.itemList"
      :key="index"
      :style="tabBarActCode === item.code ? item.style : ''"
      @click="handleChange(item.code)"
    >
      {{ item.name }}
    </div>
  </div>
</template>

<script>
export default {
  name: "TabBar",
  data() {
    return {
      tabBarActCode: "",
    };
  },
  watch: {
    $attrs: {
      handler: function (newVal) {
        this.tabBarActCode = newVal.value;
      },

      deep: true,
    },
  },
  methods: {
    handleChange(code) {
      this.$emit("update", code);
    },
  },
  mounted() {
    this.tabBarActCode = this.$attrs.value;
  },
};
</script>

<style lang="scss" scoped></style>
