import React, { ForwardedRef } from "react";

export type CommentProps = {
  data?: string;
};

function updateRef(
  node: Comment | null,
  ref: React.ForwardedRef<null | Comment>
) {
  const content = (node || null) as Comment | null;
  // 如果 ref 是函数，则调用该函数，否则直接将内容赋值给 ref 的 current
  typeof ref === "function" ? ref(content) : ref && (ref.current = content);
}

function CommentRender(
  { data = "" }: CommentProps,
  ref: ForwardedRef<null | Comment>
) {
  return (
    <span
      ref={(ele) => {
        if (ele) {
          const comment = document.createComment(data);
          ele.replaceWith(comment);
          updateRef(comment, ref);
          const parent = comment.parentNode!;
          if (!parent) return;
          const removeChild = parent!.removeChild.bind(parent);
          const insertBefore = parent!.insertBefore.bind(parent);
          const replaceChild = parent!.replaceChild.bind(parent);
          // 替换节点时的映射逻辑
          const resolve = <T extends Node>(node: T): T =>
            node === (ele as unknown as T) ? (comment as unknown as T) : node;

          parent.removeChild = function (child) {
            if (child === (comment as unknown as typeof child))
              updateRef(null, ref);
            return removeChild(resolve(child));
          };
          parent.insertBefore = function (child, beforeChild) {
            return insertBefore(resolve(child), beforeChild);
          };
          parent.replaceChild = function (newNode, oldNode) {
            return replaceChild(newNode, resolve(oldNode));
          };
        } else {
          updateRef(null, ref);
        }
      }}
      style={{ display: "contents" }}
    />
  );
}

/**支持在react中生成注释节点*/
const HTMLComment = React.forwardRef(CommentRender);

HTMLComment.displayName = "HTMLComment"; // 设置组件的 displayName，方便调试
export default HTMLComment;
