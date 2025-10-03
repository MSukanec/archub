import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { BookOpen, Plus, Users } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import AdminCourseUsersTab from './tabs/AdminCourseUsersTab'
import AdminCourseListTab from './tabs/AdminCourseListTab'

export default function AdminCourses() {
  const [activeTab, setActiveTab] = useState('users')
  const { setSidebarLevel } = useNavigationStore()
  const { openModal } = useGlobalModalStore()

  useEffect(() => {
    setSidebarLevel('admin')
  }, [setSidebarLevel])

  const handleCreateEnrollment = () => {
    openModal('course-enrollment', {});
  };

  const handleCreateCourse = () => {
    openModal('course', {});
  };

  const headerProps = {
    title: "Administración de Cursos",
    icon: BookOpen,
    tabs: [
      {
        id: 'users',
        label: 'Alumnos',
        isActive: activeTab === 'users'
      },
      {
        id: 'courses',
        label: 'Cursos',
        isActive: activeTab === 'courses'
      },
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actions: [
      activeTab === 'users' && (
        <Button
          key="create-enrollment"
          onClick={handleCreateEnrollment}
          className="h-8 px-3 text-xs"
          data-testid="button-create-enrollment"
        >
          <Plus className="w-4 h-4 mr-1" />
          Inscribir Alumno
        </Button>
      ),
      activeTab === 'courses' && (
        <Button
          key="create-course"
          onClick={handleCreateCourse}
          className="h-8 px-3 text-xs"
          data-testid="button-create-course"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Curso
        </Button>
      ),
    ].filter(Boolean)
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {activeTab === 'users' && <AdminCourseUsersTab />}
        {activeTab === 'courses' && <AdminCourseListTab />}
      </div>
    </Layout>
  )
}
