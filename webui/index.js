import group from './group'

const components = [group]

console.log('components', components)

const install = Vue => {
  // 判断组件是否安装，如果已经安装了就不在安装。
  if (install.installed) return
  install.installed = true
  // 遍历的方式注册所有的组件
  components.map(component => {
    console.log('component', component)
    return Vue.use(component)
  })
}

// 检查vue是否安装，满足才执行
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

export default {
  // 所有的组件必须有一个install的方法，才能通过Vue.use()进行按需注册
  install,
  ...components,
}
