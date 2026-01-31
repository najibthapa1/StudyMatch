import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Save, Upload, Users, MessageCircle, TrendingUp, Target, Plus, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { 
  getProfile, 
  updateProfile, 
  uploadProfilePicture,
  getUserStats,
  getActivityTimeline,
  getStudyGoals,
  createStudyGoal,
  updateStudyGoal,
  deleteStudyGoal,
  getUser
} from '../../utils/api';

export function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [studyGoals, setStudyGoals] = useState([]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  
  // Form states
  const [profileData, setProfileData] = useState({
    full_name: '',
    university_name: '',
    course: '',
    year: '',
    bio: '',
    interests: '',
  });

  // Study goals states
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoalText, setEditingGoalText] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (user?.profile) {
      setProfileData({
        full_name: user.profile.full_name || '',
        university_name: user.profile.university_name || '',
        course: user.profile.course || '',
        year: user.profile.year || '',
        bio: user.profile.bio || '',
        interests: user.profile.interests || '',
      });
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [profileData, statsData, activityData, goalsData] = await Promise.all([
        getProfile(),
        getUserStats(),
        getActivityTimeline(),
        getStudyGoals()
      ]);
      
      setUser(profileData);
      setStats(statsData);
      setActivities(activityData);
      setStudyGoals(goalsData);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Update profile
      await updateProfile(profileData);
      
      // Upload profile picture if selected
      if (profilePictureFile) {
        await uploadProfilePicture(profilePictureFile);
        setProfilePictureFile(null);
        setProfilePicturePreview(null);
      }
      
      // Refresh profile data
      const updatedProfile = await getProfile();
      setUser(updatedProfile);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfileField = (field, value) => {
    setProfileData({ ...profileData, [field]: value });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Study Goals handlers
  const handleAddGoal = async () => {
    if (newGoal.trim()) {
      try {
        await createStudyGoal(newGoal.trim());
        setNewGoal('');
        setIsAddingGoal(false);
        const goalsData = await getStudyGoals();
        setStudyGoals(goalsData);
      } catch (error) {
        console.error('Error adding goal:', error);
      }
    }
  };

  const handleStartEditGoal = (goal) => {
    setEditingGoalId(goal.goal_id);
    setEditingGoalText(goal.title);
  };

  const handleSaveGoalEdit = async () => {
    if (editingGoalId && editingGoalText.trim()) {
      try {
        await updateStudyGoal(editingGoalId, editingGoalText.trim());
        setEditingGoalId(null);
        setEditingGoalText('');
        const goalsData = await getStudyGoals();
        setStudyGoals(goalsData);
      } catch (error) {
        console.error('Error updating goal:', error);
      }
    }
  };

  const handleCancelGoalEdit = () => {
    setEditingGoalId(null);
    setEditingGoalText('');
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteStudyGoal(goalId);
      const goalsData = await getStudyGoals();
      setStudyGoals(goalsData);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getInitials = () => {
    if (user?.profile?.initials) return user.profile.initials;
    return 'U';
  };

  const statsList = [
    { label: 'Connections', value: stats?.connections || 0, icon: Users, color: 'text-blue-600' },
    { label: 'Messages', value: stats?.messages || 0, icon: MessageCircle, color: 'text-green-600' },
    { label: 'Match Rate', value: `${stats?.match_rate || 0}%`, icon: TrendingUp, color: 'text-purple-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 lg:px-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex items-center justify-between"
        >
          <div>
            <h1 className="text-5xl tracking-tight mb-2">Profile</h1>
            <p className="text-xl text-gray-600">Manage your information and activity</p>
          </div>
          <Button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="bg-black hover:bg-gray-800"
            disabled={isSaving}
          >
            {isSaving ? (
              'Saving...'
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl p-8 border border-gray-200"
            >
              <div className="flex items-start space-x-6 mb-8">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {profilePicturePreview || user?.profile?.profile_picture ? (
                    <img 
                      src={profilePicturePreview || user.profile.profile_picture} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                      {getInitials()}
                    </div>
                  )}
                  {isEditing && (
                    <div className="mt-2">
                      <label htmlFor="profile-picture" className="cursor-pointer">
                        <div className="flex items-center text-sm text-gray-600 hover:text-black">
                          <Upload className="w-4 h-4 mr-1" />
                          Upload
                        </div>
                        <input
                          id="profile-picture"
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {!isEditing ? (
                  <div className="flex-1">
                    <h2 className="text-3xl mb-2">{profileData.full_name}</h2>
                    <p className="text-gray-600 mb-1">{user?.email}</p>
                    <p className="text-gray-600 mb-1">{profileData.university_name}</p>
                    <p className="text-gray-600">
                      {profileData.course} {profileData.year && `• ${profileData.year}`}
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.full_name}
                        onChange={(e) => updateProfileField('full_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Input
                        id="university"
                        value={profileData.university_name}
                        onChange={(e) => updateProfileField('university_name', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="major">Major</Label>
                        <Input
                          id="major"
                          value={profileData.course}
                          onChange={(e) => updateProfileField('course', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          value={profileData.year}
                          onChange={(e) => updateProfileField('year', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  {isEditing && <Label htmlFor="bio" className="mb-2 block">Bio</Label>}
                  {!isEditing ? (
                    <p className="text-gray-700">{profileData.bio || 'No bio added yet.'}</p>
                  ) : (
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => updateProfileField('bio', e.target.value)}
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  )}
                </div>

                <div>
                  <h3 className="mb-3">Areas of Interest</h3>
                  {!isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {profileData.interests ? (
                        profileData.interests.split(',').map((interest) => (
                          <span
                            key={interest.trim()}
                            className="px-4 py-2 bg-gray-100 rounded-full"
                          >
                            {interest.trim()}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No interests added yet.</p>
                      )}
                    </div>
                  ) : (
                    <Input
                      value={profileData.interests}
                      onChange={(e) => updateProfileField('interests', e.target.value)}
                      placeholder="Separate interests with commas"
                    />
                  )}
                </div>
              </div>
            </motion.div>

            {/* Activity Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-8 border border-gray-200"
            >
              <h2 className="text-2xl tracking-tight mb-6">Activity Timeline</h2>
              {activities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-6">
                  {activities.slice(0, 5).map((activity, index) => {
                    const iconMap = {
                      connection: Users,
                      message: MessageCircle,
                      goal: Target,
                      event: CheckCircle2,
                    };
                    const Icon = iconMap[activity.activity_type] || CheckCircle2;
                    const colorMap = {
                      connection: 'bg-blue-500',
                      message: 'bg-purple-500',
                      goal: 'bg-green-500',
                      event: 'bg-orange-500',
                    };
                    const color = colorMap[activity.activity_type] || 'bg-gray-500';
                    
                    return (
                      <motion.div
                        key={activity.activity_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                        className="flex items-start space-x-4"
                      >
                        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 mb-1">{activity.action}</p>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                          )}
                          <p className="text-xs text-gray-500">{activity.time_ago}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar - Stats */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border border-gray-200"
            >
              <h3 className="text-xl mb-6">Your Statistics</h3>
              <div className="space-y-6">
                {statsList.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                        <span className="text-gray-700">{stat.label}</span>
                      </div>
                      <span className="text-2xl">{stat.value}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-black rounded-2xl p-6 text-white"
            >
              <Users className="w-12 h-12 mb-4" />
              <h3 className="text-xl mb-2">Growing Network</h3>
              <p className="text-gray-300 mb-4">
                You've connected with {stats?.connections || 0} students. Keep expanding your network!
              </p>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all" 
                  style={{ width: `${Math.min((stats?.connections || 0) * 10, 100)}%` }}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Study Goals - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl p-8 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Target className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl tracking-tight">Study Goals</h2>
            </div>
            <Button
              onClick={() => setIsAddingGoal(true)}
              className="bg-black hover:bg-gray-800"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studyGoals.length === 0 && !isAddingGoal ? (
              <p className="text-gray-500 text-center py-8 col-span-full">
                No study goals yet. Add one to get started!
              </p>
            ) : (
              studyGoals.map((goal) => (
                <motion.div
                  key={goal.goal_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  {editingGoalId === goal.goal_id ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <Input
                        value={editingGoalText}
                        onChange={(e) => setEditingGoalText(e.target.value)}
                        className="flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveGoalEdit();
                          if (e.key === 'Escape') handleCancelGoalEdit();
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveGoalEdit}
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          onClick={handleCancelGoalEdit}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="flex-1 text-gray-700">{goal.title}</p>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => handleStartEditGoal(goal)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteGoal(goal.goal_id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-100"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))
            )}
            
            {isAddingGoal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl"
              >
                <Input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Enter your new study goal..."
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddGoal();
                    if (e.key === 'Escape') {
                      setIsAddingGoal(false);
                      setNewGoal('');
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddGoal}
                    className="flex-1 bg-black hover:bg-gray-800"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingGoal(false);
                      setNewGoal('');
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}