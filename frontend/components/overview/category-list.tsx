import { clientAPI } from '@/config/axios.config';
import { CATEGORY_COLUMNS } from '@/constants/table';
import { Table, TableHeader, TableColumn, TableBody, TableCell, TableRow, Chip, Modal, useDisclosure } from '@nextui-org/react';
import React, { useEffect, useState } from 'react';
import { FeEdit, MdiBin } from '../icons/icons';
import { errorHandler } from '@/utils/error';
import ConfirmModal from '../modals/confirm-modal';
import { useUserStore } from '@/stores/user.store';
import { useTrigger } from '@/stores/trigger.store';

type Props = {}

type CategoryColumns = CategoryResponse | { action: string }

const CategoryList = (props: Props) => {
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { user } = useUserStore()
    const { trigger } = useTrigger() 

    const onDeleteCategory = async () => {
        console.log('wtf')
        if (!selectedCategory) return;
        
        try {
            const res = await clientAPI.delete(`category/${selectedCategory?._id}`);
            setCategories(categories.filter((category) => category._id !== selectedCategory?._id));
            setSelectedCategory(null);
            console.log(res.data);
        } catch (error) {
            errorHandler(error);
        }
    };

    const handleDeleteClick = (category: CategoryResponse) => {
        setSelectedCategory(category);
        onOpen();
    };

    const renderCell = (category: CategoryColumns, columnKey: keyof CategoryColumns) => {
        const cellValue = category[columnKey];
        
        switch (columnKey) {
            case "name":
                return <div className="flex flex-col"><p className="text-bold text-sm capitalize">{cellValue}</p></div>;
            case "color":
                return (
                    <div className='flex gap-x-3 items-center'>
                        <div className='w-[20px] h-[20px] rounded-full' style={{ backgroundColor: cellValue }}></div>
                        <Chip className="capitalize" size="sm" variant="flat">{cellValue}</Chip>
                    </div>
                );
            case "action":
                return (
                    <div className="relative flex items-center gap-2">
                        <span className="text-lg text-default-400 cursor-pointer active:opacity-50"><FeEdit /></span>
                        <span className="text-lg text-danger cursor-pointer active:opacity-50" onClick={() => handleDeleteClick(category as CategoryResponse)}>
                            <MdiBin />
                        </span>
                    </div>
                );
            default:
                return cellValue;
        }
    };

    useEffect(() => {
        const getCategory = async () => {
            const res = await clientAPI.get(`user/category/${user?._id}`);
            setCategories(res.data.data);
            console.log(res.data);
        };
        getCategory();
    }, [trigger]);

    return (
        <div className='pl-24'>
            <Table aria-label="Controlled table example with dynamic content">
                <TableHeader columns={CATEGORY_COLUMNS}>
                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody emptyContent={" No category "} items={categories}>
                    {(item) => (
                        <TableRow key={item._id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey as keyof CategoryColumns)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ConfirmModal
                    onAction={onDeleteCategory}
                    header='Delete Category' 
                    subHeader='Are you sure you want to delete this category?' 
                    content="Once deleted, this action cannot be undone."
                />
            </Modal>
        </div>
    );
};

export default CategoryList;
