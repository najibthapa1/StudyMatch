import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { getUser, logout } from '../utils/api';

export function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = getUser();
    if (!userData) {
      // Not logged in - redirect to login
      navigate('/login');
      return;
    }
    setUser(userData);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">SM</span>
              </div>
              <span className="font-semibold">StudyMatch</span>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="h-9"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold mb-4">Welcome to StudyMatch! 🎉</h1>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 mb-2">Your Profile:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Name:</strong> {user.profile?.full_name || 'N/A'}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>University:</strong> {user.profile?.university_name || 'N/A'}</p>
                <p><strong>Course:</strong> {user.profile?.course || 'N/A'}</p>
                <p><strong>Year:</strong> {user.profile?.year || 'N/A'}</p>
                <p><strong>Interests:</strong> {user.profile?.interests || 'N/A'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-gray-600 mb-4">
                Authentication is working! <br />
                Next: Build profile, discovery, and messaging features.
              </p>
              
              <div className="flex gap-4">
                <Button className="bg-black hover:bg-gray-800" disabled>
                  View Profile (Coming Soon)
                </Button>
                <Button variant="outline" disabled>
                  Discover Students (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}