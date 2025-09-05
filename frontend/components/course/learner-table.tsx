import React, { SVGProps, useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Tooltip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure
} from "@nextui-org/react";
import { clientAPI } from "@/config/axios.config";
import { errorHandler } from "@/utils/error";
import { toast } from "react-toastify";

type Column = {
  name: string;
  uid: string;
};

type StudentData = {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: {
    is_banned: boolean;
    ban_until?: string;
    ban_reason?: string;
  };
  profile_url?: string;
  info: {
    first_name: string;
    last_name: string;
  };
};

export const columns: Column[] = [
  { name: "NAME", uid: "name" },
  { name: "EMAIL", uid: "email" },
  { name: "ROLE", uid: "role" },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];

export const EyeIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 20 20"
      width="1em"
      {...props}
    >
      <path
        d="M12.9833 10C12.9833 11.65 11.65 12.9833 10 12.9833C8.35 12.9833 7.01666 11.65 7.01666 10C7.01666 8.35 8.35 7.01666 10 7.01666C11.65 7.01666 12.9833 8.35 12.9833 10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M9.99999 16.8916C12.9417 16.8916 15.6833 15.1583 17.5917 12.1583C18.3417 10.9833 18.3417 9.00831 17.5917 7.83331C15.6833 4.83331 12.9417 3.09998 9.99999 3.09998C7.05833 3.09998 4.31666 4.83331 2.40833 7.83331C1.65833 9.00831 1.65833 10.9833 2.40833 12.1583C4.31666 15.1583 7.05833 16.8916 9.99999 16.8916Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
};

export const DeleteIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 20 20"
      width="1em"
      {...props}
    >
      <path
        d="M17.5 4.98332C14.725 4.70832 11.9333 4.56665 9.15 4.56665C7.5 4.56665 5.85 4.64998 4.2 4.81665L2.5 4.98332"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M7.08331 4.14169L7.26665 3.05002C7.39998 2.25835 7.49998 1.66669 8.90831 1.66669H11.0916C12.5 1.66669 12.6083 2.29169 12.7333 3.05835L12.9166 4.14169"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M15.7084 7.61664L15.1667 16.0083C15.075 17.3166 15 18.3333 12.675 18.3333H7.32502C5.00002 18.3333 4.92502 17.3166 4.83335 16.0083L4.29169 7.61664"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M8.60834 13.75H11.3833"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M7.91669 10.4167H12.0834"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
};

export const EditIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 20 20"
      width="1em"
      {...props}
    >
      <path
        d="M11.05 3.00002L4.20835 10.2417C3.95002 10.5167 3.70002 11.0584 3.65002 11.4334L3.34169 14.1334C3.23335 15.1084 3.93335 15.775 4.90002 15.6084L7.58335 15.15C7.95835 15.0834 8.48335 14.8084 8.74168 14.525L15.5834 7.28335C16.7667 6.03335 17.3 4.60835 15.4583 2.86668C13.625 1.14168 12.2334 1.75002 11.05 3.00002Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
        strokeWidth={1.5}
      />
      <path
        d="M9.90833 4.20831C10.2667 6.50831 12.1333 8.26665 14.45 8.49998"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
        strokeWidth={1.5}
      />
      <path
        d="M2.5 18.3333H17.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
        strokeWidth={1.5}
      />
    </svg>
  );
};

const statusColorMap = {
  active: "success",
  banned: "danger",
  suspended: "warning"
};

type LearnersTableProps = {
  studentIds: string[];
  courseId: string;
  groupName: string;
  onStudentRemoved?: () => void;
};

