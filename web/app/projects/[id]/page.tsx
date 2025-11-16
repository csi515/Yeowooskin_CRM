import { notFound } from 'next/navigation'
import PageHeader from '@/app/components/PageHeader'
import ProjectDetail from '@/app/components/projects/ProjectDetail'
import { getProjectById } from '@/app/lib/mock/projects'

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = getProjectById(params.id)
  if (!project) return notFound()
  return (
    <main className="space-y-6">
      <PageHeader title="프로젝트 상세" />
      <ProjectDetail project={project} />
    </main>
  )
}


