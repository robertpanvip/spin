import * as React from "react"
import {createPortal} from "react-dom";
import {useLayoutEffect, useRef} from "react";
import ScrollObserver, {getIntersection} from "./ScrollObserver";
import Ref from "./Ref";

export interface SpinProps {
    /**
     * 设置 Spin 组件的 CSS 类前缀，默认为 'ant-spin'。
     * 可用于自定义样式。
     */
    prefixCls?: string;

    /**
     * 自定义加载指示器。可以传入任意 React 节点，如自定义图标或动画。
     * 默认会使用 Spin 组件内置的指示器。
     */
    indicator?: React.ReactNode;

    /**
     * 子元素，通常是被加载的内容。当 spinning 为 true 时，会显示加载状态。
     */
    children?: React.ReactNode;

    /**
     * 控制 Spin 是否处于加载状态。
     * - true：显示加载状态；
     * - false 或 undefined：隐藏加载状态。
     */
    spinning?: boolean;

    /**
     * 提示文本，通常用于加载时显示的信息，放在加载指示器下方。
     * 可以是字符串或 React 组件。
     */
    tip?: React.ReactNode;

    /**
     * 设置 Spin 组件的跟随模式。
     * - 'target'：元素的位置跟随目标元素；
     * - 'intersection'：元素的位置跟随视口与目标元素的交集。
     */
    followMode?: 'target' | 'intersection';

    /**
     * 设置透明度，范围为 0 到 1，控制 Spin 组件的透明度。
     * - 0：完全透明；
     * - 1：完全不透明；
     * 默认值为 1。
     */
    alpha?: number;
}

interface DOMRect {
    height: number;
    width: number;
    x: number;
    y: number;
}


const css = (
    prefixCls: string
) => `
    .${prefixCls}anchor {
         position: fixed;
         left:0;
         top:0;
         width:0;
         height:0;
    }
    .${prefixCls}anchor>.${prefixCls}mask {
         display:flex;
         align-items: center;
         justify-content: center;
         flex-direction: column;
         gap: 0.5em;
         overflow: hidden;
         opacity: 0;
         pointer-events: none;
    }
     .${prefixCls}anchor .${prefixCls}content {
         display:flex;
         align-items: center;
         justify-content: center;
         flex-direction: column;
         gap: 0.5em;
    }
    .${prefixCls}anchor .${prefixCls}indicator{
        line-height:0;
        animation: ${prefixCls}rotateAnimation 1s linear infinite; /* 应用动画 */
    }
    
    .${prefixCls}anchor .${prefixCls}tip{
        font-size:0.5em;
        line-height: 1;
    }
    
    @keyframes ${prefixCls}rotateAnimation {
        0% {
            transform: rotate(0deg); /* 初始角度 */
        }
        100% {
            transform: rotate(360deg); /* 旋转一圈 */
        }
    }
    `
const styleMap = new Map<string, number>();

function useInject(prefixCls: string, css: (prefixCls: string) => string) {
    (React.useInsertionEffect || React.useLayoutEffect)(() => {
        const textContent = css(prefixCls);
        let count = styleMap.get(textContent) || 0
        count = count + 1;
        styleMap.set(textContent, count);
        if (count === 1) {
            const style = document.createElement('style');
            style.textContent = textContent;
            style.id = shortUUID(textContent);
            document.head.appendChild(style)
        }
        return () => {
            count = count - 1;
            styleMap.set(textContent, count);
        }
    }, [prefixCls])
}

function shortUUID(inputString: string) {
    // 使用 SHA-256 哈希并转为 Base64 编码
    const hashBuffer = new TextEncoder().encode(inputString);
    const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    // 截取前 8 位
    return hash.substring(0, 8).toLowerCase();
}

let defaultIndicator: React.ReactNode = (
    <svg viewBox="0 0 1024 1024" focusable="false" width="1em"
         height="1em" fill="currentColor">
        <path
            d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
    </svg>
);

/**自定义全局默认 Spin 的元素*/
const setDefaultIndicator = (indicator: React.ReactNode) => {
    defaultIndicator = indicator;
    return defaultIndicator
}

/**
 * 用于页面和区块的加载中状态。
 */
const Spin = (
    {
        indicator = defaultIndicator,
        tip,
        children,
        spinning = false,
        followMode = 'intersection',
        alpha = 0.3,
        prefixCls = `${shortUUID(css(''))}`
    }: SpinProps
) => {
    if (!prefixCls.endsWith('_')) {
        prefixCls = `${prefixCls}_`
    }
    const ref = useRef<HTMLDivElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);
    const maskContentRef = useRef<HTMLDivElement>(null);

    const setStyle = (rect: DOMRect, bound: DOMRect) => {
        const {x, y, width, height} = rect;
        const target = maskRef.current!
        target.style.transform = `translate(${x}px,${y}px)`;
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
        target.style.background = `rgba(0, 0, 0, ${alpha})`;
        target.style.opacity = '1';
        if (followMode === 'target') {
            const content = maskContentRef.current!;
            content.style.transform = `translate(${bound.x - x}px,${bound.y - y}px)`;
            //content.style.left = `${bound.x - x}px`;
            //content.style.top = `${bound.y - y}px`;
            content.style.width = `${bound.width}px`;
            content.style.height = `${bound.height}px`;
        }
    }

    useInject(prefixCls, css);

    useLayoutEffect(() => {
        const target = ref.current!
        if (!target || !spinning) {
            return () => void 0
        }
        const rob = new ResizeObserver(() => {
            maskRef.current!.style.opacity = '0'
            const {intersectionRect, boundingClientRect} = getIntersection(target);
            setStyle(intersectionRect, boundingClientRect)
        });
        rob.observe(target);
        const sb = new ScrollObserver((entries) => {
            entries.forEach(entry => {
                maskRef.current!.style.opacity = '0'
                setStyle(entry.intersectionRect, entry.boundingClientRect)
            });
        })
        sb.observe(target);
        return () => {
            rob.unobserve(target)
            rob.disconnect();
            sb.unobserve(target);
            sb.disconnect();
        }
    }, [spinning, prefixCls])

    const content = (
        <>
            <div className={`${prefixCls}indicator`}>
                {indicator}
            </div>
            <div className={`${prefixCls}tip`}>{tip}</div>
        </>
    )
    return (
        <>
            <Ref ref={ref}>
                {children}
            </Ref>
            {
                spinning && createPortal(
                    <div className={`${prefixCls}anchor`}>
                        <div className={`${prefixCls}mask`} ref={maskRef}>
                            {
                                followMode === 'target' && (
                                    <div className={`${prefixCls}content`} ref={maskContentRef}>
                                        {content}
                                    </div>
                                )
                            }
                            {
                                followMode === 'intersection' && content
                            }
                        </div>
                    </div>,
                    document.body
                )
            }
        </>

    )
}
/**自定义全局默认 Spin 的元素*/
Spin.setDefaultIndicator = setDefaultIndicator;

export default Spin
