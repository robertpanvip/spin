   

@ui-co/spin
===========

用于页面和区块的加载中状态。

[![NPM Version](https://img.shields.io/npm/v/@ui-co/spin?color=33cd56&logo=npm)](https://www.npmjs.com/package/@ui-co/spin)  [![NPM Version](https://img.shields.io/npm/dm/@ui-co/spin.svg?style=flat-square)](https://www.npmjs.com/package/@ui-co/spin)  [![unpacked size](https://img.shields.io/npm/unpacked-size/@ui-co/spin?color=green)](https://www.npmjs.com/package/@ui-co/spin)  [![Author](https://img.shields.io/badge/docs_by-robertpanvip-blue)](https://github.com/robertpanvip/spin.git)

📦 **Installation**
-------------------

    npm install @ui-co/spin

🏠 Exports
----------

### 

|参数|类型|
|---|---|
|📒SpinProps|`Interfaces`|
|🎗️default|`Functions`|

**📒Interfaces**
----------------

  
  

#### SpinProps

|参数|类型|说明|默认值|
|---|---|---|---|
|alpha|?: `number`|设置透明度，范围为 0 到 1，控制 Spin 组件的透明度。 - 0：完全透明； - 1：完全不透明； 默认值为 1。||
|children|?: `React.ReactNode`|子元素，通常是被加载的内容。当 spinning 为 true 时，会显示加载状态。||
|followMode|?: `"target"` \| `"intersection"`|设置 Spin 组件的跟随模式。 - 'target'：元素的位置跟随目标元素； - 'intersection'：元素的位置跟随视口与目标元素的交集。||
|indicator|?: `React.ReactNode`|自定义加载指示器。可以传入任意 React 节点，如自定义图标或动画。 默认会使用 Spin 组件内置的指示器。||
|prefixCls|?: `string`|设置 Spin 组件的 CSS 类前缀，默认为 'ant-spin'。 可用于自定义样式。||
|spinning|?: `boolean`|控制 Spin 是否处于加载状态。 - true：显示加载状态； - false 或 undefined：隐藏加载状态。||
|tip|?: `React.ReactNode`|提示文本，通常用于加载时显示的信息，放在加载指示器下方。 可以是字符串或 React 组件。||

**🎗️Functions**
----------------

  
  

#### Spin

*   用于页面和区块的加载中状态。  
      
    
*   Spin(\_\_namedParameters:`SpinProps`): `JSX.Element`

|参数|类型|说明|默认值|
|---|---|---|---|
|setDefaultIndicator|: ((indicator:`React.ReactNode`) => `React.ReactNode`)|自定义全局默认 Spin 的元素||