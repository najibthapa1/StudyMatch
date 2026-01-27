import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ChevronRight, ChevronLeft, Upload, Eye, EyeOff } from 'lucide-react';
import { registerUser } from '../../utils/api';

export function Signup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    university: '',
    major: '',
    year: '',
    interests: '',
    bio: '',
    projects: '',
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const updateFormData = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Call API
    const result = await registerUser(formData);

    if (result.success) {
      // Registration successful - go to verification page
      navigate('/verify-email', { 
        state: { email: formData.email } 
      });
    } else {
      // Show error
      if (typeof result.error === 'object') {
        // Display field errors
        const errorMessages = Object.entries(result.error)
          .map(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages[0] : messages;
            return `${field}: ${msg}`;
          })
          .join('\n');
        setError(errorMessages);
      } else {
        setError(result.error.message || 'Registration failed');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 lg:px-8 py-16 bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <Link
        to="/"
        className="fixed top-8 left-8 flex items-center space-x-2 text-gray-600 hover:text-black transition-colors"
      >
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <span className="text-white text-sm">SM</span>
        </div>
        <span>StudyMatch</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-200">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      step <= currentStep
                        ? 'bg-black text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-all ${
                        step < currentStep ? 'bg-black' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl tracking-tight mb-2">Basic Information</h2>
                  <p className="text-gray-600">Let's start with the basics</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">College Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@islingtoncollege.edu.np"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="h-12"
                    required
                  />
                  <p className="text-xs text-gray-500">Only @islingtoncollege.edu.np emails are allowed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      className="h-12 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Minimum 8 characters</p>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl tracking-tight mb-2">Academic Info</h2>
                  <p className="text-gray-600">Tell us about your studies</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university">University / College</Label>
                  <Input
                    id="university"
                    placeholder="e.g., Islington College"
                    value={formData.university}
                    onChange={(e) => updateFormData('university', e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">Major / Field of Study</Label>
                  <Input
                    id="major"
                    placeholder="e.g., Computer Science"
                    value={formData.major}
                    onChange={(e) => updateFormData('major', e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    placeholder="Junior, Senior, etc."
                    value={formData.year}
                    onChange={(e) => updateFormData('year', e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests">Areas of Interest</Label>
                  <Input
                    id="interests"
                    placeholder="Python, Web Development, Machine Learning"
                    value={formData.interests}
                    onChange={(e) => updateFormData('interests', e.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-gray-500">Separate with commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => updateFormData('bio', e.target.value)}
                    rows={4}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl tracking-tight mb-2">Complete Your Profile</h2>
                  <p className="text-gray-600">Almost there!</p>
                </div>

                <div className="space-y-2">
                  <Label>Profile Picture (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">You can upload later</p>
                    <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projects">Projects (Optional)</Label>
                  <Textarea
                    id="projects"
                    placeholder="Share any projects you've worked on..."
                    value={formData.projects}
                    onChange={(e) => updateFormData('projects', e.target.value)}
                    rows={4}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className="h-12"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleNext} 
              className="h-12 bg-black hover:bg-gray-800"
              disabled={loading}
            >
              {loading ? 'Processing...' : (currentStep === totalSteps ? 'Complete' : 'Next')}
              {!loading && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-black hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}