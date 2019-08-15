class MyVue{
  constructor(options){
    this.$data = options.data;
    this.$options = options;

    this.observe(this.$data)

    // created执行
    if (options.created) {
      options.created.call(this);
    }        
  }

  //设置监听函数
  observe(data) {
    if(!data || typeof data !== 'object'){
      return;
    }
    Object.keys(data).forEach((value) => {

      this.observe(value)//递归加查数据是否有多层嵌套

      this.defineReactive(data,value,data[value])
    })
  }

  //设置数据响应化
  defineReactive(data,key,value){
    const dep = new Dep()
    Object.defineProperty(data,key,{
      configurable:true,
      enumerable:true,
      set(newValue){
        if (value == newValue) return;
        value = newValue
        dep.notify();
      },
      get() {
        Dep.target && dep.addDep(Dep.target);
        return value;
      }
    })
  }
  //设置属性代理
  proxyData(key) {
    Object.defineProperty(this,key,{
      configurable:true,
      enumerable:true,
      set(newVal){
        return this.$data[key] = newVal
      },
      get(){
        return this.$data[key]
      }
    })
  }
}


//设置Dep,用来管理watcher
class Dep{
  constructor(){
    this.deps = []//设置deps用来管理依赖
  }

  //用来收集依赖
  addDep(dep){
    this.deps.push(dep)
  }

  //设置通知函数
  notify(){
    this.deps.forEach(dep => dep.update())
  }
}

//设置watcher
class Watcher{
  constructor(vm,key,cb) {
    this.vm = vm;
    this.key = key;
    this.cb = cb;
    // 将当前watcher实例指定到Dep静态属性target
    Dep.target = this;
    this.vm[this.key];//触发getter,从而添加依赖
    Dep.target = null;
  }
  update() {
    this.cb.call(this.vm,this.vm[this.key])
  }
}

