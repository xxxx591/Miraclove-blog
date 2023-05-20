
<template>
  <!-- 
    /*
参考：
van-swipe-cell  https://vant-contrib.gitee.io/vant/v2/#/zh-CN/swipe-cell
van-list  https://vant-contrib.gitee.io/vant/v2/#/zh-CN/swipe-cell

属性                  描述                                            传参类型
modelRequestConfig   请求配置(不传不会默认请求)                           Obeject
model                模型（针对 field组件）                             string
data                 请求数据（针对 field组件）                          Object[]
errorText            请求错误/失败提示                                  string
finishedText         请求完毕提示                                      string
template-columns     一行多少列 默认 6                                  number
fieldProps           子组件的属性（针对 field组件）                      Object
itemProps            子组件的属性（针对 cell-group组件）                 Object
方法                                                                 返回
cell-group-click    卡片组被点击事件                                    对应数据
*/
   -->
  <van-pull-refresh v-model="refreshing" @refresh="getList">
    <van-list
      v-model="loading"
      :finished="finished"
      :error.sync="error"
      :error-text="$attrs.errorText || ''"
      :finished-text="$attrs.finishedText || ''"
      @load="getList"
    >
      <van-swipe-cell  v-for="(item, index) in $attrs.data" :key="index" :data="item" :model="$attrs.model" :fieldProps="$attrs.fieldProps" :template-columns="$attrs['template-columns']" >
        <template #left>
          <slot name="left" :data="item"></slot>
        </template>
        <van-cell-group class="cell-group-grid" :class="{'card-field-active': index === selectIndex}" 
          v-bind="$attrs.itemProps" 
          :style="'grid-template-columns: repeat('+ ($attrs['template-columns'] || 6) +', 1fr);'" 
          inset border 
          @click="() => {
            selectIndex = index
            $emit('cell-group-click', item)
          }">
          <slot :data="item"></slot>
        </van-cell-group>
        <template #right>
          <slot name="right" :data="item"></slot>
        </template>
      </van-swipe-cell>
      </van-list>
  </van-pull-refresh>
</template>

<script>
  export default {
    name: 'CardField',
    data() {
        return {
            // 是否显示加载
            loading: false,
            // 是否请求完毕
            finished: false,
            // 是否请求报错
            error: false,
            // 是否刷新
            refreshing: false,
            selectIndex: null,
        };
    },
    methods: {
        request(config) {
            return new Promise((resolve, reject) => {
                cqjs.rpc({
                    ...config,
                    onsuccess: (res) => {
                        resolve(res);
                    },
                    onerror: (error) => {
                        this.$customToast({
                            type: 'error',
                            message: error.message,
                        })
                        console.log('错误提示', error.message)
                        reject(error);
                    },
                });
            });
        },
        // 获取数据
        async getList() {
            this.error = false;
            if (!this.$attrs.modelRequestConfig) {
                this.loading = false;
                this.finished = false;
                this.refreshing = false;
                return false;
            }
            // 处理下拉刷新
            if (this.refreshing) {
                this.$attrs.modelRequestConfig.args.offset = -1;
                this.$attrs.data = [];
                this.finished = false;
                this.refreshing = false;
            }
            this.loading = true;
            try {
                // 处理请求异常
                if (!this.error) {
                    this.$attrs.modelRequestConfig.args.offset++;
                }
                const page = this.$attrs.modelRequestConfig.args.offset || 0;
                const pageSize = this.$attrs.modelRequestConfig.args.limit || 1000;
                const res = await this.request({
                    ...this.$attrs.modelRequestConfig,
                });
                const values = Array.isArray(res.data) ? res.data : res.data.values;
                const list = values.map((item, index) => ({
                    ...item,
                    index: page * pageSize + index + 1,
                }));
                this.$attrs.data = page === 0 ? list : [...this.$attrs.data, ...list];
                console.log(this.$attrs.model, this.$attrs.data);
                this.finished = list.length < pageSize ? true : false;
                this.error = false;
                this.$emit("update:data", this.$attrs.data);
            } catch (err) {
                this.error = true;
            }
            this.loading = false;
        },
    },
    created() {
        this.getList();
    },
  }
</script>

<style lang="scss" scoped>

</style>