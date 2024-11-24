"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
type Props = {}

const PreviewExaminationPage = (props: Props) => {
  const params = useSearchParams()
  const _id = params.get('id')
  return (
    <div>{_id}</div>
  )
}

export default PreviewExaminationPage