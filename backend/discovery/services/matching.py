from difflib import SequenceMatcher

# Predefined interest categories 
INTEREST_CATEGORIES = {
    # Sports & Fitness
    'football': 'sports', 'soccer': 'sports', 'basketball': 'sports', 'cricket': 'sports',
    'tennis': 'sports', 'volleyball': 'sports', 'badminton': 'sports', 'table tennis': 'sports',
    'swimming': 'sports', 'running': 'sports', 'jogging': 'sports', 'gym': 'sports',
    'fitness': 'sports', 'workout': 'sports', 'yoga': 'sports', 'cycling': 'sports',
    'hiking': 'sports', 'trekking': 'sports', 'athletics': 'sports', 'boxing': 'sports',
    'martial arts': 'sports', 'karate': 'sports', 'taekwondo': 'sports',
    
    # Programming Languages
    'python': 'programming', 'java': 'programming', 'javascript': 'programming', 'js': 'programming',
    'c++': 'programming', 'cpp': 'programming', 'c': 'programming', 'c#': 'programming',
    'csharp': 'programming', 'ruby': 'programming', 'php': 'programming', 'go': 'programming',
    'golang': 'programming', 'rust': 'programming', 'kotlin': 'programming', 'swift': 'programming',
    'typescript': 'programming', 'r': 'programming', 'matlab': 'programming', 'sql': 'programming',
    'coding': 'programming', 'programming': 'programming',
    
    # Web Development
    'web development': 'web_dev', 'web dev': 'web_dev', 'frontend': 'web_dev', 'backend': 'web_dev',
    'fullstack': 'web_dev', 'full stack': 'web_dev', 'react': 'web_dev', 'reactjs': 'web_dev',
    'angular': 'web_dev', 'vue': 'web_dev', 'vuejs': 'web_dev', 'node': 'web_dev',
    'nodejs': 'web_dev', 'html': 'web_dev', 'css': 'web_dev', 'sass': 'web_dev',
    'tailwind': 'web_dev', 'bootstrap': 'web_dev', 'django': 'web_dev', 'flask': 'web_dev',
    'spring': 'web_dev', 'laravel': 'web_dev',
    
    # Mobile Development
    'android': 'mobile_dev', 'ios': 'mobile_dev', 'mobile development': 'mobile_dev',
    'app development': 'mobile_dev', 'flutter': 'mobile_dev', 'react native': 'mobile_dev',
    
    # AI/ML/Data Science
    'machine learning': 'ai_ml', 'ml': 'ai_ml', 'ai': 'ai_ml', 'artificial intelligence': 'ai_ml',
    'deep learning': 'ai_ml', 'neural networks': 'ai_ml', 'data science': 'ai_ml',
    'data analysis': 'ai_ml', 'data analytics': 'ai_ml', 'nlp': 'ai_ml',
    'natural language processing': 'ai_ml', 'computer vision': 'ai_ml', 'tensorflow': 'ai_ml',
    'pytorch': 'ai_ml', 'keras': 'ai_ml', 'scikit-learn': 'ai_ml', 'statistics': 'ai_ml',
    'big data': 'ai_ml', 'data mining': 'ai_ml',
    
    # Database & Cloud
    'database': 'database', 'mongodb': 'database', 'postgresql': 'database', 'mysql': 'database',
    'redis': 'database', 'cloud computing': 'cloud', 'aws': 'cloud', 'azure': 'cloud',
    'gcp': 'cloud', 'devops': 'cloud', 'docker': 'cloud', 'kubernetes': 'cloud',
    
    # Cybersecurity
    'cybersecurity': 'security', 'cyber security': 'security', 'hacking': 'security',
    'ethical hacking': 'security', 'network security': 'security', 'penetration testing': 'security',
    'cryptography': 'security',
    
    # Music
    'music': 'music', 'guitar': 'music', 'piano': 'music', 'singing': 'music',
    'vocals': 'music', 'drums': 'music', 'violin': 'music', 'keyboard': 'music',
    'flute': 'music', 'listening to music': 'music', 'concerts': 'music',
    'music production': 'music', 'djing': 'music', 'rap': 'music', 'hip hop': 'music',
    'rock': 'music', 'jazz': 'music', 'classical music': 'music',
    
    # Arts & Creative
    'painting': 'arts', 'drawing': 'arts', 'sketching': 'arts', 'photography': 'arts',
    'graphic design': 'arts', 'design': 'arts', 'digital art': 'arts', 'illustration': 'arts',
    'calligraphy': 'arts', 'sculpting': 'arts', 'ui design': 'arts', 'ux design': 'arts',
    'ui/ux': 'arts', 'video editing': 'arts', 'animation': 'arts', '3d modeling': 'arts',
    'blender': 'arts',
    
    # Gaming
    'gaming': 'gaming', 'video games': 'gaming', 'esports': 'gaming', 'pc gaming': 'gaming',
    'mobile gaming': 'gaming', 'console gaming': 'gaming', 'valorant': 'gaming', 'pubg': 'gaming',
    'cod': 'gaming', 'minecraft': 'gaming', 'league of legends': 'gaming', 'dota': 'gaming',
    'cs:go': 'gaming', 'csgo': 'gaming', 'fortnite': 'gaming', 'apex legends': 'gaming',
    'chess': 'gaming', 'game development': 'gaming',
    
    # Reading/Writing
    'reading': 'literature', 'books': 'literature', 'writing': 'literature',
    'creative writing': 'literature', 'poetry': 'literature', 'poems': 'literature',
    'novels': 'literature', 'blogging': 'literature', 'journalism': 'literature',
    'content writing': 'literature',
    
    # Business/Entrepreneurship
    'business': 'business', 'entrepreneurship': 'business', 'startup': 'business',
    'startups': 'business', 'marketing': 'business', 'digital marketing': 'business',
    'finance': 'business', 'investing': 'business', 'stock market': 'business',
    'trading': 'business', 'economics': 'business', 'management': 'business',
    'leadership': 'business', 'sales': 'business',
    
    # Science
    'physics': 'science', 'chemistry': 'science', 'biology': 'science',
    'mathematics': 'science', 'math': 'science', 'calculus': 'science',
    'algebra': 'science', 'astronomy': 'science', 'astrophysics': 'science',
    'research': 'science', 'biotechnology': 'science', 'genetics': 'science',
    'environmental science': 'science',
    
    # Movies/TV/Entertainment
    'movies': 'entertainment', 'films': 'entertainment', 'cinema': 'entertainment',
    'tv shows': 'entertainment', 'series': 'entertainment', 'netflix': 'entertainment',
    'anime': 'entertainment', 'manga': 'entertainment', 'k-drama': 'entertainment',
    'korean drama': 'entertainment', 'bollywood': 'entertainment', 'hollywood': 'entertainment',
    'theater': 'entertainment', 'drama': 'entertainment',
    
    # Travel/Adventure
    'travel': 'travel', 'traveling': 'travel', 'travelling': 'travel',
    'adventure': 'travel', 'exploring': 'travel', 'backpacking': 'travel',
    'camping': 'travel', 'road trips': 'travel',
    
    # Fashion & Lifestyle
    'fashion': 'fashion', 'styling': 'fashion', 'makeup': 'fashion',
    'skincare': 'fashion', 'fitness modeling': 'fashion',
    
    # Social/Volunteering
    'volunteering': 'social', 'social work': 'social', 'ngo': 'social',
    'community service': 'social', 'activism': 'social', 'environmental activism': 'social',
    
    # Languages
    'languages': 'languages', 'learning languages': 'languages', 'french': 'languages',
    'spanish': 'languages', 'german': 'languages', 'japanese': 'languages',
    'korean': 'languages', 'chinese': 'languages', 'linguistics': 'languages',
    
    # Robotics & Hardware
    'robotics': 'robotics', 'arduino': 'robotics', 'raspberry pi': 'robotics',
    'iot': 'robotics', 'electronics': 'robotics', 'embedded systems': 'robotics',
    
    # Miscellaneous
    'meditation': 'wellness', 'mindfulness': 'wellness', 'mental health': 'wellness',
    'self improvement': 'wellness', 'productivity': 'wellness', 'podcasts': 'media',
    'public speaking': 'communication', 'debating': 'communication', 'debate': 'communication',
}

    
def get_string_similarity(str1, str2):
    """ Calculate similarity between two strings (0.0 to 1.0) """
    return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()


