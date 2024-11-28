interface ScrollObserverCallback {
    (entries: IntersectionObserverEntry[], observer: ScrollObserver): void;
}

// 全局滚动回调管理器
const scrollManager = {
    handlers: new Map<Element | Document, Set<() => void>>(),

    // 添加回调
    add(parent: Element | Document, callback: () => void) {
        if (!this.handlers.has(parent)) {
            this.handlers.set(parent, new Set());
            parent.addEventListener("scroll", this.trigger.bind(this, parent), {passive: true});
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
            parent.removeEventListener("scroll", this.trigger.bind(this, parent));
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

interface IntersectionRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

export function getIntersection(element: Element): IntersectionObserverEntry {
    const elementRect = element.getBoundingClientRect();
    //console.log('elementRect',elementRect);
    // 获取目标元素的所有可滚动父元素
    const scrollableParents = findScrollableParents(element);

    let intersectionRect: IntersectionRect = elementRect;

    scrollableParents.forEach((scrollableParent) => {

        const scrollRect = scrollableParent instanceof Element ? scrollableParent.getBoundingClientRect() : {
            left: 0,
            top: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
            width: window.innerWidth,
            height: window.innerHeight,
        };
        //console.log('scrollRect',scrollableParent,scrollRect);

        // 计算目标元素和滚动父元素之间的交集区域
        const intersectLeft = Math.max(intersectionRect.left, scrollRect.left);
        const intersectTop = Math.max(intersectionRect.top, scrollRect.top);
        const intersectRight = Math.min(intersectionRect.right, scrollRect.right);
        const intersectBottom = Math.min(intersectionRect.bottom, scrollRect.bottom);

        // 如果没有交集区域，跳过
        if (intersectRight <= intersectLeft || intersectBottom <= intersectTop) return;

        intersectionRect = {
            left: intersectLeft,
            top: intersectTop,
            right: intersectRight,
            bottom: intersectBottom,
            width: intersectRight - intersectLeft,
            height: intersectBottom - intersectTop,
        };
    });
    // 计算交集区域面积
    const intersectionArea = intersectionRect.width * intersectionRect.height;

    // 计算元素的面积
    const elementArea = elementRect.width * elementRect.height;
    const _intersectionRect = {
        ...intersectionRect,
        x: intersectionRect.left,
        y: intersectionRect.top
    } as DOMRect

    return {
        boundingClientRect: elementRect,
        intersectionRect: _intersectionRect,
        intersectionRatio: intersectionArea / elementArea,
        isIntersecting: intersectionArea > 0,
        rootBounds: null,
        target: element,
        time: performance?.now?.() || Date.now()
    };
}

export default class ScrollObserver {
    constructor(callback: ScrollObserverCallback) {

        const iob = new IntersectionObserver((entries) => {

            entries.forEach(entry => {
                const target = (entry.target as unknown as Element & { __scroll?: () => void })
                const getEntries = () => {
                    return entries.map(entry => {
                        const target = entry.target as Element;
                        // 手动计算 intersectionRatio
                        return getIntersection(target);
                    })
                }

                if (!target.__scroll) {
                    target.__scroll = () => {
                        callback(getEntries(), this)
                    }
                }
                const scrolls = findScrollableParents(entry.target);
                if (entry.isIntersecting) {
                    console.log('元素出现在视口中', entry);
                    callback(getEntries(), this)
                    scrolls.forEach(ele => {
                        scrollManager.add(ele, target.__scroll!)
                    })
                } else {
                    scrolls.forEach(ele => {
                        scrollManager.remove(ele, target.__scroll!)
                    })
                    target.__scroll = undefined;
                    console.log('元素离开了视口');
                }
            });
        }, {
            threshold: [0, 1]
        })
        this.observe = function (target: Element) {
            iob.observe(target);
        }
        this.unobserve = function (target: Element) {
            iob.unobserve(target);
        }
        this.disconnect = function () {
            iob.disconnect()
        }
    }

    observe: (target: Element) => void

    unobserve: (target: Element) => void

    disconnect: () => void
}