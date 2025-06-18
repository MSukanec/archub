import { Home, Download, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function Dashboard() {
  const statsCards = [
    {
      title: "Active Projects",
      value: "24",
      change: "+12%",
      changeType: "positive" as const,
      icon: "📊",
      color: "blue"
    },
    {
      title: "Total Budget",
      value: "$2.4M",
      change: "+8%",
      changeType: "positive" as const,
      icon: "💰",
      color: "green"
    },
    {
      title: "Team Members",
      value: "156",
      change: "+3",
      changeType: "positive" as const,
      icon: "👥",
      color: "purple"
    },
    {
      title: "Completion Rate",
      value: "87%",
      change: "+5%",
      changeType: "positive" as const,
      icon: "📈",
      color: "orange"
    }
  ]

  const recentProjects = [
    {
      name: "Downtown Office Complex",
      type: "Commercial",
      budget: "$850K",
      completion: "67%",
      status: "in-progress"
    },
    {
      name: "Riverside Apartments",
      type: "Residential",
      budget: "$1.2M",
      completion: "89%",
      status: "in-progress"
    },
    {
      name: "Industrial Warehouse",
      type: "Industrial",
      budget: "$2.1M",
      completion: "34%",
      status: "in-progress"
    }
  ]

  const recentActivity = [
    {
      type: "completion",
      title: "Task completed: Foundation inspection",
      subtitle: "Downtown Office Complex • 2 hours ago",
      icon: "✅"
    },
    {
      type: "addition",
      title: "New team member added",
      subtitle: "Sarah Johnson joined as Senior Architect • 4 hours ago",
      icon: "➕"
    },
    {
      type: "alert",
      title: "Budget alert: Material costs increased",
      subtitle: "Riverside Apartments • 6 hours ago",
      icon: "⚠️"
    },
    {
      type: "schedule",
      title: "Meeting scheduled: Client review",
      subtitle: "Industrial Warehouse • Tomorrow at 2:00 PM",
      icon: "📅"
    }
  ]

  const filters = (
    <div className="flex items-center space-x-4">
      <Select defaultValue="all">
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter projects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="on-hold">On Hold</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="30-days">
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Time period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30-days">Last 30 days</SelectItem>
          <SelectItem value="90-days">Last 90 days</SelectItem>
          <SelectItem value="year">This year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={Home}
        title="Dashboard"
        description="Overview of your construction projects and recent activity"
        filters={filters}
      >
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </PageHeader>

      <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((card, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {card.title}
                      </p>
                      <p className="text-3xl font-bold">
                        {card.value}
                      </p>
                    </div>
                    <div className="text-2xl">
                      {card.icon}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {card.change}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      from last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Projects and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProjects.map((project, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {project.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {project.type} • {project.budget}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          {project.completion} Complete
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="text-lg">
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
