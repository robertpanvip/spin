export interface ScrollObserverCallback {
    (entries: IntersectionObserverEntry[], observer: ScrollObserver): void;
}

const CacheMap = window.WeakMap ? WeakMap : Map;
const triggerCache = new CacheMap<Element | Document, () => void>();
const scrollCache = new CacheMap<Element | Document, () => void>()
// 全局滚动回调管理器
const scrollManager = {
    handlers: new CacheMap<Element | Document, Set<() => void>>(),
    // 添加回调
    add(parent: Element | Document, callback: () => void) {
        if (!this.handlers.has(parent)) {
            this.handlers.set(parent, new Set());
            const trigger = this.trigger.bind(this, parent);
            triggerCache.set(parent, trigger)
            parent.addEventListener("scroll", trigger, {passive: true});
        }
        this.handlers.get(parent)!.add(callback);
    },

    // 移除回调
    remove(parent: Element | Document, callback: () => void) {
        if (!this.handlers.has(parent)) return;
        const callbacks = this.handlers.get(parent)!;
        callbacks.delete(callback);

        // 如果没有剩余的回调，则移除滚动监听
        if (callbacks.size === 0) {
            const trigger = triggerCache.get(parent)!
            parent.removeEventListener("scroll", trigger);
            this.handlers.delete(parent);
        }
    },

    // 触发回调
    trigger(parent: Element | Document) {
        const callbacks = this.handlers.get(parent);
        if (!callbacks) return;
        callbacks.forEach((callback) => callback());
    },
};

function findScrollableParents(element: Element): Set<Element | Document> {
    const scrollableParents = new Set<Element | Document>(); // 使用 Set 避免重复
    let currentElement: Element | null = element;

    while (currentElement) {
        const style = window.getComputedStyle(currentElement);

        const isScrollable =
            (style.overflow === "auto" || style.overflow === "scroll") ||
            (style.overflowX === "auto" || style.overflowX === "scroll") ||
            (style.overflowY === "auto" || style.overflowY === "scroll");

        if (isScrollable) {
            scrollableParents.add(currentElement);
        }
        currentElement = currentElement.parentElement;
    }

    // 确保包含 document 对象
    scrollableParents.add(document);
    return scrollableParents;
}

export interface IntersectionRect {
    x: number;
    y: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

function getBoundingClientRect(ele: Window | Document | Element) {
    if (ele instanceof Window) {
        return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    } else {
        const scroll = ele instanceof Element ? ele : ele.firstElementChild!;
        return scroll.getBoundingClientRect()
    }
}

const getIntersectionRect = (element: Element) => {
    const elementRect = element.getBoundingClientRect();
    //console.log('elementRect',elementRect);
    // 获取目标元素的所有可滚动父元素
    const scrollableParents = findScrollableParents(element);

    let intersectionRect: IntersectionRect = elementRect;
    //console.log('intersectionRect', element, intersectionRect);
    [...scrollableParents, window].forEach((ele) => {
        const scrollRect = getBoundingClientRect(ele)
        //console.log('scrollRect', ele, scrollRect);
        // 计算目标元素和滚动父元素之间的交集区域
        const intersectLeft = Math.max(intersectionRect.left, scrollRect.left);
        const intersectTop = Math.max(intersectionRect.top, scrollRect.top);
        const intersectRight = Math.min(intersectionRect.right, scrollRect.right);
        const intersectBottom = Math.min(intersectionRect.bottom, scrollRect.bottom);
        // 如果没有交集区域，跳过
        if (intersectRight <= intersectLeft || intersectBottom <= intersectTop) return;

        intersectionRect = {
            x: intersectLeft,
            y: intersectTop,
            left: intersectLeft,
            top: intersectTop,
            right: intersectRight,
            bottom: intersectBottom,
            width: intersectRight - intersectLeft,
            height: intersectBottom - intersectTop,
        };
        //console.log(intersectionRect)
    });


    return intersectionRect as DOMRect;
}


export function getIntersection(element: Element): IntersectionObserverEntry {

    return {
        get boundingClientRect() {
            return element.getBoundingClientRect()
        },
        get intersectionRect() {
            return getIntersectionRect(element)
        },
        get intersectionRatio() {
            const intersectionRect = this.intersectionRect
            // 计算交集区域面积
            const intersectionArea = intersectionRect.width * intersectionRect.height;
            const elementRect = this.boundingClientRect;
            // 计算元素的面积
            const elementArea = elementRect.width * elementRect.height;
            return intersectionArea / elementArea
        },
        get isIntersecting() {
            const intersectionRect = this.intersectionRect
            // 计算交集区域面积
            const intersectionArea = intersectionRect.width * intersectionRect.height;
            return intersectionArea > 0
        },
        rootBounds: null,
        target: element,
        time: performance?.now?.() || Date.now()
    }
}


export default class ScrollObserver {
    constructor(callback: ScrollObserverCallback) {

        function unobserve(
            target: Element,
            scrolls: Set<Element | Document> = findScrollableParents(target)
        ) {
            scrolls.forEach(ele => {
                scrollManager.remove(ele, scrollCache.get(target)!)
            })
            scrollCache.delete(target)
        }

        const iob = new IntersectionObserver((entries) => {

            entries.forEach(entry => {
                const target = entry.target;
                const getEntries = () => {
                    return entries.map(entry => {
                        const target = entry.target as Element;
                        // 手动计算 intersectionRatio
                        return getIntersection(target);
                    })
                }
                if (!scrollCache.get(target)) {
                    scrollCache.set(target, () => {
                        callback(getEntries(), this)
                    })
                }
                const scrolls = findScrollableParents(entry.target);
                if (entry.isIntersecting) {
                    callback(getEntries(), this)
                    scrolls.forEach(ele => {
                        scrollManager.add(ele, scrollCache.get(target)!)
                    })
                } else {
                    unobserve(target, scrolls);
                }
            });
        }, {
            threshold: [0, 1]
        })
        const targets = new Set<Element>();
        this.observe = function (target: Element) {
            iob.observe(target);
            targets.add(target)
        }
        this.unobserve = function (target: Element) {
            iob.unobserve(target);
            targets.delete(target);
            unobserve(target);
        }
        this.disconnect = function () {
            iob.disconnect();
            targets.forEach((target) => {
                unobserve(target)
            });
            targets.clear();
        }
    }

    observe: (target: Element) => void

    unobserve: (target: Element) => void

    disconnect: () => void
}