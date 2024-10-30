import React, { ChangeEvent, useState } from 'react'
import { EditorProvider, ReactNodeViewRenderer, useCurrentEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button, cn, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger, Input, Select, SelectItem } from '@nextui-org/react'
import { BiImages, DashiconsEditorStrikethrough, FeListOrder, FeTextAlignCenter, FeTextAlignLeft, FeTextAlignRight, HeroiconsSolidCode, IcRoundFolder, MaterialSymbolsUpload, MdiFormatParagraph, MingcuteUnderlineFill, OcticonBold24, OouiListBulletLtr, TablerItalic, VaadinHeader } from './icons/icons'
import Underline from '@tiptap/extension-underline'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import { common, createLowlight } from 'lowlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import CodeBlockComponent from './editor/code-block'
import Image from '@tiptap/extension-image'
import { resizeFile } from '@/utils/resizer'
import { errorHandler } from '@/utils/error'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'

const lowlight = createLowlight(common)

const MenuBar = () => {
    const { editor } = useCurrentEditor()
    const [imageURL, setImageURL] = useState<string>('')

    if (!editor) return null

    const onFilesHandler = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files

        if (!files) return

        const fileLength = files.length
        const imageContent: Blob[] = []

        for (let i = 0; i < fileLength; i++) {
            console.log(files[i])
            const image = await resizeFile(files[i])
            imageContent.push(image as Blob)
        }
        const contentArray = imageContent.map((image) => ({
            type: 'image',
            attrs: {
                src: image,
            },
        }))


        editor.chain().focus().insertContent(contentArray).run()
    }

    const addImage = () => {
        try {
            console.log(imageURL)
            editor.chain().focus().setImage({ src: imageURL }).run()
        } catch (error) {
            errorHandler(error)
        }
    }

    return (
        <div className='pb-4 flex gap-x-2'>
            <Button
                size='sm'
                onPress={() => editor.chain().focus().toggleItalic().run()}
                startContent={<TablerItalic fontSize={18} />}
                isIconOnly
                className={`${editor.isActive('italic') ? 'text-blue-300 bg-blue-500/30' : null}`}
            />
            <Button
                size='sm'
                onPress={() => editor.chain().focus().toggleBold().run()}
                startContent={<OcticonBold24 fontSize={18} />}
                isIconOnly
                className={`${editor.isActive('bold') ? 'text-blue-300 bg-blue-500/30' : null}`}
            />
            <Select size='sm' startContent={<VaadinHeader fontSize={18} />} className='w-[100px]'>
                {
                    Array.from({ length: 3 }).map((_, idx: number) => (
                        <SelectItem
                            key={idx}
                            onClick={() => editor.chain().focus().toggleHeading({ level: (idx + 1) as any }).run()}
                            className={`${editor.isActive('heading', { level: idx + 1 }) ? 'text-blue-300 bg-blue-500/30' : null}`}
                        >
                            <span>{`Head ${idx + 1}`}</span>
                        </SelectItem>
                    ))
                }
            </Select>
            <Button
                size='sm'
                onPress={() => editor.chain().focus().setTextAlign('left').run()}
                startContent={<FeTextAlignLeft fontSize={18} />}
                isIconOnly
                className={`${editor.isActive({ textAlign: 'left' }) ? 'text-blue-300 bg-blue-500/30' : null}`}
            />
            <Button
                size='sm'
                onPress={() => editor.chain().focus().setTextAlign('center').run()}
                startContent={<FeTextAlignCenter fontSize={18} />}
                isIconOnly
                className={`${editor.isActive({ textAlign: 'center' }) ? 'text-blue-300 bg-blue-500/30' : null}`}
            />
            <Button
                size='sm'
                onPress={() => editor.chain().focus().setTextAlign('right').run()}
                startContent={<FeTextAlignRight fontSize={18} />}
                isIconOnly
                className={`${editor.isActive({ textAlign: 'right' }) ? 'text-blue-300 bg-blue-500/30' : null}`}
            />
            <Button
                size='sm'
                onPress={() => editor.chain().focus().setParagraph().run()}
                startContent={<MdiFormatParagraph fontSize={18} />}
                isIconOnly
                className={`${editor.isActive('paragraph') ? 'text-blue-300 bg-blue-500/30' : null}`}
            />
            <Button
                size='sm'
                onPress={() => editor.chain().focus().toggleUnderline().run()}
                startContent={<MingcuteUnderlineFill fontSize={18} />}
                isIconOnly
                className={`${editor.isActive('underline') ? 'text-blue-300 bg-blue-500/30' : null}`}
            />
            <Button
                size='sm'
                onPress={() => editor.chain().focus().toggleOrderedList().run()}
                startContent={<FeListOrder fontSize={18} />}
                isIconOnly
                className={`${editor.isActive('orderedList') ? 'text-blue-300 bg-blue-500/30' : null}`}
            />
            <Button
                size='sm'
                onPress={() => editor.chain().focus().toggleBulletList().run()}
                startContent={<OouiListBulletLtr fontSize={18} />}
                isIconOnly
                className={`${editor.isActive('bulletList') ? 'text-blue-300 bg-blue-500/30' : null}`}
            />
            <Button
                size='sm'
                onPress={() => editor.chain().focus().toggleStrike().run()}
                startContent={<DashiconsEditorStrikethrough fontSize={28} />}
                isIconOnly
                className={`${editor.isActive('strike') ? 'text-blue-300 bg-blue-500/30' : null}`}
            />
            <Button
                size='sm'
                onPress={() => editor.chain().focus().toggleCodeBlock().run()}
                startContent={<HeroiconsSolidCode fontSize={18} />}
                isIconOnly
                className={`${editor.isActive('codeBlock') ? 'text-blue-300 bg-blue-500/30' : null}`}
            />
            <Dropdown type='listbox' closeOnSelect={false}>
                <DropdownTrigger>
                    <Button
                        startContent={<BiImages fontSize={18} />}
                        size='sm'
                        isIconOnly
                    >
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Static Actions">
                    <DropdownSection showDivider>
                        <DropdownItem className='p-0' key="local">
                            <Input onChange={onFilesHandler} accept='image/*' startContent={<IcRoundFolder fontSize={18} />} variant='flat' size='sm' type='file' multiple />
                        </DropdownItem>
                    </DropdownSection>

                    <DropdownItem className='p-0' key="copy">
                        <Input
                            value={imageURL}
                            onValueChange={(val: string) => setImageURL(val)}
                            startContent={<span className='text-tiny'>URL:</span>}
                            variant='flat' size='sm' type='text'
                            endContent={
                                <Button
                                    onPress={addImage}
                                    variant='light'
                                    startContent={<MaterialSymbolsUpload fontSize={18} />}
                                    size='sm'
                                    isIconOnly
                                >
                                </Button>
                            }
                        />
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </div>
    )
}

const TextEditor = ({ className }: { className?: string}) => {
    return (
        <EditorProvider
            editorProps={{
                attributes: {
                    class: cn(
                        'prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc bg-background/50 rounded-lg',
                        className
                    ),
                },
            }}
            extensions={[StarterKit, Underline, ListItem, OrderedList, TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
                Image.configure({
                    allowBase64: true,

                }),
                CodeBlockLowlight.extend({
                    addNodeView() {
                        return ReactNodeViewRenderer(CodeBlockComponent)
                    },
                }).configure({ lowlight }), Placeholder.configure({ placeholder: 'Write your question here...' })]}
            slotBefore={<MenuBar />}
        >

        </EditorProvider>
    )
}

export default TextEditor