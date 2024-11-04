import { clientAPI } from '@/config/axios.config'
import { popularColors } from '@/constants/color'
import { errorHandler } from '@/utils/error'
import { Avatar, Button, Divider, Input, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/react'
import React, { FormEvent, useState } from 'react'
import { toast } from 'react-toastify'

type Props = {}

const CategoryFormModal = (props: Props) => {
    const [selectedColor, setSelectedColor] = useState<string>(popularColors[0])
    const [customColor, setCustomColor] = useState<string>('')
    const [error, setError] = useState<string>('')

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value
        setCustomColor(color)
        setSelectedColor(color)
    }

    const onCreateCategory = async (e: FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault()
            const formEntries = Object.fromEntries(new FormData(e.currentTarget))
            console.log(formEntries)
            if (formEntries.category_name == '') throw new Error('Please enter category name')
            const res = await clientAPI.patch('category', formEntries)
            console.log(res.data)
            toast.success('Create examination successfully')
            
        } catch (error) {
            console.log(error)
            toast.error('' + error)
        }

    }

    return (
        <ModalContent>
            {
                (onClose) => (
                    <form onSubmit={onCreateCategory}>
                        <ModalHeader><h1>New Category</h1></ModalHeader>
                        <ModalBody>
                            <div className='flex gap-x-6 items-center'>
                                <label>Name </label>
                                <Input name='name' size='sm' />
                            </div>
                            <Divider />
                            <div className='flex flex-wrap gap-3'>
                                {
                                    popularColors.map((color: string, idx: number) => (
                                        <Avatar
                                            color='secondary'
                                            isBordered={!customColor && selectedColor === color}
                                            size='sm'
                                            onClick={() => {
                                                setSelectedColor(color)
                                                setCustomColor('') // Reset custom color when a popular color is selected
                                            }}
                                            className='cursor-pointer'
                                            key={idx}
                                            style={{ backgroundColor: color }}
                                            name=' '
                                        />
                                    ))
                                }
                            </div>
                        </ModalBody>
                        <ModalFooter className='flex items-center justify-between'>
                            <div>
                                <Avatar
                                    color='secondary'
                                    size='sm'
                                    style={{ backgroundColor: customColor || selectedColor }}
                                    name=' '
                                />
                            </div>

                            <label className='text-sm'>HEX </label>
                            <Input
                                name='color'
                                onChange={handleColorChange}
                                value={customColor || selectedColor}
                                size='sm'
                            />
                            <Button color="danger" variant="light" onPress={onClose}>
                                Close
                            </Button>
                            <Button type='submit' color="success" onPress={onClose}>
                                Create
                            </Button>
                        </ModalFooter>
                    </form>
                )
            }
        </ModalContent>
    )
}

export default CategoryFormModal
