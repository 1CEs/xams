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
    join_code?: string
  }>({
    group_name: "",
    join_code: "",
  })
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Validate group name (English only, no spaces)
  const validateGroupName = (name: string): string | null => {
    if (!name.trim()) {
      return "Group name is required"
    }
    
    // Check for spaces
    if (/\s/.test(name)) {
      return "Group name cannot contain spaces"
    }
    
    // Check for English characters only (letters, numbers, and common symbols like - _ . but no spaces)
    if (!/^[A-Za-z0-9._-]+$/.test(name)) {
      return "Group name can only contain English letters, numbers, dots, dashes, and underscores"
    }
    
    return null
  }

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
    setValidationError(null)
    
    // Validate group name before submission
    const nameValidationError = validateGroupName(groupForm.group_name)
    if (nameValidationError) {
      setValidationError(nameValidationError)
      return
    }
    
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
              placeholder="Enter group name (English letters, numbers, dots, dashes, underscores only)"
              value={groupForm.group_name}
              onValueChange={(group_name: string) => {
                setError(null)
                setValidationError(null)
                setGroupForm(prev => ({ ...prev, group_name }))
                
                // Real-time validation
                const validationErr = validateGroupName(group_name)
                if (validationErr) {
                  setValidationError(validationErr)
                }
              }}
              isInvalid={!!error || !!validationError}
              errorMessage={validationError || (error ? "Please choose a different name" : "")}
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
