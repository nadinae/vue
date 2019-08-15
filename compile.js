class Compile{
  constructor(el,vm){
    this.$el = el;
    this.$vm = vm;
    if(this.$el){
      this.$fragment = this.nodeToFragment(this.$el);
      this.compile(this.$fragment);
      this.$el.appendChild(this.$fragment)
    }
  }

  //将el对象中的代码遍历,然后将el多有元素插入到文档片段中
  nodeToFragment(el){
    let domFrag = document.createDocumentFragment();

    let childNode = null;
    while(childNode = el.firstChild){
      domFrag.appendChild(childNode);
    }
    return domFrag;
  }

  //编译函数
  compile(elNode){
    const childNode = elNode.childNodes;
    Array.from(childNode).forEach(node => {
      //类型判断
      if(this.isEle(node)){
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
        this.compileText(node);
      }
    })
  }
  //事件处理
  eventHandler(node, vm, attrVal,dir){
    let eventFun = vm.$options.methods && vm.$options.methods[attrVal];
    if(dir && eventFun){
      node.addEventListener(dir, eventFun.bind(vm))
    }
  }
  //text指令处理函数
  text(node,vm,val){
    this.update(node,vm,val,'text')
  }
  html(node,vm,val){
    this.update(node, vm, val, 'html')
  }
  //检测是不是指令
  isDir(name){
    return name.indexOf('v-') == 0;
  }
  //检测是不是事件
  isEvent(name){
    return name.indexOf('@') == 0;
  }
  //更新dom里的文本插值
  compileText(node){
    this.update(node,this.$vm,RegExp.$1,'text')
  }
  //更新函数
  update(node,vm,key,dir){
    const updateFun = this[dir+'Update'];
    updateFun && updateFun(node,vm[key]);
    //依赖收集
    new watcher(vm,exp,function(value){
      updateFun && updateFun(node, value);
    })
  }
  //文本更新函数
  textUpdate(node,value){
    node.textContent = value;
  }
  htmlUpdate(node, value) {
    node.innerHTML = value;
  }
  //dom节点判断
  isEle(node){
    return node.nodeType == 1;
  }
  //文本节点判断
  isText(node){
    return node.nodeType == 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }
}