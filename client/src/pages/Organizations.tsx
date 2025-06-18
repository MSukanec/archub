import { Building, Calendar, Shield, Activity, Crown } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useCurrentUser } from '@/hooks/use-current-user'

export default function Organizations() {
  const { data, isLoading, error } = useCurrentUser()

  if (isLoading) {
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

  if (error) {
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
                    {error.message || 'Unable to connect to database'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!data?.organization) {
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

  const { organization, role, plan } = data

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={Building}
        title="Organization"
        description="Manage your organization settings and members"
      />
      
      <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto space-y-6">
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
                  <p className="text-lg font-medium">{organization.name}</p>
                </div>
                
                {role && (
                  <div className="space-y-2">
                    <Label>Your Role</Label>
                    <Badge variant="default">
                      {role.name}
                    </Badge>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(organization.created_at).toLocaleDateString('en-US', {
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
                  <Badge variant={organization.is_active ? 'default' : 'destructive'}>
                    {organization.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {organization.is_system ? 'System Organization' : 'User Organization'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {plan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="h-5 w-5" />
                  <span>Plan Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Current Plan</Label>
                    <p className="text-lg font-medium">{plan.name}</p>
                  </div>
                  
                  {plan.max_users && (
                    <div className="space-y-2">
                      <Label>Max Users</Label>
                      <p className="text-sm text-muted-foreground">{plan.max_users}</p>
                    </div>
                  )}
                  
                  {plan.price !== undefined && (
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <p className="text-sm text-muted-foreground">
                        ${plan.price}{plan.price > 0 ? '/month' : ' (Free)'}
                      </p>
                    </div>
                  )}
                </div>

                {plan.features && plan.features.length > 0 && (
                  <div className="space-y-2 mt-6">
                    <Label>Plan Features</Label>
                    <div className="flex flex-wrap gap-2">
                      {plan.features.map((feature, index) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}