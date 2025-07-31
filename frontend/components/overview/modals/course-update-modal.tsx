import { clientAPI } from '@/config/axios.config'
import { useTrigger } from '@/stores/trigger.store'
import { errorHandler } from '@/utils/error'
import { ModalContent, ModalHeader, ModalBody, Textarea, ModalFooter, Button, Input, useDisclosure, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, Select, SelectItem } from '@nextui-org/react'
import Image from 'next/image'
import React, { FormEvent, SetStateAction, useState } from 'react'
import { toast } from 'react-toastify'
import { COURSE_CATEGORIES, COURSE_CATEGORY_LABELS, CourseCategory } from '@/constants/course.constants'

type ImageChooserDrawerProps = {
    setBackground: React.Dispatch<SetStateAction<string>>
    background: string
}

const ImageChooserDrawer: React.FC<ImageChooserDrawerProps> = ({ background, setBackground }) => {
    const backgroundImage = [
        "https://wallpapers.com/images/featured/math-background-jbcyizvw0ckuvcro.jpg",
        "https://slidechef.net/wp-content/uploads/2023/10/Math-Background.jpg",
        "https://wallpapers.com/images/featured/digital-art-background-98hwar6swibxmlqv.jpg",
        "https://pro2-bar-s3-cdn-cf5.myportfolio.com/6eeae5a2e91d6f4cf1067e6935759146/69e4cc7c-29a2-472c-b35f-a899ac5ef803_rw_1920.jpg?h=c742ebc7dea9104a66476894ad713745",
        "https://wallpapers.com/images/hd/aesthetic-anime-background-fknkbl1tb186omiu.jpg",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTIL-DvJA4nutHBR212jjWQEWk5_LjPO_K3Q&s",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOgdrstKZWiRi1kEWOTIc8bPp1nAaSK8YuYQ&s",
        "https://cdn.builtin.com/cdn-cgi/image/f=auto,fit=cover,w=1200,h=635,q=80/https://builtin.com/sites/www.builtin.com/files/2024-09/programming-languages.jpg",
        "https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L3Y5NDQtYmItMTYtam9iNTk4LmpwZw.jpg",
        "https://static.vecteezy.com/system/resources/previews/001/427/153/non_2x/modern-liquid-blue-background-free-vector.jpg",
    ]

    return (
        <DrawerContent>
            {(onClose) => (
                <>
                    <DrawerHeader className="flex flex-col gap-1">Background Images</DrawerHeader>
                    <DrawerBody>
                        <ul className='flex flex-col gap-y-3'>
                            {
                                backgroundImage.map((srcImage: string, idx: number) => (
                                    <li
                                        onClick={() => setBackground(srcImage)}
                                        className={`p-3 cursor-pointer w-full h-fit rounded-lg ${srcImage == background && 'border border-secondary'}`}
                                        key={idx}
                                    >
                                        <Image unoptimized className='object-cover w-full h-auto rounded-md' width={300} height={90} src={srcImage} alt='background image' />
                                    </li>
                                ))
                            }
                        </ul>
                    </DrawerBody>
                    <DrawerFooter>
                        <Button color="danger" variant="light" onPress={onClose}>
                            Close
                        </Button>
                        <Button color="success" onPress={onClose}>
                            Success
                        </Button>
                    </DrawerFooter>
                </>
            )}
        </DrawerContent>
    )
}

type Props = {
    courseId: string
    initialData: {
        course_name: string
        description: string
        background_src: string
        category: string
    }
}

const CourseUpdateModal = ({ courseId, initialData }: Props) => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [backgroundSelector, setBackgroundSelector] = useState<string>(initialData.background_src)
    const { trigger, setTrigger } = useTrigger()
    const [courseForm, setCourseForm] = useState<{
        course_name: string;
        description: string;
        category: string;
    }>({
        course_name: initialData.course_name,
        description: initialData.description,
        category: initialData.category,
    });

    const onUpdateCourse = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            const res = await clientAPI.patch(`/course/${courseId}`, {
                ...courseForm,
                background_src: backgroundSelector
            })
            toast.success('Course updated successfully')
            setTrigger(!trigger)
        } catch (error) {
            console.log(error)
            errorHandler(error)
        }
    }

    return (
        <ModalContent>
            {
                (onClose) => (
                    <form onSubmit={onUpdateCourse}>
                        <ModalHeader><h1>Update Course</h1></ModalHeader>
                        <ModalBody>
                            <div className='flex justify-center'>
                                <Image unoptimized src={backgroundSelector} className='w-2/3 rounded-lg' width={300} height={120} alt='image background' />
                            </div>

                            <Button onPress={onOpen}>Choose Background</Button>
                            <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
                                <ImageChooserDrawer background={backgroundSelector} setBackground={setBackgroundSelector} />
                            </Drawer>
                            <Input 
                                value={courseForm.course_name}
                                onValueChange={(course_name: string) => setCourseForm(prev => ({ ...prev, course_name }))} 
                                label='Course Name' 
                                isRequired 
                            />
                            <Textarea 
                                value={courseForm.description}
                                onValueChange={(description: string) => setCourseForm(prev => ({ ...prev, description }))} 
                                name='description' 
                                label='Description' 
                            />
                            <Select
                                label="Course Category"
                                placeholder="Select a category"
                                selectedKeys={[courseForm.category]}
                                onSelectionChange={(keys) => {
                                    const selectedCategory = Array.from(keys)[0] as string;
                                    setCourseForm(prev => ({ ...prev, category: selectedCategory }));
                                }}
                                isRequired
                            >
                                {COURSE_CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {COURSE_CATEGORY_LABELS[category]}
                                    </SelectItem>
                                ))}
                            </Select>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Close
                            </Button>
                            <Button type='submit' color="success" onPress={onClose}>
                                Update
                            </Button>
                        </ModalFooter>
                    </form>
                )
            }
        </ModalContent>
    )
}

export default CourseUpdateModal 