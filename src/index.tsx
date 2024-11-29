import * as React from "react"
import {createPortal} from "react-dom";
import {useLayoutEffect, useMemo, useRef} from "react";
import ScrollObserver, {getIntersection} from "./ScrollObserver";
import Ref from "./Ref";

export interface SpinProps {
    prefixCls?: string;
    indicator?: React.ReactNode;
    children?: React.ReactNode;
    spinning?: boolean;
    tip?: React.ReactNode;
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
         pointer-events: none;
         position: absolute;
         display:flex;
         align-items: center;
         justify-content: center;
         flex-direction: column;
         gap: 10px;
    }
    .${prefixCls}anchor>.${prefixCls}mask>.${prefixCls}indicator{
        line-height:0;
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
        tip,
        children,
        spinning = false,
        prefixCls = `${shortUUID(css(''))}`
    }
) => {
    if (!prefixCls.endsWith('_')) {
        prefixCls = `${prefixCls}_`
    }
    const ref = useRef<HTMLDivElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);
    const styleRef = useRef<HTMLStyleElement>(null);

    const setStyle = (rect: DOMRect) => {
        const {x, y, width, height} = rect;
        const target = maskRef.current!
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
    }

    useLayoutEffect(() => {
        const target = ref.current!
        if (!target || !spinning) {
            return () => void 0
        }
        const rob = new ResizeObserver(() => {
            const {intersectionRect} = getIntersection(target);
            setStyle(intersectionRect)
        });
        rob.observe(target);
        const sb = new ScrollObserver((entries) => {
            entries.forEach(entry => {
                setStyle(entry.intersectionRect)
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

    const defaultStyle = useMemo(() => css(prefixCls), [prefixCls])

    return (
        <>
            <Ref ref={ref}>
                {children}
            </Ref>
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
                            <div className={`${prefixCls}tip`}>{tip}</div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </>

    )
}
export default Spin
