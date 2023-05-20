// 渲染用模板（HTML）
/*
  * 组件 导航条
  * 参考
  * van-field https://vant-contrib.gitee.io/vant/v2/#/zh-CN/field
  *
  * 属性            说明                  类型           可选择参数
  * fieldProps     van-field 相关属性     Object        { ‘属性名’：‘属性名对应值’ }
  * fieldEvent     van-field 相关方法     Object        { ‘方法名’：‘传的要调用匿名函数’ }
  * name           绑定数据的key          string
  * labelKey       模型没有name有显示key   string
  * editors        组件类型               string
  * label          左边标题               string
  * labelStyle     左边标题样式            string,object
  * options        数据源(单选框，多选框)   object[]
  * inputStyle     显示数据样式           string,object
  * column         占列数                string
  * row            占行数                string
  * customValue    自定义值               string         ‘1’ 自定义值 默认不自定义
  * style          field相关样式         string
  * */
<template>
  <div>
    <van-field
      class="cq_field"
      v-bind="fieldProps"
      v-on="$attrs.fieldEvent"
      :border="false"
      :style="
        'grid-column: span ' +
        ($attrs.column || defaultColumn) +
        ';grid-row: span ' +
        ($attrs.row || 1) +
        ';' +
        $attrs.style
      "
    >
      <!--
		        #label van-field label插槽 左边显示标签的内容
		        labelStyle 额外设置 label 对应样式
		     -->
      <template #label>
        <span :style="$attrs.labelStyle">
          {{ $attrs.label || modelFields[$attrs.labelKey || $attrs.name].label || "" }}
        </span>
      </template>
      <!--
		           #input van-field input插槽 右边显示输入框的内容
		           component 动态组件 is=组件名
		           modelProps 传过来属性（额外处理的）
		           优先级 传过来属性($attrs) > 默认设置(modelConfig.props) > 组件默认设置
		           inputStyle 额外设置 input 对应样式
		           modelEvent 传过来方法（额外处理的）
		        -->
      <template #input>
        <template v-if="$attrs.customValue || !$attrs.name">
          <slot :data="$parent.$attrs.data"></slot>
        </template>
        <template v-else>
          <component
            :is="modelConfig[$attrs.editors].is"
            v-bind="modelProps"
            :style="getInputStyle()"
            v-model="Array.isArray($parent.$attrs.data[$attrs.name]) ? $parent.$attrs.data[$attrs.name][1] : $parent.$attrs.data[$attrs.name]"
            :options="
              modelFields[$attrs.name] ? modelFields[$attrs.name].options : $attrs.options
            "
            :placeholder="
              modelFields[$attrs.name]
                ? modelFields[$attrs.name].placeholder
                : $attrs.placeholder
            "
            v-on="modelEvent"
          >
            <slot name="input" :data="$parent.$attrs.data"></slot>
          </component>
        </template>
      </template>
      <template #left-icon>
        <slot name="left-icon"></slot>
      </template>
      <template #right-icon>
        <slot name="right-icon"></slot>
      </template>
      <template #button>
        <slot name="button"></slot>
      </template>
    </van-field>
  </div>
</template>

