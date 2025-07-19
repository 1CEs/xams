'use client'

import { useEffect, useState } from 'react'
import { clientAPI } from '@/config/axios.config'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'react-toastify'
import { MdiBin, FeEdit, FaGroup, PhStudentFill } from '@/components/icons/icons'

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
      const response = await clientAPI.get('/exam')
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

  const formatTimeLimit = (timeLimit?: number) => {
    if (!timeLimit) return 'No limit'
    const hours = Math.floor(timeLimit / 60)
    const minutes = timeLimit % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getCategoryBadges = (categories?: string[]) => {
    if (!categories || categories.length === 0) return null
    return categories.slice(0, 2).map((category, index) => (
      <Badge key={index} variant="outline" className="text-xs">
        {category}
      </Badge>
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Examinations ({examinations.length})</h3>
        <Button onClick={fetchExaminations} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Time Limit</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {examinations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No examinations found
                </TableCell>
              </TableRow>
            ) : (
              examinations.map((exam) => (
                <TableRow key={exam._id}>
                  <TableCell className="font-medium">
                    {exam.exam_name}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {exam.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <span className="text-xs">📝</span>
                      {getQuestionCount(exam)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-xs text-gray-600">⏱️</span>
                      {formatTimeLimit(exam.time_limit)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getCategoryBadges(exam.category)}
                      {exam.category && exam.category.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{exam.category.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {exam.created_at 
                      ? new Date(exam.created_at).toLocaleDateString()
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <FeEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteExamination(exam._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MdiBin className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
