import { clientAPI } from '@/config/axios.config'
import { useUserStore } from '@/stores/user.store'
import { errorHandler } from '@/utils/error'
import { Select, SelectItem, Button, Selection, Avatar } from '@nextui-org/react'
import { useFormikContext } from 'formik'
import React, { ChangeEvent, useEffect, useState } from 'react'

type Props = {
    handleChange: (e: ChangeEvent<any>) => void
    isDisable?: boolean
}

const CategorySelector = (props: Props) => {
    const [categories, setCategories] = useState<CategoryResponse[]>([])
    const [selectedCategories, setSelectedCategories] = useState<Selection>(new Set([]))
    const { user } = useUserStore()

    useEffect(() => {
        const getCategories = async () => {
            try {
                const res = await clientAPI.get(`user/category/${user?._id}`)
                setCategories(res.data.data)
                console.log(res.data)
            } catch (error) {
                errorHandler(error)
            }
        }
        getCategories()
    }, [])

    return (
        <div className='flex flex-col'>
            <div className='flex gap-x-3 items-center'>
                <Select
                    isDisabled={props.isDisable}
                    items={categories}
                    placeholder='Select your categories here'
                    selectionMode='multiple'
                    name='category'
                    onSelectionChange={setSelectedCategories}
                    aria-label='category'>
                    {(category) => (
                        <SelectItem
                            startContent={<Avatar name=' ' size='sm' style={{ backgroundColor: category.color }}/>}
                            key={category._id}>{category.name}
                        </SelectItem>
                    )}
                </Select>
                <Button isDisabled={props.isDisable} color='secondary' size='sm' variant='light'>New Category</Button>
            </div>
        </div>
    )
}

export default CategorySelector