<script>
export default {
  name: 'field',
  // 组件相关声明
  components: {
    // 输入框
    Inputs: {
      template: `<input v-model="$attrs.value" v-on="$listeners"/>`,
    },
    // 单选框
    Radio: {
      template: `
                <van-radio-group v-model="$attrs.value" v-on="$listeners">
                  <van-radio
                      v-for="(item, index) in $attrs.options"
                      :key="item.name"
                      v-bind="item"
                   >
                    {{ item.label }}
                  </van-radio>
                </van-radio-group>
            `,
    },
    // 多选框
    Checkbox: {
      template: `
                <van-checkbox-group v-model="$attrs.value" v-on="$listeners">
                  <van-checkbox
                    v-for="(item, index) in $attrs.options"
                    :key="item.name"
                    v-bind="item"
                  >
                   {{ item.label }}
                  </van-checkbox>
                </van-checkbox-group>
            `,
    },
    // 选择
    Select: {
      template: `
                <select class="cq_select" v-model="$attrs.value" v-on="$listeners">
                <option value='' disabled selected style='display:none;'>{{$attrs.placeholder||''}}</option> 
                <option value='noData' :selected="false" disabled :style='Object.keys($attrs.options).length===0?"":"display:none;"' >暂无数据</option>  
                  <option 
                    v-for="(value, key) in $attrs.options"
                    :key="key"
                    :value="key"
                    :selected="Object.keys($attrs.options)[0] === key"
                  >
                   {{ value }}
                  </option>
                </select>
            `,
    },
  },
  // 组件内部要使用的变量
  data() {
    return {
      // 使用当前模型
      modelFields: {},
      // 组件相关属性
      modelProps: {},
      // 组件相关方法
      modelEvent: {},
      // 组件相关设置
      modelConfig: {},
      // 默认列数
      defaultColumn: 6,
      // 默认输入框的属性值
      fieldProps: {},
    };
  },

  methods: {
    getInputStyle() {
      const currentFields = this.modelFields ? this.modelFields[this.$attrs.name] : {};
      const inputStyle = this.$attrs.inputStyle;
      const data = this.$parent.$attrs.data;
      if (currentFields && currentFields.options) {
        return inputStyle && inputStyle[data[this.$attrs.name]]
          ? { ...inputStyle[data[this.$attrs.name]], "text-align": "right" }
          : inputStyle;
      } else {
        return inputStyle;
      }
    },
    // 传过来的方法处理 额外返回参数
    setModelEvent() {
      const defaultConfig = this.modelConfig[this.$attrs.editors] || {};
      const modelEvent = Object.assign({}, defaultConfig.event);
      for (const eventKey in this.$listeners) {
        modelEvent[eventKey] = this.$listeners[eventKey].bind(
          this,
          this.$parent.$attrs.data,
          this.$attrs
        );
      }
      // 处理 输入框 事件 防止 v-model 返回事件对象
      if (["Inputs", "Radio", "Checkbox", "Select"].includes(defaultConfig.is)) {
        modelEvent.input = (e) => {
          const modelData = this.$parent.$attrs.data;
          const currentValue = ["Radio", "Checkbox"].includes(defaultConfig.is)
            ? e
            : e.target.value;
          modelData[this.$attrs.name] = currentValue;
          this.$listeners.input &&
            this.$listeners.input.call(
              this,
              this.$parent.$attrs.data,
              this.$attrs,
              e.target.value,
              e
            );
        };
      }
      return modelEvent;
    },
    // 根据 传过来 editors 对应 要显示的组件 以及 设置显示内容 默认属性以及方法
    getModelConfig() {
      const modelConfig = {
        text: {
          is: "Inputs",
          props: {
            type: "text",
            class: "van-field__control",
            readonly: true,
          },
        },
        password: {
          is: "Inputs",
          props: {
            type: "password",
            class: "van-field__control",
          },
        },
        number: {
          is: "Inputs",
          props: {
            type: "number",
            class: "van-field__control",
            readonly: true,
          },
        },
        tel: {
          is: "Inputs",
          props: {
            type: "tel",
            class: "van-field__control",
            readonly: true,
          },
        },
        textarea: {
          is: "Inputs",
          props: {
            type: "textarea",
            class: "van-field__control",
            readonly: true,
          },
        },
        switch: {
          is: "van-switch",
        },
        rate: {
          is: "van-rate",
        },
        slider: {
          is: "van-slider",
        },
        uploader: {
          is: "van-uploader",
        },
        radio: {
          is: "Radio",
          props: {
            direction: "horizontal",
          },
        },
        checkbox: {
          is: "Checkbox",
          props: {
            direction: "horizontal",
          },
        },
        select: {
          is: "Select",
          props: {
            disabled: true,
          },
        },
      };
      return modelConfig;
    },
    checkModelFields() {
      if (
        Object.keys(this.modelFields).length > 0 &&
        !this.modelFields[this.$attrs.name]
      ) {
        console.error(
          `字段名:（${this.$attrs.label}）,字段（${this.$attrs.name || ""}）在模型（${
            this.$parent.$attrs.model
          }）里查不到！`
        );
      } else if (Object.keys(this.modelFields).length === 0) {
        console.error(
          `字段名:（${this.$attrs.label}）,字段（${
            this.$attrs.name || ""
          }）没有使用模型！`
        );
      }
    },
  },
  // 数据初始化后 调用的方法
  created() {
    this.modelFields = this.$parent.$attrs.model
      ? cqjs.modelFields[this.$parent.$attrs.model]
      : {};
    this.modelConfig = this.getModelConfig();
    this.modelEvent = this.setModelEvent();
    this.modelProps = Object.assign(
      this.modelProps,
      this.modelConfig[this.$attrs.editors || "text"].props,
      this.$attrs
    );
    this.fieldProps = Object.assign(
      this.fieldProps,
      this.$parent.$attrs.fieldProps,
      this.$attrs.fieldProps
    );
    this.defaultColumn =
      this.$parent && this.$parent.$vnode.componentOptions.tag === "van-swipe-cell"
        ? this.$parent.$attrs["template-columns"] || 6
        : 6;
    this.checkModelFields();
  },
  // Dom加载完后 调用的方法
  mounted() {},
  // 组件销毁后 调用的方法
  beforeDestroy() {},
};
</script>

<style lang="scss" scoped></style>
