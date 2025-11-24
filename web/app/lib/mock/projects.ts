export type Project = {
  id: string
  title: string
  content: string
  updatedAt: string
}

let projects: Project[] = [
  { id: 'p1', title: '봄 시즌 캠페인', content: 'SNS 콘텐츠 기획 및 배포 일정 수립', updatedAt: new Date().toISOString() },
  { id: 'p2', title: '신규 고객 온보딩', content: '웰컴 키트 제작과 DM 자동화', updatedAt: new Date().toISOString() },
  { id: 'p3', title: '패키지 상품 리뉴얼', content: '구성/가격 검토 및 랜딩 페이지 개편', updatedAt: new Date().toISOString() },
]

export function listProjects(): Project[] {
  return projects.slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}

export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id)
}

export function updateProject(id: string, patch: Partial<Pick<Project, 'title' | 'content'>>): Project | undefined {
  const idx = projects.findIndex(p => p.id === id)
  if (idx === -1) return undefined
  const current = projects[idx]!
  const next: Project = {
    id: current.id,
    title: patch.title ?? current.title,
    content: patch.content ?? current.content,
    updatedAt: new Date().toISOString()
  }
  projects[idx] = next
  return next
}

export function deleteProject(id: string): boolean {
  const before = projects.length
  projects = projects.filter(p => p.id !== id)
  return projects.length < before
}


