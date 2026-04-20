import pytest
from discovery.services.matching import (
    calculate_match_score,
    get_string_similarity,
    get_interest_category
)
from authentication.models import User
from user_profile.models import Profile


class TestStringSimilarity:
    
    def test_identical_strings_return_similarity_score_of_1_0(self):
        similarity = get_string_similarity("python", "python")
        assert similarity == 1.0


class TestInterestCategoryMapping:
    
    def test_known_interest_maps_to_correct_category(self):
        assert get_interest_category("python") == "programming"
        assert get_interest_category("react") == "web_dev"
        assert get_interest_category("football") == "sports"
        assert get_interest_category("guitar") == "music"
    
    def test_unknown_interest_returns_itself_as_category(self):
        unknown = "xyz_unknown_interest"
        result = get_interest_category(unknown)
        assert result == unknown


class TestMatchScoreCalculation:

    @pytest.mark.django_db
    def test_identical_profile_score_at_least_80(self):
        """Test case #31: Identical profile score at least 80"""
        user1 = User.objects.create_user(
            email='user1@islingtoncollege.edu.np',
            password='Pass123'
        )
        profile1 = Profile.objects.create(user=user1, full_name='Test', university_name='Test')
        profile1.interests = "python,javascript,react"
        profile1.course = "Computer Science"
        profile1.year = "2nd year"
        profile1.university_name = "Islington College"
        profile1.save()
        
        user2 = User.objects.create_user(
            email='user2@islingtoncollege.edu.np',
            password='Pass123'
        )
        profile2 = Profile.objects.create(user=user2, full_name='Test', university_name='Test')
        profile2.interests = "python,javascript,react"
        profile2.course = "Computer Science"
        profile2.year = "2nd year"
        profile2.university_name = "Islington College"
        profile2.save()
        
        score = calculate_match_score(profile1, profile2)
        assert score >= 80.0
    
    @pytest.mark.django_db
    def test_matching_course_with_no_other_overlaps_scores_40(self):
        user1 = User.objects.create_user(
            email='user1@islingtoncollege.edu.np',
            password='Pass123'
        )
        profile1 = Profile.objects.create(user=user1, full_name='Test', university_name='Test')
        profile1.interests = "interest1,interest2"
        profile1.course = "Computer Science"
        profile1.year = "1st year"
        profile1.university_name = "Islington College"
        profile1.save()
        
        user2 = User.objects.create_user(
            email='user2@islingtoncollege.edu.np',
            password='Pass123'
        )
        profile2 = Profile.objects.create(user=user2, full_name='Test', university_name='Test')
        profile2.interests = "interest3,interest4"
        profile2.course = "Computer Science"
        profile2.year = "3rd year"
        profile2.university_name = "Different University"
        profile2.save()
        
        score = calculate_match_score(profile1, profile2)
        assert score >= 40.0 and score <= 50.0
    
    @pytest.mark.django_db
    def test_empty_interests_on_both_profiles_does_not_crash(self):
        user1 = User.objects.create_user(
            email='user1@islingtoncollege.edu.np',
            password='Pass123'
        )
        profile1 = Profile.objects.create(user=user1, full_name='Test', university_name='Test')
        profile1.interests = ""
        profile1.course = "Computer Science"
        profile1.year = "2nd year"
        profile1.university_name = "Islington College"
        profile1.save()
        
        user2 = User.objects.create_user(
            email='user2@islingtoncollege.edu.np',
            password='Pass123'
        )
        profile2 = Profile.objects.create(user=user2, full_name='Test', university_name='Test')
        profile2.interests = ""
        profile2.course = "Computer Science"
        profile2.year = "2nd year"
        profile2.university_name = "Islington College"
        profile2.save()
        
        score = calculate_match_score(profile1, profile2)
        assert score is not None
        assert isinstance(score, (int, float))
