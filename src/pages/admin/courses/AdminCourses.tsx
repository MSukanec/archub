import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { BookOpen, Plus, Users, BarChart3, Tag } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import AdminCourseDashboard from './AdminCourseDashboard'
import AdminCourseUsersTab from './AdminCourseUsersTab'
import AdminCourseListTab from './AdminCourseListTab'
import AdminCourseCouponTab from './AdminCourseCouponTab'

export default function AdminCourses() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { setSidebarLevel, sidebarLevel } = useNavigationStore()
  const { openModal } = useGlobalModalStore()

  useEffect(() => {
    // Only set to 'admin' if not in 'general' mode (respects user's hub selection)
    if (sidebarLevel !== 'general') {
      setSidebarLevel('admin')
    }
  }, [setSidebarLevel, sidebarLevel])

  const handleCreateEnrollment = () => {
    openModal('course-enrollment', {});
  };

  const handleCreateCourse = () => {
    openModal('course', {});
  };

  const handleCreateCoupon = () => {
    openModal('coupon', {});
  };

  const headerProps = {
    title: "Administración de Cursos",
    icon: BookOpen,
    tabs: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        isActive: activeTab === 'dashboard'
      },
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
      {
        id: 'coupons',
        label: 'Cupones',
        isActive: activeTab === 'coupons'
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
      activeTab === 'coupons' && (
        <Button
          key="create-coupon"
          onClick={handleCreateCoupon}
          className="h-8 px-3 text-xs"
          data-testid="button-create-coupon"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Cupón
        </Button>
      ),
    ].filter(Boolean)
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {activeTab === 'dashboard' && <AdminCourseDashboard />}
        {activeTab === 'users' && <AdminCourseUsersTab />}
        {activeTab === 'courses' && <AdminCourseListTab />}
        {activeTab === 'coupons' && <AdminCourseCouponTab />}
      </div>
    </Layout>
  )
}
