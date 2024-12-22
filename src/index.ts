export const squared = (n: number): number => n * n;

// 对所有可编辑的节点，都有友好的上下左右移动体验
// 基础接口是在任意 selection 状态下获取上下左右的位置
// 基础接口同时还提供了在鼠标 selection 状态下修正得到合法 selection 的方法
// 接口应该有足够的灵活性，保证在不同 editable 区域之间可以切换
// 在 register 后，会根据规则，来确定每个 node 的 editable 状态，切换条件，如何分词
// 上层应用是将对应的 selection 状态应用到 dom 中
// 同时提供对 selection 的拷贝、粘贴、删除、撤销、重做等操作
// 所有的操作应该都是数据驱动的，可以发射对应的 event json object 来进行操作。
// 

