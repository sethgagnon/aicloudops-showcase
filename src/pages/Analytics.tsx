import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { Calendar, Users, Eye, TrendingUp, Clock, Globe, Lightbulb } from 'lucide-react'
import { Navigate } from 'react-router-dom'

interface AnalyticsData {
  overview: {
    totalViews: number
    uniqueSessions: number
    topPages: Array<{ path: string; views: number }>
  }
  sources: {
    referrers: Array<{ domain: string; views: number }>
    utmSources: Array<{ source: string; views: number }>
  }
  bestTimes: Array<{ hour: number; day: number; views: number }>
  dailyViews: Array<{ date: string; views: number }>
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))']

const Analytics = () => {
  const { user } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      setUserRole(data?.role || null)
    }
    
    checkUserRole()
  }, [user])

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || userRole !== 'admin') return

      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        // Overview data (last 30 days)
        const { data: overviewData } = await supabase
          .from('analytics_page_views')
          .select('*')
          .gte('created_at', thirtyDaysAgo.toISOString())

        const totalViews = overviewData?.length || 0
        const uniqueSessions = new Set(overviewData?.map(v => v.session_id)).size

        // Top pages
        const pageViews = overviewData?.reduce((acc, view) => {
          acc[view.path] = (acc[view.path] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        const topPages = Object.entries(pageViews)
          .map(([path, views]) => ({ path, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10)

        // Referrer sources
        const referrerViews = overviewData?.reduce((acc, view) => {
          if (view.referrer_domain && view.referrer_domain !== window.location.hostname) {
            acc[view.referrer_domain] = (acc[view.referrer_domain] || 0) + 1
          }
          return acc
        }, {} as Record<string, number>) || {}

        const referrers = Object.entries(referrerViews)
          .map(([domain, views]) => ({ domain, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10)

        // UTM sources
        const utmViews = overviewData?.reduce((acc, view) => {
          if (view.utm_source) {
            acc[view.utm_source] = (acc[view.utm_source] || 0) + 1
          }
          return acc
        }, {} as Record<string, number>) || {}

        const utmSources = Object.entries(utmViews)
          .map(([source, views]) => ({ source, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10)

        // Best times data (last 90 days)
        const { data: bestTimesData } = await supabase
          .from('analytics_page_views')
          .select('created_at')
          .gte('created_at', ninetyDaysAgo.toISOString())

        const bestTimes = bestTimesData?.reduce((acc, view) => {
          const date = new Date(view.created_at)
          const hour = date.getHours()
          const day = date.getDay()
          const key = `${day}-${hour}`
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        const bestTimesArray = Object.entries(bestTimes)
          .map(([key, views]) => {
            const [day, hour] = key.split('-').map(Number)
            return { hour, day, views }
          })
          .sort((a, b) => b.views - a.views)

        // Daily views (last 30 days)
        const dailyViews = Array.from({ length: 30 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (29 - i))
          const dateStr = date.toISOString().split('T')[0]
          
          const views = overviewData?.filter(v => 
            v.created_at.startsWith(dateStr)
          ).length || 0
          
          return { date: dateStr, views }
        })

        setAnalyticsData({
          overview: { totalViews, uniqueSessions, topPages },
          sources: { referrers, utmSources },
          bestTimes: bestTimesArray,
          dailyViews,
        })
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, userRole])

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You need admin permissions to view analytics.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const getBestTimeRecommendations = () => {
    if (!analyticsData?.bestTimes.length) return []
    
    return analyticsData.bestTimes.slice(0, 3).map(({ hour, day, views }) => ({
      day: dayNames[day],
      time: `${hour.toString().padStart(2, '0')}:00`,
      views,
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Analytics - AI Cloud Ops"
        description="Site analytics and insights"
        noIndex
      />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your site performance and audience insights</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analyticsData ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
              <TabsTrigger value="timing">Best Times</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.overview.totalViews.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.overview.uniqueSessions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Unique sessions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Views per Session</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsData.overview.uniqueSessions > 0 
                        ? (analyticsData.overview.totalViews / analyticsData.overview.uniqueSessions).toFixed(1)
                        : '0'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">Pages per session</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Pages</CardTitle>
                  <CardDescription>Most visited pages in the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.overview.topPages}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="path" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="views" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sources" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Top Referrers
                    </CardTitle>
                    <CardDescription>External sites driving traffic</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            dataKey="views"
                            data={analyticsData.sources.referrers}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ domain, views }) => `${domain}: ${views}`}
                            outerRadius={80}
                            fill="#8884d8"
                          >
                            {analyticsData.sources.referrers.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>UTM Sources</CardTitle>
                    <CardDescription>Campaign traffic sources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.sources.utmSources}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="source" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="views" fill="hsl(var(--secondary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Best Time to Post Recommendations
                  </CardTitle>
                  <CardDescription>Optimal publishing times based on your audience activity (last 90 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getBestTimeRecommendations().map((rec, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-medium">#{i + 1} Best Time</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {rec.day}s at {rec.time}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {rec.views} average views
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daily Page Views
                  </CardTitle>
                  <CardDescription>Traffic trends over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.dailyViews}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="views" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
                <p className="text-muted-foreground">Start getting visitors to see analytics data here.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />
    </div>
  )
}

export default Analytics