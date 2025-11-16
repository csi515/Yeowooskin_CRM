import ProjectList from '@/app/components/projects/ProjectList'
import { listProjects } from '@/app/lib/mock/projects'
import PageHeader from '@/app/components/PageHeader'

export default function ProjectsPage() {
  const projects = listProjects()
  return (
    <main className="space-y-6">
      <PageHeader title="프로젝트" />
      <ProjectList projects={projects} />
    </main>
  )
}


