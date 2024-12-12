import { ModalContent, ModalHeader, ModalBody, Textarea, ModalFooter, Button, Input, useDisclosure } from '@nextui-org/react'
import Image from 'next/image'
import React, { FormEvent } from 'react'

type Props = {}

const ImageChooserDrawer = () => {}

const CourseFormModal = (props: Props) => {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
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

    const onCreateCourse = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log('first')
    }

    return (
        <ModalContent>
            {
                (onClose) => (
                    <form onSubmit={onCreateCourse}>
                        <ModalHeader><h1>New Course</h1></ModalHeader>
                        <ModalBody>
                            <ul className='overflow-x-auto flex gap-x-3'>
                                {
                                    backgroundImage.map((srcImage: string, idx: number) => (
                                        <li className='cursor-pointer w-fit h-fit' key={idx}>
                                            <Image className='object-cover' width={300} height={90} src={srcImage} alt='background image'/>
                                        </li>
                                    ))
                                }
                            </ul>
                            <Button>Choose Image</Button>
                            <Input name='course_name' label='Couse Name' isRequired />
                            <Textarea name='description' label='description' />
                        </ModalBody>
                        <ModalFooter>
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

export default CourseFormModal