def get_interest_category(interest):
    """
    Get category for an interest using 3-tier approach:
    TIER 1: Exact match in predefined categories
    TIER 2: Fuzzy match (handles typos, plurals)
    TIER 3: Return interest itself as unique category
    """
    interest_lower = interest.lower().strip()
    
    if not interest_lower:
        return 'unknown'
    
    # TIER 1: Exact match
    if interest_lower in INTEREST_CATEGORIES:
        return INTEREST_CATEGORIES[interest_lower]
    
    # TIER 2: Fuzzy match (85% similar)
    best_match = None
    best_similarity = 0.0
    FUZZY_THRESHOLD = 0.85
    
    for known_interest, category in INTEREST_CATEGORIES.items():
        similarity = get_string_similarity(interest_lower, known_interest)
        if similarity >= FUZZY_THRESHOLD and similarity > best_similarity:
            best_similarity = similarity
            best_match = category
    
    if best_match:
        return best_match
    
    # TIER 3: Use interest itself as unique category
    return interest_lower


def calculate_match_score(user_profile, other_profile):
    """
    Calculate match score between two profiles using intelligent multi-factor algorithm.
    
    Scoring: Interests 40% + Course 30% + Year 20% + University 10%
    Returns: Score from 0.0 to 100.0
    """
    
    # Parse interests
    user_interests = [i.strip() for i in user_profile.interests.split(',') if i.strip()]
    other_interests = [i.strip() for i in other_profile.interests.split(',') if i.strip()]
    
    if not user_interests or not other_interests:
        interests_score = 0.0
    else:
        user_set = set(i.lower() for i in user_interests)
        other_set = set(i.lower() for i in other_interests)
        
        # 1. Direct match (exact same interests) - 50%
        direct_common = user_set & other_set
        total_unique = user_set | other_set
        direct_match_ratio = len(direct_common) / len(total_unique) if total_unique else 0
        
        # 2. Fuzzy match - 30%
        fuzzy_matches = 0
        remaining_user = user_set - direct_common
        remaining_other = other_set - direct_common
        checked_pairs = set()
        
        for u_int in remaining_user:
            for o_int in remaining_other:
                if (u_int, o_int) not in checked_pairs:
                    checked_pairs.add((u_int, o_int))
                    if get_string_similarity(u_int, o_int) >= 0.85:
                        fuzzy_matches += 1
                        break
        
        fuzzy_match_ratio = fuzzy_matches / len(total_unique) if total_unique else 0
        
        # 3. Category match  - 20%
        user_categories = set(get_interest_category(i) for i in user_interests)
        other_categories = set(get_interest_category(i) for i in other_interests)
        
        category_common = user_categories & other_categories
        category_total = user_categories | other_categories
        category_match_ratio = len(category_common) / len(category_total) if category_total else 0
        
        # Combined interest score
        interests_score = (
            direct_match_ratio * 50.0 +
            fuzzy_match_ratio * 30.0 +
            category_match_ratio * 20.0
        )
    
    # Course matching (30%)
    if user_profile.course and other_profile.course:
        user_course = user_profile.course.lower().strip()
        other_course = other_profile.course.lower().strip()
        
        if user_course == other_course:
            course_score = 100.0
        elif get_string_similarity(user_course, other_course) >= 0.85:
            course_score = 80.0
        else:
            course_score = 0.0
    else:
        course_score = 0.0
    
    # Year matching (20%)
    year_map = {
        'freshman': 1, 'first year': 1, '1st year': 1, '1':1, "first":1,
        'second year': 2, '2nd year': 2, '2':2, "second":2,
        'junior': 3, 'third year': 3, '3rd year': 3, '3':3, "third":3,
        'senior': 4, 'fourth year': 4, '4th year': 4, 'final year': 4, '4':4, "fourth":4
    }
    
    user_year = year_map.get(user_profile.year.lower().strip(), 0) if user_profile.year else 0
    other_year = year_map.get(other_profile.year.lower().strip(), 0) if other_profile.year else 0
    
    if user_year and other_year:
        year_diff = abs(user_year - other_year)
        year_score = 100.0 if year_diff == 0 else (50.0 if year_diff == 1 else 0.0)
    else:
        year_score = 0.0
    
    # University matching (10%) - always 100%
    university_score = 100.0
    
    # Final weighted score
    total_score = (
        interests_score * 0.40 +
        course_score * 0.30 +
        year_score * 0.20 +
        university_score * 0.10
    )
    
    return round(total_score, 1)
