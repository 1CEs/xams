import { clientAPI } from '@/config/axios.config'
import { errorHandler } from '@/utils/error'
import { Button, Input, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea } from '@nextui-org/react'
import React, { FormEvent } from 'react'
import { toast } from 'react-toastify'

type Props = {}

const ExamFormModal = (props: Props) => {
  const onCreateExam = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      const formEntries = Object.fromEntries(formData.entries())
      const res = await clientAPI.post('exam', {
        title: formEntries.title,
        description: formEntries.description,
      })
      console.log(res)
      toast.success('Create examination successfully')
    } catch (error) {
      console.log(error)
      errorHandler(error)
    }
  }
  return (
    <ModalContent>
      {
        (onClose) => (
          <form onSubmit={onCreateExam}>
            <ModalHeader><h1>New Examination</h1></ModalHeader>
            <ModalBody>
              <Input name='title' label='title' isRequired />
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

export default ExamFormModal