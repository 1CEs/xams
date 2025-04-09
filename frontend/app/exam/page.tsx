"use client"

import { useSearchParams } from 'next/navigation'
import React from 'react'

type Props = {}

const ExaminationPage = (props: Props) => {
    const params = useSearchParams()
    const course_id = params.get('course_id')
    const group_id = params.get('group_id')
    const setting_id = params.get('setting_id')
    const code = params.get('code')
    console.log(course_id, group_id, setting_id, code)
  return (
    <div>ExaminationPage</div>
  )
}

export default ExaminationPage