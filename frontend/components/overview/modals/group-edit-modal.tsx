import { clientAPI } from '@/config/axios.config'
import { useTrigger } from '@/stores/trigger.store'
import { errorHandler } from '@/utils/error'
import { ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Switch, Chip } from '@nextui-org/react'
import React, { FormEvent, useState, useEffect } from 'react'
import { toast } from 'react-toastify'

type Props = {
  courseId: string
  groupName: string
  initialData: {
    group_name: string
    join_code?: string
  }
}

const GroupEditModal = ({ courseId, groupName, initialData }: Props) => {
  const { trigger, setTrigger } = useTrigger()
  const [groupForm, setGroupForm] = useState<{
    group_name: string
    join_code?: string
  }>({
    group_name: initialData.group_name,
    join_code: initialData.join_code || "",
  })
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Initialize form with existing data
  useEffect(() => {
    setGroupForm({
      group_name: initialData.group_name,
      join_code: initialData.join_code || "",
    })
    // Set generating code to false if there's already a join code
    setIsGeneratingCode(false)
  }, [initialData])

  // Generate a random join code
  const generateJoinCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    const charactersLength = characters.length
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }

  // Update join code when toggling auto-generation
  useEffect(() => {
    if (isGeneratingCode) {
      setGroupForm(prev => ({ ...prev, join_code: generateJoinCode() }))
    }
  }, [isGeneratingCode])

  const onUpdateGroup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    
    try {
      // If auto-generating code is enabled, generate a new one before submission
      const finalForm = isGeneratingCode 
        ? { ...groupForm, join_code: generateJoinCode() } 
        : groupForm

      const res = await clientAPI.patch(`/course/${courseId}/group/${groupName}`, finalForm)
      console.log(res)
      toast.success('Group updated successfully')
      setTrigger(!trigger)
    } catch (err: any) {
      console.log(err)
      
      // Check if it's a duplicate group name error
      if (err.response && err.response.status === 400 && 
          err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        errorHandler(err)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalContent>
      {(onClose) => (
        <form onSubmit={onUpdateGroup}>
          <ModalHeader><h1>Edit Group</h1></ModalHeader>
          <ModalBody>
            {error && (
              <Chip color="danger" variant="flat" className="mb-2">
                {error}
              </Chip>
            )}
            
            <Input 
              label="Group Name" 
              placeholder="Enter group name"
              value={groupForm.group_name}
              onValueChange={(group_name: string) => {
                setError(null)
                setGroupForm(prev => ({ ...prev, group_name }))
              }}
              isInvalid={!!error}
              errorMessage={error ? "Please choose a different name" : ""}
              isRequired 
            />
            
            <div className="flex items-center justify-between">
              <Switch 
                color='secondary'
                isSelected={isGeneratingCode}
                onValueChange={setIsGeneratingCode}
              >
                Auto-generate join code
              </Switch>
            </div>
            
            <Input 
              label="Join Code" 
              placeholder="Enter join code or auto-generate"
              value={groupForm.join_code}
              onValueChange={(join_code: string) => 
                setGroupForm(prev => ({ ...prev, join_code }))}
              isDisabled={isGeneratingCode} 
            />
            
            <p className="text-sm text-foreground-400">
              {groupForm.join_code ? "Learners will use this code to join the group" : "Leave empty for open access (no code required)"}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              color="warning" 
              onPress={onClose}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              Update
            </Button>
          </ModalFooter>
        </form>
      )}
    </ModalContent>
  )
}

export default GroupEditModal
