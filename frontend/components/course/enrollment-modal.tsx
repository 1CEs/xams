"use client";

import { clientAPI } from "@/config/axios.config";
import { useUserStore } from "@/stores/user.store";
import { errorHandler } from "@/utils/error";
import { 
  Button, 
  Input, 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalFooter, 
  ModalHeader, 
  Select, 
  SelectItem 
} from "@nextui-org/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useTrigger } from "@/stores/trigger.store";

type EnrollmentModalProps = {
  isOpen: boolean;
  onOpenChange: () => void;
  courseId: string;
  groups: IGroup[];
  courseName: string;
};

const EnrollmentModal = ({ 
  isOpen, 
  onOpenChange, 
  courseId, 
  groups,
  courseName
}: EnrollmentModalProps) => {
  const { user } = useUserStore();
  const { trigger, setTrigger } = useTrigger();
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleEnroll = async () => {
    if (!user?._id) {
      toast.error("You must be logged in to enroll in a course");
      return;
    }

    if (!selectedGroup) {
      setError("Please select a group");
      return;
    }

    // Find the selected group
    const group = groups.find(g => g.group_name === selectedGroup);
    
    if (!group) {
      setError("Invalid group selected");
      return;
    }

    // Verify join code only if the group has one
    if (group.join_code && group.join_code !== joinCode) {
      setError("Invalid join code");
      return;
    }

    // If group has join code but user didn't provide one
    if (group.join_code && !joinCode) {
      setError("Please enter the join code");
      return;
    }

    setLoading(true);
    try {
      const response = await clientAPI.post(
        `enrollment/${courseId}/group/${selectedGroup}/student/${user._id}`
      );
      toast.success(response.data.message);
      setTrigger(!trigger); // Trigger a refresh
      onOpenChange(); // Close the modal
    } catch (error) {
      errorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Enroll in {courseName}
            </ModalHeader>
            <ModalBody>
              <p className="text-sm text-default-500 mb-4">
                To enroll in this course, please select a group{selectedGroup && groups.find(g => g.group_name === selectedGroup)?.join_code ? " and enter the join code provided by your instructor" : ""}.
              </p>
              
              {error && (
                <div className="text-danger text-sm mb-2">{error}</div>
              )}
              
              <Select
                label="Select Group"
                placeholder="Choose a group"
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setError("");
                }}
              >
                {groups.map((group) => (
                  <SelectItem key={group.group_name} value={group.group_name}>
                    {group.group_name}
                  </SelectItem>
                ))}
              </Select>
              
              {selectedGroup && groups.find(g => g.group_name === selectedGroup)?.join_code && (
                <Input
                  label="Join Code"
                  placeholder="Enter the join code"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value);
                    setError("");
                  }}
                />
              )}
              
              {selectedGroup && !groups.find(g => g.group_name === selectedGroup)?.join_code && (
                <div className="text-sm text-success bg-success-50 p-3 rounded-lg">
                  ✓ This group has open access - no join code required!
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="secondary" onPress={handleEnroll} isLoading={loading}>
                Enroll
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default EnrollmentModal;
