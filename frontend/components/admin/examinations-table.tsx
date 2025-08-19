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

interface Examination {
  _id: string
  exam_name: string
  description?: string
  instructor_id: string
  category?: string[]
  questions?: Array<{
    _id: string
    question: string
    type: string
    score: number
  }>
  time_limit?: number
  created_at?: string
  updated_at?: string
}

export function ExaminationsTable() {
  const [examinations, setExaminations] = useState<Examination[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExaminations()
  }, [])

  const fetchExaminations = async () => {
    try {
      setLoading(true)
      const response = await clientAPI.get('/exam/all')
      setExaminations(response.data.data || [])
    } catch (error) {
      console.error('Error fetching examinations:', error)
      toast.error('Failed to fetch examinations')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExamination = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this examination?')) return

    try {
      await clientAPI.delete(`/exam/${examId}`)
      toast.success('Examination deleted successfully')
      fetchExaminations() // Refresh the list
    } catch (error) {
      console.error('Error deleting examination:', error)
      toast.error('Failed to delete examination')
    }
  }

  const getQuestionCount = (exam: Examination) => {
    return exam.questions?.length || 0
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Spinner size="lg" color="primary" label="Loading examinations..." />
      </div>
    )
  }

  return (
    <Card className="border-none shadow-lg">
      <CardBody className="p-0">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-divider">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg hero-background">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Examinations Management</h3>
              <p className="text-sm text-default-500">{examinations.length} total examinations</p>
            </div>
          </div>
          <Button 
            onClick={fetchExaminations} 
            variant="flat" 
            color="primary"
            size="sm"
            startContent={<SolarRefreshLineDuotone className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>

        <Table 
          aria-label="Examinations table"
          classNames={{
            wrapper: "shadow-none",
            th: "bg-default-50 text-default-700 font-semibold",
            td: "py-4"
          }}
        >
          <TableHeader>
            <TableColumn>EXAM</TableColumn>
            <TableColumn>DESCRIPTION</TableColumn>
            <TableColumn>QUESTIONS</TableColumn>
            <TableColumn>CREATED</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No examinations found">
            {examinations.map((exam) => (
              <TableRow key={exam._id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-foreground">{exam.exam_name}</p>
                    <p className="text-xs text-default-500">ID: {exam._id.slice(-6)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-default-600 max-w-[200px] truncate">
                    {exam.description || 'No description available'}
                  </p>
                </TableCell>
                <TableCell>
                  <Chip 
                    color="success" 
                    variant="flat"
                    size="sm"
                    startContent={<span className="text-xs">📝</span>}
                  >
                    {getQuestionCount(exam)} questions
                  </Chip>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-default-600">
                    {exam.created_at 
                      ? new Date(exam.created_at).toLocaleDateString()
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
                      onClick={() => handleDeleteExamination(exam._id)}
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
