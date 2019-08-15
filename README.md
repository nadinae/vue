# vue
vue源码解析及一些基本功能实现原理

# vue底层原理关系图

![](img/vue.png)

vue是通过Object.defineProperty()方法对数据劫持来实现双向绑定的。

* 其中通过Observer劫持监听所有属性，当数据有变化时，通知Dep。
* 指令解析器Compile对每个元素的指令进行扫描和解析，然后对指令的模板进行数据替换，执行事件，并绑定Update函数，同时会进行依赖收集。
* Watcher 作为Dep和Compile连接器能够收集所有的属性，并且订阅属性的变动，从而执行相应的回调函数 

#### JS代码
```javascript
class Vue{
  constructor(option){
    this.$data = options.data;
    this.$options = options;

    this.observe(this.$data)

  }
  observe(data){
    if(!data || typeof data !== 'object'){
      return;
    }
    Object.keys(data).forEach(key => {
      this.observe(value)
      this.setDefineReactive(data,key,data[key])
    })
  }
}
```
设置监听函数，遍历所有的属性，并添加递归函数，从而拿到多层嵌套的数据。然后对每一个数据添加劫持函数，并进行数据的响应化。下面是数据的响应化函数**setDefineReactive**

```javascript
defineReactive(data,key,value){
  const dep = new Dep()
  Object.defineProperty(data,key,{
    configurable:true,//可配置性
    enumerable:true,//可遍历性
    set(newVal){
      if(newVal == value) return;
      value = newVal;
      dep.notify();
    },
    get(){
      return value
    }
  })
}
```
**Object.defineProperty**函数会劫持属性原有**set****get**方法，从而监听到数据的变化，然后执行**dep.notify**通知函数。**下面设置Dep**
```javascript
class Dep{
  constructor(){
    this.deps = []
  }
  addDep(dep){
    this.deps.push(dep)
  }
  notify(){
    this.deps.forEach(dep = dep.update())
  }
}
```
Dep的作用主要是收集依赖，并设置通知函数，下面来设置**Watcher**
```javascript
class Watcher{
  constructor() {
    // 将当前watcher实例指定到Dep静态属性target
    Dep.target = this;
  }
  update() {
    console.log("属性更新了");
  }
}
defineReactive(data,key,value){
  const dep = new Dep()
  Object.defineProperty(data,key,{
    get(){
      Dep.target && dep.addDep(Dep.target)
      return value
    }
  })
}
```
将Watcher指向Dep的静态属性target从而将依赖收集添加到Dep的deps属性里面

# 接下来进行编译及对**v- @ v-text v-html**等指令的处理
编译的主要工作是对模板语法进行处理。document.createDocumentFragment()将[vue.js](https://cn.vuejs.org/)el元素的所有子元素剪切到文档碎片中。然后将文档碎片添加到DOM树中。因为文档片段存在于内存中，并不在DOM树中，所以将子元素插入到文档片段时不会引起页面回流。因此，使用文档片段通常会带来更好的性能。

```javascript
node2Fragment(el) {
  const frag = document.createDocumentFragment();
  // 将el中所有子元素搬家至frag中
  let child;
  while ((child = el.firstChild)) {
    frag.appendChild(child);
  }
  return frag;
}
```
然后遍历所有的元素，判断节点类型进行不同操作。同时对DOM元素上的属性进行判断是指令还是事件。
```javascript
compile(elNode){
  const childNode = elNode.childNodes;
  Array.from(childNode).forEach(node => {
    //类型判断
    if(this.isEle(node)){
      //DOM节点
      //通过获取元素属性，进行不同指令的操作
      let attributes = node.attributes;
      Array.from(attributes).forEach(attr => {
        let attrName = attr.name;
        let attrVal = attr.value;
        if(this.isDir(attrName)){
          let dir = attrName.substring(2);
          this[dir] && this[dir](node,this.$vm,attrVal)
        }
        if(this.isEvent(attrName)){
          const dir = attrName.substring(1);
          this.eventHandler(node, this.$vm, attrVal, dir);
        }
      })
    }else if(this.isText(node)){
      //文本节点的处理方法
    }
  })
}

  //dom节点判断
  isEle(node){
    return node.nodeType == 1;
  }
  //文本节点判断
  isText(node){
    return node.nodeType == 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }
  //检测是不是指令
  isDir(name){
    return name.indexOf('v-') == 0;
  }
  //检测是不是事件
  isEvent(name){
    return name.indexOf('@') == 0;
  }
```
接下来添加**v-text**、**v-html**、**{{}}**、**@**等处理函数。
```javascript
//v-text指令处理函数
text(node,vm,val){
  this.update(node,vm,val,'text')
}
//v-html指令处理函数
html(node,vm,val){
  this.update(node, vm, val, 'html')
}
//公用更新函数
update(node,vm,key,dir){
  const updateFun = this[dir+'Update'];
  updateFun && updateFun(node,vm[key]);
}

//更新dom里的文本插值
compileText(node){
  this.update(node,this.$vm,RegExp.$1,'text')
}
//v-text更新函数
textUpdate(node,value){
  node.textContent = value;
}
//v-html更新函数
htmlUpdate(node, value) {
  node.innerHTML = value;
}
//事件处理
eventHandler(node, vm, attrVal,dir){
  let eventFun = vm.$options.methods && vm.$options.methods[attrVal];
  if(dir && eventFun){
    node.addEventListener(dir, eventFun.bind(vm))
  }
}
```
这时还需要通过**Watcher**进行依赖收集。**Watcher**需要加在update方法里面，从而完成对所有依赖的收集。
```javascript
update(node,vm,key,dir){
  const updateFun = this[dir+'Update'];
  updateFun && updateFun(node,vm[key]);
  //依赖收集
  new Watcher(vm,exp,function(value){
    updateFun && updateFun(node, value);
  })
}
```
这时还需要对**Watcher**进行处理
```javascript
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
```
在Watcher的constructor中需要执行**this.vm[this.key]**触发**defineReactive**的**get**来完成所有属性的收集。

* 至此一个简单的mvvm框架已经简单完成。