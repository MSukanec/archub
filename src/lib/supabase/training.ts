import { supabase } from '@/lib/supabase'

export type CourseProgressRow = {
  course_id: string
  course_title: string
  course_slug: string
  user_id: string
  progress_pct: number
  done_lessons: number
  total_lessons: number
}

export type GlobalProgress = {
  user_id: string
  done_lessons_total: number
  total_lessons_total: number
  progress_pct: number
}

export type StudyTime = {
  user_id: string
  seconds_lifetime: number
  seconds_this_month: number
}

export type ActiveDay = { 
  user_id: string
  day: string 
}

export type RecentActivityItem = {
  course_id: string
  course_title: string
  module_id: string
  module_title: string
  lesson_id: string
  lesson_title: string
  when: string
  type: 'completed' | 'progress'
}

export async function fetchGlobalProgress(userId: string): Promise<GlobalProgress | null> {
  if (!supabase) return null
  
  try {
    const { data: enrollments, error: enrollError } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('user_id', userId)

    if (enrollError) throw enrollError
    if (!enrollments || enrollments.length === 0) return null

    const courseIds = enrollments.map(e => e.course_id)

    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('id, module_id, course_modules!inner(course_id)')
      .in('course_modules.course_id', courseIds)
      .eq('is_active', true)

    if (lessonsError) throw lessonsError

    const lessonIds = lessons?.map(l => l.id) || []
    const total_lessons_total = lessonIds.length

    const { data: progress, error: progressError } = await supabase
      .from('course_lesson_progress')
      .select('lesson_id, is_completed')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)

    if (progressError) throw progressError

    const done_lessons_total = progress?.filter(p => p.is_completed).length || 0
    const progress_pct = total_lessons_total > 0 
      ? Math.round((done_lessons_total / total_lessons_total) * 100) 
      : 0

    return {
      user_id: userId,
      done_lessons_total,
      total_lessons_total,
      progress_pct
    }
  } catch (error) {
    return null
  }
}

export async function fetchCourseProgress(userId: string): Promise<CourseProgressRow[]> {
  if (!supabase) return []
  
  try {
    const { data: enrollments, error: enrollError } = await supabase
      .from('course_enrollments')
      .select('course_id, courses(id, title, slug)')
      .eq('user_id', userId)

    if (enrollError) throw enrollError
    if (!enrollments || enrollments.length === 0) return []

    const courseProgress: CourseProgressRow[] = []

    for (const enrollment of enrollments) {
      const courseId = enrollment.course_id
      const courseTitle = (enrollment.courses as any)?.title || 'Sin título'
      const courseSlug = (enrollment.courses as any)?.slug || ''

      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('id, module_id, course_modules!inner(course_id)')
        .eq('course_modules.course_id', courseId)
        .eq('is_active', true)

      if (lessonsError) continue

      const lessonIds = lessons?.map(l => l.id) || []
      const total_lessons = lessonIds.length

      const { data: progress, error: progressError } = await supabase
        .from('course_lesson_progress')
        .select('lesson_id, is_completed')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      if (progressError) continue

      const done_lessons = progress?.filter(p => p.is_completed).length || 0
      const progress_pct = total_lessons > 0 
        ? Math.round((done_lessons / total_lessons) * 100) 
        : 0

      courseProgress.push({
        course_id: courseId,
        course_title: courseTitle,
        course_slug: courseSlug,
        user_id: userId,
        progress_pct,
        done_lessons,
        total_lessons
      })
    }

    return courseProgress
  } catch (error) {
    return []
  }
}

export async function fetchStudyTime(userId: string): Promise<StudyTime | null> {
  if (!supabase) return null
  
  try {
    const { data: progress, error } = await supabase
      .from('course_lesson_progress')
      .select('updated_at, completed_at, last_position_sec')
      .eq('user_id', userId)

    if (error) throw error
    if (!progress || progress.length === 0) {
      return {
        user_id: userId,
        seconds_lifetime: 0,
        seconds_this_month: 0
      }
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    let seconds_lifetime = 0
    let seconds_this_month = 0

    progress.forEach(p => {
      const lastPos = p.last_position_sec || 0
      seconds_lifetime += lastPos

      const updateDate = new Date(p.updated_at)
      if (updateDate >= startOfMonth) {
        seconds_this_month += lastPos
      }
    })

    return {
      user_id: userId,
      seconds_lifetime,
      seconds_this_month
    }
  } catch (error) {
    return null
  }
}

export async function fetchActiveDays(userId: string, limitDays = 90): Promise<ActiveDay[]> {
  if (!supabase) return []
  
  try {
    const cutoffDate = new Date(Date.now() - limitDays * 86400000)
    
    const { data: progress, error } = await supabase
      .from('course_lesson_progress')
      .select('updated_at')
      .eq('user_id', userId)
      .gte('updated_at', cutoffDate.toISOString())
      .order('updated_at', { ascending: true })

    if (error) throw error
    if (!progress || progress.length === 0) return []

    const daysSet = new Set<string>()
    progress.forEach(p => {
      const day = new Date(p.updated_at).toISOString().slice(0, 10)
      daysSet.add(day)
    })

    return Array.from(daysSet).map(day => ({
      user_id: userId,
      day
    }))
  } catch (error) {
    return []
  }
}

export async function fetchRecentActivity(userId: string, limit = 10): Promise<RecentActivityItem[]> {
  if (!supabase) return []
  
  try {
    const { data, error } = await supabase
      .from('course_lesson_progress')
      .select(`
        lesson_id,
        user_id,
        updated_at,
        completed_at,
        is_completed,
        course_lessons!inner (
          id, title, module_id,
          course_modules!inner ( 
            id, title, course_id,
            courses!inner(id, title) 
          )
        )
      `)
      .eq('user_id', userId)
      .or('is_completed.eq.true,progress_pct.gt.0')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    if (!data || data.length === 0) return []

    const items: RecentActivityItem[] = data.map((r: any) => ({
      course_id: r.course_lessons.course_modules.courses.id,
      course_title: r.course_lessons.course_modules.courses.title,
      module_id: r.course_lessons.course_modules.id,
      module_title: r.course_lessons.course_modules.title,
      lesson_id: r.lesson_id,
      lesson_title: r.course_lessons.title,
      when: (r.completed_at ?? r.updated_at),
      type: r.is_completed ? 'completed' : 'progress',
    }))

    return items
  } catch (error) {
    return []
  }
}
