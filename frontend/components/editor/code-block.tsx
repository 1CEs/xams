import { Select, SelectItem } from "@nextui-org/react"
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from "@tiptap/react"
import { FC, ChangeEvent } from "react"

const CodeBlockComponent: FC<NodeViewProps> = ({ node: { attrs: { language: defaultLanguage } }, updateAttributes, extension }) => (
    <NodeViewWrapper className="code-block">
        <Select
            size="sm"
            className="w-[10%]"
            contentEditable={false}
            defaultSelectedKeys={defaultLanguage}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => updateAttributes({ language: event.target.value })}
        >
            <SelectItem key={'null'}> auto </SelectItem>
            <SelectItem key={''} isReadOnly>-</SelectItem>
            {extension.options.lowlight.listLanguages().map((lang: string, index: number) => (
                <SelectItem key={lang}>
                    {lang}
                </SelectItem>
            ))}

        </Select>
        <pre>
            <NodeViewContent as="code" />
        </pre>
    </NodeViewWrapper>
)

export default CodeBlockComponent