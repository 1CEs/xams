import { ModalContent, ModalHeader, ModalBody, Textarea, ModalFooter, Button, Input } from '@nextui-org/react'
import React, { FormEvent } from 'react'

type Props = {}

const CourseFormModal = (props: Props) => {

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