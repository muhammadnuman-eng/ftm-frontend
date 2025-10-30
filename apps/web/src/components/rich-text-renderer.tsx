import type React from "react";

interface TextNode {
    type: "text";
    text: string;
    format?: number;
}

interface HeadingNode {
    type: "heading";
    tag?: number;
    children?: TextNode[];
}

interface ParagraphNode {
    type: "paragraph";
    children?: TextNode[];
}

interface ListItemNode {
    type: "listitem";
    children?: TextNode[];
}

interface ListNode {
    type: "list";
    listType?: "number" | "bullet";
    children?: ListItemNode[];
}

interface QuoteNode {
    type: "quote";
    children?: TextNode[];
}

type RichTextNode = ParagraphNode | HeadingNode | ListNode | QuoteNode;

interface RichTextContent {
    root: {
        children: RichTextNode[];
    };
}

interface RichTextRendererProps {
    content: RichTextContent | unknown;
    className?: string;
    onHeadingExtracted?: (
        headings: Array<{ id: string; text: string; level: number }>,
    ) => void;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({
    content,
    className = "",
    onHeadingExtracted,
}) => {
    if (!content || typeof content !== "object") {
        return <div className={className}>No content available</div>;
    }

    // Handle Lexical rich text format
    if (
        content &&
        typeof content === "object" &&
        "root" in content &&
        (content as RichTextContent).root?.children
    ) {
        const richContent = content as RichTextContent;
        const headings: Array<{ id: string; text: string; level: number }> = [];
        let h2Index = 0;

        const renderedContent = richContent.root.children.map(
            (node: RichTextNode, index: number) => {
                const nodeKey = `${node.type}-${index}-${Math.random().toString(36).substr(2, 9)}`;

                if (node.type === "paragraph") {
                    return (
                        <p key={nodeKey} className="mb-4">
                            {node.children?.map(
                                (child: TextNode, _childIndex: number) => {
                                    if (child.type === "text") {
                                        let text: string | React.ReactElement =
                                            child.text;
                                        const childKey = `${nodeKey}-child-${child.text.substring(0, 10)}`;

                                        // Apply formatting
                                        if (child.format && child.format & 1)
                                            text = (
                                                <strong
                                                    key={`${childKey}-strong`}
                                                >
                                                    {child.text}
                                                </strong>
                                            );
                                        if (child.format && child.format & 2)
                                            text = (
                                                <em key={`${childKey}-em`}>
                                                    {child.text}
                                                </em>
                                            );
                                        if (child.format && child.format & 4)
                                            text = (
                                                <u key={`${childKey}-u`}>
                                                    {child.text}
                                                </u>
                                            );
                                        if (child.format && child.format & 8)
                                            text = (
                                                <code key={`${childKey}-code`}>
                                                    {child.text}
                                                </code>
                                            );

                                        return text;
                                    }
                                    return null;
                                },
                            )}
                        </p>
                    );
                }

                if (node.type === "heading") {
                    const headingLevel = node.tag || 1;
                    const headingText = node.children
                        ?.map((child: TextNode) => {
                            if (child.type === "text") {
                                return child.text;
                            }
                            return "";
                        })
                        .join("");

                    // Extract all headings for table of contents
                    if (headingText) {
                        const headingId = `heading-${h2Index}`;
                        headings.push({
                            id: headingId,
                            text: headingText,
                            level: headingLevel,
                        });
                        h2Index++;
                    }

                    if (headingLevel === 1) {
                        return (
                            <h1
                                key={nodeKey}
                                className="mb-4 font-bold text-3xl"
                            >
                                {headingText}
                            </h1>
                        );
                    }
                    if (headingLevel === 2) {
                        const headingId = `heading-${headings.length - 1}`;
                        return (
                            <h2
                                key={nodeKey}
                                id={headingId}
                                className="mb-4 font-bold text-2xl"
                            >
                                {headingText}
                            </h2>
                        );
                    }
                    if (headingLevel === 3) {
                        const headingId = `heading-${headings.length - 1}`;
                        return (
                            <h3
                                key={nodeKey}
                                id={headingId}
                                className="mb-4 font-bold text-xl"
                            >
                                {headingText}
                            </h3>
                        );
                    }
                    if (headingLevel === 4) {
                        const headingId = `heading-${headings.length - 1}`;
                        return (
                            <h4
                                key={nodeKey}
                                id={headingId}
                                className="mb-4 font-bold text-lg"
                            >
                                {headingText}
                            </h4>
                        );
                    }
                    if (headingLevel === 5) {
                        const headingId = `heading-${headings.length - 1}`;
                        return (
                            <h5
                                key={nodeKey}
                                id={headingId}
                                className="mb-4 font-bold text-base"
                            >
                                {headingText}
                            </h5>
                        );
                    }
                    if (headingLevel === 6) {
                        const headingId = `heading-${headings.length - 1}`;
                        return (
                            <h6
                                key={nodeKey}
                                id={headingId}
                                className="mb-4 font-bold text-sm"
                            >
                                {headingText}
                            </h6>
                        );
                    }
                }

                if (node.type === "list") {
                    const ListTag = node.listType === "number" ? "ol" : "ul";
                    return (
                        <ListTag key={`list-${nodeKey}`} className="mb-4 ml-6">
                            {node.children?.map(
                                (listItem: ListItemNode, itemIndex: number) => {
                                    const listItemKey = `${nodeKey}-item-${itemIndex}-${listItem.children?.[0]?.text?.substring(0, 10) || "item"}`;
                                    return (
                                        <li key={listItemKey}>
                                            {listItem.children?.map(
                                                (
                                                    child: TextNode,
                                                    _childIndex: number,
                                                ) => {
                                                    if (child.type === "text") {
                                                        return child.text;
                                                    }
                                                    return null;
                                                },
                                            )}
                                        </li>
                                    );
                                },
                            )}
                        </ListTag>
                    );
                }

                if (node.type === "quote") {
                    return (
                        <blockquote
                            key={`quote-${nodeKey}`}
                            className="mb-4 border-indigo-500 border-l-4 pl-4 italic"
                        >
                            {node.children?.map(
                                (child: TextNode, _childIndex: number) => {
                                    if (child.type === "text") {
                                        return child.text;
                                    }
                                    return null;
                                },
                            )}
                        </blockquote>
                    );
                }

                return null;
            },
        );

        // Call the callback with extracted headings
        if (onHeadingExtracted && headings.length > 0) {
            onHeadingExtracted(headings);
        }

        return <div className={className}>{renderedContent}</div>;
    }

    // Fallback for other content types
    return (
        <div className={className}>
            <pre className="text-slate-400 text-sm">
                {JSON.stringify(content, null, 2)}
            </pre>
        </div>
    );
};

export default RichTextRenderer;
