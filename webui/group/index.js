
// import Module from './src/index.vue';
// import Field from './src/field.vue';

// // 给组件定义install方法
// Module.install = Vue => {
//   Vue.component(Module.name, Module);
// };

// export default Module;



function changeStr (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// 查找同级目录下以vue结尾的组件
const requireComponent = require.context('./src/', false, /\.vue$/);

const install = Vue => {
  console.log('requireComponent', requireComponent)
  requireComponent.keys().forEach(fileName => {
      let config = requireComponent(fileName);
      console.log(config) // ./Sanjiaoxing.vue 然后用正则拿到Sanjiaoxing
      let componentName = changeStr(
          fileName.replace(/^\.\//, '').replace(/\.\w+$/, '')
      )
      console.log('componentName', componentName)
      Vue.component(componentName, config.default || config);
  })
}

export default {
  install // 对外暴露install方法
}