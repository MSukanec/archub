import { supabase } from '@/lib/supabase';
export interface CreateCourseFaqData {
  courseId: string;
  question: string;
  answer: string;
  sortIndex?: number;
}
export async function createCourseFaq(data: CreateCourseFaqData) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { error } = await supabase
    .from('course_faqs')
    .insert({
      course_id: data.courseId,
      question: data.question,
      answer: data.answer,
      sort_index: data.sortIndex || 0
    });
  if (error) throw error;
}
