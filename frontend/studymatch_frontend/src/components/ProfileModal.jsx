import { X, Mail, MapPin, Calendar, BookOpen, Award, Users, MessageCircle, UserPlus, UserX, UserCheck, ExternalLink, Target, FolderGit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';

// Helper to parse projects from JSON string or legacy format
const parseProjects = (projectsData) => {
  if (!projectsData) return [];
  
  // If already an array (passed directly), return it
  if (Array.isArray(projectsData)) return projectsData;
  
  // If string, try to parse as JSON
  if (typeof projectsData === 'string') {
    try {
      const parsed = JSON.parse(projectsData);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      // Legacy format: plain text, convert to single project
      if (projectsData.trim()) {
        return [{ link: '', description: projectsData }];
      }
      return [];
    }
  }
  
  return [];
};

export function ProfileModal({ isOpen, onClose, user, onConnect, onMessage, onRemove }) {
  // Parse projects
  const projects = parseProjects(user.projects);
  
  const stats = [
    { 
      label: 'Projects', 
      value: user.projectsCompleted || 0, 
      icon: Award 
    },
    { 
      label: 'Study Hours', 
      value: user.studyHours || 0, 
      icon: BookOpen 
    },
    { 
      label: 'Connections', 
      value: user.connectionCount || 0, 
      icon: Users 
    },
  ];

  const getConnectionButtonText = () => {
    if (user.isConnected) {
      return 'Connected';
    }
    if (user.connection_status === 'pending_sent') {
      return 'Request Sent';
    }
    if (user.connection_status === 'pending_received') {
      return 'Accept Request';
    }
    return 'Connect';
  };

  const isConnectionDisabled = () => {
    return user.isConnected || user.connection_status === 'pending_sent';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="relative flex-shrink-0">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 hover:bg-white/80 rounded-full transition-colors z-10 bg-white/60"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Profile Header */}
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-t-2xl">
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-3xl">{user.avatar}</span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="min-w-0">
                          <h2 className="text-3xl tracking-tight mb-1 truncate">{user.name}</h2>
                          <p className="text-lg text-gray-700">
                            {user.major} {user.year && `• ${user.year}`}
                          </p>
                        </div>
                        {user.isConnected && (
                          <div className="bg-green-100 px-4 py-2 rounded-full shadow-sm flex-shrink-0">
                            <span className="text-sm text-green-700 flex items-center">
                              <UserCheck className="w-4 h-4 mr-1" />
                              Connected
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
                        {user.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                            {user.location}
                          </div>
                        )}
                        {user.joinedDate && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                            Joined {user.joinedDate}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {(user.projectsCompleted || user.studyHours || user.connectionCount) && (
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                        <stat.icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                        <div className="text-2xl mb-1">{stat.value}</div>
                        <div className="text-xs text-gray-600">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Bio */}
                <div className="mb-8">
                  <h3 className="text-xl mb-3">About</h3>
                  <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                </div>

                {/* Interests */}
                {user.interests && user.interests.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Courses */}
                {user.courses && user.courses.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl mb-3">Current Courses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {user.courses.map((course) => (
                        <div
                          key={course}
                          className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <BookOpen className="w-4 h-4 mr-3 text-gray-600 flex-shrink-0" />
                          <span className="text-sm">{course}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Study Goals */}
                {user.studyGoals && user.studyGoals.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      Study Goals
                    </h3>
                    <ul className="space-y-2">
                      {user.studyGoals.map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Projects */}
                {projects.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl mb-3 flex items-center gap-2">
                      <FolderGit2 className="w-5 h-5 text-gray-700" />
                      Projects
                    </h3>
                    <div className="space-y-4">
                      {projects.map((project, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mb-2 break-all"
                            >
                              {project.link}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          )}
                          {project.description && (
                            <p className="text-gray-700">{project.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 p-6 bg-white border-t border-gray-200">
                <div className="flex gap-3">
                  {user.isConnected ? (
                    <>
                      {onMessage && (
                        <Button
                          onClick={onMessage}
                          className="flex-1 bg-black hover:bg-gray-800"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                      )}
                      {onRemove && (
                        <Button
                          onClick={onRemove}
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {onConnect && (
                        <Button
                          onClick={onConnect}
                          disabled={isConnectionDisabled()}
                          className={`flex-1 ${
                            user.connection_status === 'pending_sent'
                              ? 'bg-gray-400 cursor-not-allowed'
                              : user.connection_status === 'pending_received'
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-black hover:bg-gray-800'
                          }`}
                        >
                          {user.connection_status === 'pending_sent' ? (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Request Sent
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              {getConnectionButtonText()}
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}