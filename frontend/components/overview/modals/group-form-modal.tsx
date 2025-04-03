import { clientAPI } from '@/config/axios.config'
import { useTrigger } from '@/stores/trigger.store'
import { errorHandler } from '@/utils/error'
import { ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Switch, Chip } from '@nextui-org/react'
import React, { FormEvent, useState } from 'react'
import { toast } from 'react-toastify'

type Props = {
  courseId: string
}

const GroupFormModal = ({ courseId }: Props) => {
  const { trigger, setTrigger } = useTrigger()
  const [groupForm, setGroupForm] = useState<{
    group_name: string
    join_code: string
  }>({
    group_name: "",
    join_code: "",
  })
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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
  React.useEffect(() => {
    if (isGeneratingCode) {
      setGroupForm(prev => ({ ...prev, join_code: generateJoinCode() }))
    }
  }, [isGeneratingCode])

  const onCreateGroup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    try {
      // If auto-generating code is enabled, generate a new one before submission
      const finalForm = isGeneratingCode 
        ? { ...groupForm, join_code: generateJoinCode() } 
        : groupForm

      const res = await clientAPI.post(`/course/${courseId}/group`, finalForm)
      console.log(res)
      toast.success('Group created successfully')
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
    }
  }

  return (
    <ModalContent>
      {(onClose) => (
        <form onSubmit={onCreateGroup}>
          <ModalHeader><h1>New Group</h1></ModalHeader>
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
              isRequired 
            />
            
            <p className="text-sm text-foreground-400">
              Students will use this code to join the group
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="success" onPress={onClose}>
              Create
            </Button>
          </ModalFooter>
        </form>
      )}
    </ModalContent>
  )
}

export default GroupFormModal
