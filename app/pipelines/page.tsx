import type { Metadata } from 'next'
import { PipelineBuilder } from '@/features/pipelines/pipeline-builder'

export const metadata: Metadata = {
  title: 'Pipelines - DevForge',
  description: 'Chain multiple tools together to create data transformation pipelines.',
}

export default function PipelinesPage() {
  return <PipelineBuilder />
}
