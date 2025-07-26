export const COURSE_CATEGORIES = [
    'general',
    'mathematics',
    'science',
    'computer_science',
    'languages',
    'social_studies',
    'arts',
    'business',
    'health',
    'engineering'
] as const;

export type CourseCategory = typeof COURSE_CATEGORIES[number];

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
    general: 'General',
    mathematics: 'Mathematics',
    science: 'Science',
    computer_science: 'Computer Science',
    languages: 'Languages',
    social_studies: 'Social Studies',
    arts: 'Arts',
    business: 'Business',
    health: 'Health',
    engineering: 'Engineering'
};
