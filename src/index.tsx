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
         background: rgba(0, 0, 0, 0.3);
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

const defaultIndicator = (
    <span style={{fontSize: 100}}>
         <svg viewBox="0 0 1024 1024" focusable="false" width="1em"
              height="1em" fill="currentColor">
              <path
                  d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
         </svg>
    </span>
)

const Spin: React.FC<SpinProps> = (
    {
        indicator = defaultIndicator,
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
