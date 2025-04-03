"use client";

import { clientAPI } from "@/config/axios.config";
import { useUserStore } from "@/stores/user.store";
import { errorHandler } from "@/utils/error";
import { Button, Modal, useDisclosure } from "@nextui-org/react";
import { useState } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../modals/confirm-modal";
import { useTrigger } from "@/stores/trigger.store";
import EnrollmentModal from "./enrollment-modal";

type EnrollmentActionsProps = {
  courseId: string;
  groupName: string;
  isEnrolled: boolean;
  groups: IGroup[];
  courseName: string;
};

const EnrollmentActions = ({ 
  courseId, 
  groupName, 
  isEnrolled, 
  groups,
  courseName
}: EnrollmentActionsProps) => {
  const { isOpen: isUnenrollOpen, onOpen: onUnenrollOpen, onOpenChange: onUnenrollChange } = useDisclosure();
  const { isOpen: isEnrollOpen, onOpen: onEnrollOpen, onOpenChange: onEnrollChange } = useDisclosure();
  const { user } = useUserStore();
  const { trigger, setTrigger } = useTrigger();
  const [loading, setLoading] = useState(false);

  const handleUnenroll = async () => {
    if (!user?._id) {
      toast.error("You must be logged in to unenroll from a course");
      return;
    }

    setLoading(true);
    try {
      const response = await clientAPI.delete(
        `enrollment/${courseId}/group/${groupName}/student/${user._id}`
      );
      toast.success(response.data.message);
      setTrigger(!trigger); // Trigger a refresh
    } catch (error) {
      errorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${!isEnrolled && "w-full"}`}>
      {isEnrolled ? (
        <Button
          color="danger"
          variant="flat"
          size="sm"
          isLoading={loading}
          onPress={onUnenrollOpen}
        >
          Unenroll
        </Button>
      ) : (
        <Button
          className={`${!isEnrolled && "w-full"}`}
          color="primary"
          variant="flat"
          size="sm"
          onPress={onEnrollOpen}
        >
          Enroll
        </Button>
      )}

      {/* Unenroll confirmation modal */}
      <Modal isOpen={isUnenrollOpen} onOpenChange={onUnenrollChange}>
        <ConfirmModal
          content="Are you sure you want to unenroll from this course? You may lose access to course materials and progress."
          header="Confirm Unenrollment"
          subHeader="This action cannot be undone."
          onAction={handleUnenroll}
        />
      </Modal>

      {/* Enrollment modal with group selection and join code */}
      <EnrollmentModal
        isOpen={isEnrollOpen}
        onOpenChange={onEnrollChange}
        courseId={courseId}
        groups={groups}
        courseName={courseName}
      />
    </div>
  );
};

export default EnrollmentActions;
