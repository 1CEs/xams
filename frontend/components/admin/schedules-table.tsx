'use client'

import { useEffect, useState } from 'react'
import { clientAPI } from '@/config/axios.config'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Chip,
  Spinner,
  Card,
  CardBody
} from '@nextui-org/react'
import { toast } from 'react-toastify'
import { MdiBin, FeEdit, SolarRefreshLineDuotone } from '@/components/icons/icons'

interface Schedule {
  _id: string
  schedule_name: string
  exam_id: string
  exam_code: string
  instructor_id: string
  questions: Array<{
    _id: string
    question: string
    type: string
    score: number
  }>
  settings?: {
    time_limit?: number
    start_time?: string
    end_time?: string
  }
  created_at?: string
  updated_at?: string
}

export function SchedulesTable() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await clientAPI.get('/exam-schedule')
      setSchedules(response.data.data || [])
    } catch (error) {
      console.error('Error fetching schedules:', error)
      toast.error('Failed to fetch schedules')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      await clientAPI.delete(`/exam-schedule/${scheduleId}`)
      toast.success('Schedule deleted successfully')
      fetchSchedules() // Refresh the list
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Failed to delete schedule')
    }
  }

  const getQuestionCount = (schedule: Schedule) => {
    return schedule.questions?.length || 0
  }

  const formatTimeLimit = (timeLimit?: number) => {
    if (!timeLimit) return 'No limit'
    const hours = Math.floor(timeLimit / 60)
    const minutes = timeLimit % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Spinner size="lg" color="primary" label="Loading schedules..." />
      </div>
    )
  }

  return (
    <Card className="border-none shadow-lg">
      <CardBody className="p-0">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-divider">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg hero-background">
              <span className="text-lg">📅</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Schedules Management</h3>
              <p className="text-sm text-default-500">{schedules.length} total schedules</p>
            </div>
          </div>
          <Button 
            onClick={fetchSchedules} 
            variant="flat" 
            color="primary"
            size="sm"
            startContent={<SolarRefreshLineDuotone className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>

        <Table 
          aria-label="Schedules table"
          classNames={{
            wrapper: "shadow-none",
            th: "bg-default-50 text-default-700 font-semibold",
            td: "py-4"
          }}
        >
          <TableHeader>
            <TableColumn>SCHEDULE</TableColumn>
            <TableColumn>EXAM CODE</TableColumn>
            <TableColumn>QUESTIONS</TableColumn>
            <TableColumn>TIME LIMIT</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>CREATED</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No schedules found">
            {schedules.map((schedule) => (
              <TableRow key={schedule._id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-foreground">{schedule.schedule_name}</p>
                    <p className="text-xs text-default-500">ID: {schedule._id.slice(-6)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip 
                    color="primary" 
                    variant="flat"
                    size="sm"
                    className="font-mono"
                  >
                    {schedule.exam_code}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip 
                    color="success" 
                    variant="flat"
                    size="sm"
                    startContent={<span className="text-xs">📝</span>}
                  >
                    {getQuestionCount(schedule)} questions
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip 
                    color="warning" 
                    variant="flat"
                    size="sm"
                    startContent={<span className="text-xs">⏱️</span>}
                  >
                    {formatTimeLimit(schedule.settings?.time_limit)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip 
                    color="secondary" 
                    variant="flat"
                    size="sm"
                  >
                    Active
                  </Chip>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-default-600">
                    {schedule.created_at 
                      ? new Date(schedule.created_at).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="light" 
                      size="sm"
                      isIconOnly
                      color="primary"
                    >
                      <FeEdit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm"
                      isIconOnly
                      color="danger"
                      onClick={() => handleDeleteSchedule(schedule._id)}
                    >
                      <MdiBin className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  )
}
