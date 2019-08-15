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

      }else if(this.isText(node)){
        
      }
    })
  }

  //dom节点判断
  isEle(node){
    return node.nodeType == 1;
  }
  //文本节点判断
  isText(node){
    return node.nodeType == 3
  }
}