import { clientAPI } from '@/config/axios.config'
import { useTrigger } from '@/stores/trigger.store'
import { useUserStore } from '@/stores/user.store'
import { errorHandler } from '@/utils/error'
import { Button, Input, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Textarea } from '@nextui-org/react'
import React, { FormEvent, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

type Props = {}

const BankFormModal = (props: Props) => {
  const { trigger, setTrigger } = useTrigger()
  const [exams, setExams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedExams, setSelectedExams] = useState<string[]>([])
  const { user } = useUserStore()

  if (!user) return null

  // Fetch available exams for selection
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true)
        const response = await clientAPI.get(`exam?instructor_id=${user._id}`)
        if (response.data && response.data.data) {
          setExams(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching exams:', error)
        errorHandler(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExams()
  }, [])

  const onCreateBank = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      const bankName = formData.get('bank_name') as string

      // Call the bank API endpoint with the form data
      const res = await clientAPI.post('bank', {
        bank_name: bankName,
        exam_id: selectedExams.length > 0 ? selectedExams : undefined
      })

      console.log(res)
      toast.success('Question bank created successfully')
      setTrigger(!trigger)
    } catch (error) {
      console.error('Error creating bank:', error)
      errorHandler(error)
    }
  }

  return (
    <ModalContent>
      {
        (onClose) => (
          <form onSubmit={onCreateBank}>
            <ModalHeader><h1>New Question Bank</h1></ModalHeader>
            <ModalBody>
              <Input 
                name='bank_name' 
                label='Bank Name' 
                placeholder="Enter bank name"
                isRequired 
              />
              <Select
                label="Select Exams (Optional)"
                placeholder="Choose exams to include"
                selectionMode="multiple"
                isLoading={isLoading}
                onSelectionChange={(keys) => {
                  setSelectedExams(Array.from(keys).map(key => key.toString()))
                }}
              >
                {exams.map((exam) => (
                  <SelectItem key={exam._id} value={exam._id}>
                    {exam.title}
                  </SelectItem>
                ))}
              </Select>
              <div className="text-sm text-gray-500">
                You can add or remove exams later from this bank.
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button type='submit' color="success" onPress={onClose}>
                Create Bank
              </Button>
            </ModalFooter>
          </form>
        )
      }
    </ModalContent>
  )
}

export default BankFormModal
