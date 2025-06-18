import { useQuery } from '@tanstack/react-query'
import { Building, Calendar, Shield, Activity } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

interface Organization {
  id: string
  name: string
  created_at: string
  is_active: boolean
  is_system: boolean
  description?: string
}

interface OrganizationMember {
  id: string
  user_id: string
  organization_id: string
  role: string
  joined_at: string
}

export default function Organizations() {
  const { user } = useAuthStore()

  const { data: organizations, isLoading: organizationsLoading, error: organizationsError } = useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return []
      
      // First get user's organization memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('organization_members')
        .select('organization_id, role_id, joined_at')
        .eq('user_id', user.id)

      if (membershipsError) throw membershipsError

      if (!memberships || memberships.length === 0) return []

      // Get organization details
      const orgIds = memberships.map(m => m.organization_id)
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds)

      if (orgsError) throw orgsError

      // Combine organization data with membership info
      return orgs?.map(org => ({
        ...org,
        userRole: memberships.find(m => m.organization_id === org.id)?.role_id || 'member',
        joinedAt: memberships.find(m => m.organization_id === org.id)?.joined_at
      })) || []
    },
    enabled: !!user && !!supabase,
  })

  const { data: membershipStats, isLoading: statsLoading } = useQuery({
    queryKey: ['organization-stats', user?.id],
    queryFn: async () => {
      if (!supabase || !user || !organizations?.length) return null
      
      const orgId = organizations[0]?.id
      if (!orgId) return null

      const { data: members, error } = await supabase
        .from('organization_members')
        .select('id, role_id')
        .eq('organization_id', orgId)

      if (error) throw error

      return {
        totalMembers: members?.length || 0,
        adminCount: members?.filter(m => m.role_id === 'admin').length || 0,
        memberCount: members?.filter(m => m.role_id === 'member').length || 0
      }
    },
    enabled: !!user && !!supabase && !!organizations?.length,
  })

  if (organizationsLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader
          icon={Building}
          title="Organization"
          description="Manage your organization settings and members"
        />
        <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (organizationsError) {
    return (
      <div className="flex flex-col">
        <PageHeader
          icon={Building}
          title="Organization"
          description="Manage your organization settings and members"
        />
        <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400 mb-2">Error loading organization data</p>
                  <p className="text-sm text-muted-foreground">
                    {organizationsError.message || 'Unable to connect to database'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const currentOrg = organizations?.[0]

  if (!currentOrg) {
    return (
      <div className="flex flex-col">
        <PageHeader
          icon={Building}
          title="Organization"
          description="Manage your organization settings and members"
        />
        <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No organization found</p>
                  <p className="text-sm text-muted-foreground">
                    You are not a member of any organization yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={Building}
        title="Organization"
        description="Manage your organization settings and members"
      />
      
      <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Organization Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Organization Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <p className="text-lg font-medium">{currentOrg.name}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Your Role</Label>
                  <Badge variant={currentOrg.userRole === 'admin' ? 'default' : 'secondary'}>
                    {currentOrg.userRole}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentOrg.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Status</span>
                  </Label>
                  <Badge variant={currentOrg.is_active ? 'default' : 'destructive'}>
                    {currentOrg.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              {currentOrg.description && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <p className="text-muted-foreground">{currentOrg.description}</p>
                </div>
              )}
              
              <div className="flex items-center space-x-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {currentOrg.is_system ? 'System Organization' : 'User Organization'}
                  </span>
                </div>
                
                {currentOrg.joinedAt && (
                  <div className="text-sm text-muted-foreground">
                    Joined {new Date(currentOrg.joinedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Membership Statistics */}
          {membershipStats && (
            <Card>
              <CardHeader>
                <CardTitle>Membership Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{membershipStats.totalMembers}</div>
                    <div className="text-sm text-muted-foreground">Total Members</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{membershipStats.adminCount}</div>
                    <div className="text-sm text-muted-foreground">Administrators</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{membershipStats.memberCount}</div>
                    <div className="text-sm text-muted-foreground">Members</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}