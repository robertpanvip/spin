import * as React from "react"
import {createPortal} from "react-dom";
import {useLayoutEffect, useMemo, useRef} from "react";
import ScrollObserver, {getIntersection} from "./ScrollObserver";

export interface SpinProps {
    prefixCls?: string;
    indicator?: React.ReactNode;
    children?: React.ReactNode;
    spinning?: boolean
}

interface DOMRect {
    height: number;
    width: number;
    x: number;
    y: number;
}


const style = (
    {width, height, x, y}: DOMRect,
    prefixCls: string
) => `
    .${prefixCls}anchor {
         position: absolute;
         left:0;
         top:0;
         width:0;
         height:0;
    }
    .${prefixCls}anchor>.${prefixCls}mask {
         pointer-events: none;
         position: absolute;
         left:${x}px;
         top:${y}px;
         width:${width}px;
         height:${height}px;
         display:flex;
         align-items: center;
         justify-content: center;
    }
    .${prefixCls}anchor>.${prefixCls}mask>.${prefixCls}indicator{
        animation: ${prefixCls}rotateAnimation 1s linear infinite; /* 应用动画 */
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
const zeroRect = {
    width: 0,
    height: 0,
    x: 0,
    y: 0
};

function shortUUID(inputString: string) {
    // 使用 SHA-256 哈希并转为 Base64 编码
    const hashBuffer = new TextEncoder().encode(inputString);
    const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    // 截取前 8 位
    return hash.substring(0, 8).toLowerCase();
}

const Spin: React.FC<SpinProps> = (
    {
        indicator,
        children,
        spinning = false,
        prefixCls = `${shortUUID(style(zeroRect, ''))}`
    }
) => {
    if (!prefixCls.endsWith('_')) {
        prefixCls = `${prefixCls}_`
    }
    const ref = useRef<HTMLDivElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);
    const styleRef = useRef<HTMLStyleElement>(null);

    useLayoutEffect(() => {
        const target = ref.current!.firstElementChild!
        if (!target || !spinning) {
            return () => void 0
        }
        const rob = new ResizeObserver(() => {
            const {intersectionRect} = getIntersection(target)
            styleRef.current!.textContent = style(intersectionRect, prefixCls)
        });
        rob.observe(target);
        const sb = new ScrollObserver((entries) => {
            entries.forEach(entry => {
                styleRef.current!.textContent = style(entry.intersectionRect, prefixCls)
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

    const defaultStyle = useMemo(() => style(zeroRect, prefixCls), [prefixCls])

    return (
        <div ref={ref} style={{display: 'contents'}}>
            {children}
            {
                spinning && createPortal(<style ref={styleRef}>{defaultStyle}</style>, document.head)
            }
            {
                spinning && createPortal(
                    <div className={`${prefixCls}anchor`}>
                        <div className={`${prefixCls}mask`} ref={maskRef}>
                            <div className={`${prefixCls}indicator`}>
                                {indicator}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div>
    )
}
export default Spin
