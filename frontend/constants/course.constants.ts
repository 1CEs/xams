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

// Thai alphabet sorting helper
export const THAI_ALPHABET_ORDER = [
    'ก', 'ข', 'ฃ', 'ค', 'ฅ', 'ฆ', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ', 'ฎ', 'ฏ',
    'ฐ', 'ฑ', 'ฒ', 'ณ', 'ด', 'ต', 'ถ', 'ท', 'ธ', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ',
    'ฟ', 'ภ', 'ม', 'ย', 'ร', 'ฤ', 'ล', 'ฦ', 'ว', 'ศ', 'ษ', 'ส', 'ห', 'ฬ', 'อ', 'ฮ'
];

// Sorting functions
export const sortCoursesAlphabetically = (courses: CourseResponse[], language: 'en' | 'th' = 'en') => {
    return [...courses].sort((a, b) => {
        if (language === 'th') {
            return sortThaiText(a.course_name, b.course_name);
        }
        return a.course_name.localeCompare(b.course_name, 'en', { sensitivity: 'base' });
    });
};

export const sortThaiText = (a: string, b: string): number => {
    const aChar = a.charAt(0).toLowerCase();
    const bChar = b.charAt(0).toLowerCase();
    
    const aIndex = THAI_ALPHABET_ORDER.indexOf(aChar);
    const bIndex = THAI_ALPHABET_ORDER.indexOf(bChar);
    
    // If both characters are Thai
    if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
    }
    
    // If one is Thai and one is not, Thai comes after English
    if (aIndex !== -1 && bIndex === -1) return 1;
    if (aIndex === -1 && bIndex !== -1) return -1;
    
    // If both are non-Thai (likely English), use standard comparison
    return a.localeCompare(b, 'en', { sensitivity: 'base' });
};

export const filterCoursesByCategory = (courses: CourseResponse[], category: string) => {
    if (category === 'all') return courses;
    return courses.filter(course => course.category === category);
};

export type SearchType = 'all' | 'course_name' | 'instructor' | 'category';

export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
    all: 'All Fields',
    course_name: 'Course Name',
    instructor: 'Instructor Name',
    category: 'Category'
};

export const searchCourses = (courses: CourseResponse[], searchQuery: string, searchType: SearchType = 'all') => {
    if (!searchQuery.trim()) return courses;
    
    const query = searchQuery.toLowerCase();
    
    return courses.filter(course => {
        switch (searchType) {
            case 'course_name':
                return course.course_name.toLowerCase().includes(query);
            case 'instructor':
                // Instructor search is now handled by API, this is just fallback for client-side filtering
                return course.instructor_id.toLowerCase().includes(query);
            case 'category':
                return COURSE_CATEGORY_LABELS[course.category as CourseCategory]?.toLowerCase().includes(query);
            case 'all':
            default:
                // For 'all' search, only search course name and description on client side
                // Instructor search is handled by API
                return course.course_name.toLowerCase().includes(query) ||
                       course.description.toLowerCase().includes(query) ||
                       COURSE_CATEGORY_LABELS[course.category as CourseCategory]?.toLowerCase().includes(query);
        }
    });
};