export const LearnersTable = ({ studentIds, courseId, groupName, onStudentRemoved }: LearnersTableProps) => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<StudentData | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    const fetchStudents = async () => {
      if (!studentIds || studentIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch student data for each student ID
        const promises = studentIds.map(id => clientAPI.get(`/user/${id}`));
        const responses = await Promise.all(promises);
        
        // Extract student data from responses
        const fetchedStudents = responses.map(response => {
          const userData = response.data.data;
          return {
            _id: userData._id,
            username: userData.username || 'Unknown',
            email: userData.email || 'No email',
            role: userData.role || 'student',
            status: userData.status || { is_banned: false },
            profile_url: userData.profile_url || `https://i.pravatar.cc/150?u=${userData._id}`,
            info: userData.info || { first_name: 'Unknown', last_name: 'User' }
          };
        });
        
        setStudents(fetchedStudents as any);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load student data');
        errorHandler(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [studentIds]);

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;

    try {
      setIsRemoving(true);
      const response = await clientAPI.delete(
        `/enrollment/${courseId}/group/${encodeURIComponent(groupName)}/student/${studentToRemove._id}`
      );
      
      if (response.status === 200) {
        toast.success(`${studentToRemove.username} has been removed from the group`);
        // Remove student from local state
        setStudents(prev => prev.filter(student => student._id !== studentToRemove._id));
        // Call parent callback to refresh data
        onStudentRemoved?.();
      }
    } catch (err: any) {
      console.error('Error removing student:', err);
      const errorMessage = err.response?.data?.message || 'Failed to remove student from group';
      toast.error(errorMessage);
      errorHandler(err);
    } finally {
      setIsRemoving(false);
      setStudentToRemove(null);
      onOpenChange();
    }
  };

  const openRemoveConfirmation = (student: StudentData) => {
    setStudentToRemove(student);
    onOpen();
  };

  const renderCell = React.useCallback((student: StudentData, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{ radius: "lg", src: student.profile_url }}
            description={student.email}
            name={`${student.info.first_name} ${student.info.last_name}`}
          >
            {student.email}
          </User>
        );
      case "email":
        return (
          <div className="flex flex-col">
            <p className="text-sm">{student.email}</p>
          </div>
        );
      case "role":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{student.role}</p>
          </div>
        );
      case "status":
        const getStatusInfo = () => {
          if (student.status?.is_banned) {
            return {
              label: student.status.ban_until ? 'Suspended' : 'Banned',
              color: student.status.ban_until ? 'warning' : 'danger',
              description: student.status.ban_reason || 'No reason provided'
            };
          }
          return {
            label: 'Active',
            color: 'success',
            description: 'Student is active'
          };
        };
        
        const statusInfo = getStatusInfo();
        
        return (
          <div className="flex flex-col gap-1">
            <Chip 
              className="capitalize" 
              color={statusInfo.color as any}
              size="sm" 
              variant="flat"
            >
              {statusInfo.label}
            </Chip>
            {student.status?.is_banned && student.status.ban_until && (
              <p className="text-xs text-warning-600">
                Until: {new Date(student.status.ban_until).toLocaleDateString()}
              </p>
            )}
            {student.status?.is_banned && student.status.ban_reason && (
              <Tooltip content={student.status.ban_reason}>
                <p className="text-xs text-danger-500 truncate max-w-32 cursor-help">
                  Reason: {student.status.ban_reason}
                </p>
              </Tooltip>
            )}
          </div>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip color="danger" content="Remove from Group">
              <span 
                className="text-lg text-danger cursor-pointer active:opacity-50 hover:text-danger-600 transition-colors"
                onClick={() => openRemoveConfirmation(student)}
              >
                <DeleteIcon />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Spinner color="secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-danger p-4 text-center">
        {error}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center">
        No student data available
      </div>
    );
  }

  return (
    <>
      <Table removeWrapper aria-label="Students table with custom cells">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={students}>
          {(item) => (
            <TableRow key={item._id}>
              {(columnKey: any) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Remove Student Confirmation Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-danger">Remove Student</h3>
              </ModalHeader>
              <ModalBody>
                <p className="text-default-600">
                  Are you sure you want to remove{" "}
                  <span className="font-semibold text-primary">
                    {studentToRemove?.username}
                  </span>{" "}
                  from the group{" "}
                  <span className="font-semibold text-secondary">
                    {groupName}
                  </span>?
                </p>
                <p className="text-sm text-warning mt-2">
                  This action will remove the student from this group and they will lose access to all group resources and exams.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="default" 
                  variant="light" 
                  onPress={onClose}
                  disabled={isRemoving}
                >
                  Cancel
                </Button>
                <Button 
                  color="danger" 
                  onPress={handleRemoveStudent}
                  isLoading={isRemoving}
                  disabled={isRemoving}
                >
                  {isRemoving ? "Removing..." : "Remove Student"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
