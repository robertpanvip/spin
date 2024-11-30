import React, {ForwardedRef, useLayoutEffect} from "react";

export type CommentProps = {
    data?: string;
};

function UUID() {
    const buffer = new Uint8Array(16); // 16 bytes = 128 bits
    window.crypto.getRandomValues(buffer); // 填充随机字节
    // 设置版本号为 4 (UUID v4)
    buffer[6] = (buffer[6] & 0x0f) | 0x40;  // 第 7 字节的高位设为 0100（v4 标准）
    buffer[8] = (buffer[8] & 0x3f) | 0x80;  // 第 9 字节的高位设为 10xx（随机）
    // 转为 UUID 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const hex = [...buffer].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function updateRef(
    node: Comment | null,
    ref: React.ForwardedRef<null | Comment>
) {
    const content = (node || null) as Comment | null;
    // 如果 ref 是函数，则调用该函数，否则直接将内容赋值给 ref 的 current
    typeof ref === "function" ? ref(content) : ref && (ref.current = content);
}

const createTextNode = document.createTextNode.bind(document);

const temp = new Map<string, Comment>();

//react 内部是用这个创建文本节点的 由于react本身不支持创建注释节点 这里hack一下
document.createTextNode = function (text: string) {
    if (text.startsWith('<!--') && text.endsWith('-->')) {
        const regex = /<!--\[(.*?)](.*?)-->/
        const match = text.match(regex);
        if (match) {
            const uuid = match[1].trim();
            const data = match[2].trim();
            const comment = temp.get(uuid) || document.createComment(data);
            return comment as Text
        }
    }
    return createTextNode(text)
}

/**避免内存溢出*/
function cleanUpDetachedNodes(temp: Map<string, Comment>) {
    for (const [key, item] of temp) {
        if (!item.parentNode) {
            temp.delete(key); // 安全地删除项
        }
    }
}


function CommentRender(
    {data = ""}: CommentProps,
    ref: ForwardedRef<null | Comment>
) {
    const uuid = React.useRef<string>(UUID());

    React.useMemo(() => temp.set(uuid.current, document.createComment(data)), [data])

    const key = React.useMemo(() => `[${uuid.current}]${data}`.trim(), [data])

    const commentStr = React.useMemo(() => `<!--${key}-->`, [key])

    useLayoutEffect(() => {
        /**避免内存溢出*/
        cleanUpDetachedNodes(temp)
        updateRef(temp.get(uuid.current!) || null, ref);
        return () => {
            updateRef(null, ref);
        }
    }, [data])
    return <>{commentStr}</>
}

/**支持在react中生成注释节点*/
const HTMLComment = React.memo(React.forwardRef(CommentRender), (prevProps, next) => prevProps.data === next.data);

HTMLComment.displayName = "HTMLComment"; // 设置组件的 displayName，方便调试
export default HTMLComment;
