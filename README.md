# vue
vue源码解析及一些基本功能实现原理

# vue底层原理关系图

![](img/vue.png)

vue是通过Object.defineProperty()方法对数据劫持来实现双向绑定的。

其中通过Observer劫持监听所有属性，当数据有变化时，通知Dep。指令解析器Compile对每个元素的指令进行扫描和解析，然后对指令的模板进行数据替换，并绑定Update函数。


