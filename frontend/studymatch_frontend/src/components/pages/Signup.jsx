import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ChevronRight, ChevronLeft, Upload, Eye, EyeOff, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { registerUser, checkEmailAvailability, getAllowedDomains } from '../../utils/api';

export function Signup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [allowedDomains, setAllowedDomains] = useState([]);

  const pictureInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    university: 'Islington College',
    major: '',
    year: '',
    interests: '',
    bio: '',
  });

  // Separate state for projects as array
  const [projects, setProjects] = useState([]);

  const [pictureFile, setPictureFile] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);

  const totalSteps = 3;

  // fetch allowed domains on mount
  useEffect(() => {
    getAllowedDomains().then(domains => setAllowedDomains(domains));
  }, []);

  // check if email has valid domain
  const isValidDomain = (email) => {
    if (!allowedDomains.length) return true;
    return allowedDomains.some(d => email.endsWith(`@${d}`));
  };

  const getDomainHint = () => {
    if (!allowedDomains.length) return '';
    return allowedDomains.map(d => `@${d}`).join(', ');
  };

  // Real-time email domain validation
  const handleEmailChange = (value) => {
    setFormData(prev => ({ ...prev, email: value }));
    setError('');

    if (value.includes('@')) {
      if (!isValidDomain(value)) {
        setEmailError(`Only ${getDomainHint()} emails are allowed`);
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  };

  // Step 1: validate fields, then check email availability via dedicated endpoint
  const handleStep1Next = async () => {
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!isValidDomain(formData.email)) {
      setError(`Only ${getDomainHint()} emails are allowed`);
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await checkEmailAvailability(formData.email);
      if (!result.available) {
        setError('This email is already registered. Please login instead.');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Email check failed, proceeding:', err);
    }
    setLoading(false);

    setError('');
    setCurrentStep(2);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      await handleStep1Next();
      return;
    }

    if (currentStep < totalSteps) {
      setError('');
      setCurrentStep(currentStep + 1);
    } else {
      // Step 3 — final submission
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Project management functions
  const addProject = () => {
    setProjects([...projects, { link: '', description: '' }]);
  };

  const updateProject = (index, field, value) => {
    const updatedProjects = [...projects];
    updatedProjects[index][field] = value;
    setProjects(updatedProjects);
  };

  const removeProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile picture must be under 5MB');
      return;
    }

    setPictureFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPicturePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Filter out empty projects and convert to JSON string
    const validProjects = projects.filter(p => p.link.trim() || p.description.trim());
    const projectsJson = validProjects.length > 0 ? JSON.stringify(validProjects) : '';

    // Build FormData so we can include the profile picture in one request
    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('email', formData.email);
    payload.append('password', formData.password);
    payload.append('university', formData.university);
    payload.append('major', formData.major);
    payload.append('year', formData.year);
    payload.append('interests', formData.interests);
    payload.append('bio', formData.bio);
    payload.append('projects', projectsJson);
    if (pictureFile) {
      payload.append('profile_picture', pictureFile);
    }

    const result = await registerUser(payload);

    if (result.success) {
      navigate('/verify-email', { state: { email: formData.email } });
    } else {
      const errData = result.error;
      if (errData && typeof errData === 'object') {
        // Pick the first field error and show it cleanly
        const firstKey = Object.keys(errData)[0];
        if (firstKey) {
          const msg = Array.isArray(errData[firstKey])
            ? errData[firstKey][0]
            : errData[firstKey];
          setError(String(msg));
        } else {
          setError('Registration failed. Please try again.');
        }
      } else if (typeof errData === 'string') {
        setError(errData);
      } else {
        setError('Registration failed. Please try again.');
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
                      step < currentStep
                        ? 'bg-black text-white'
                        : step === currentStep
                        ? 'bg-black text-white ring-4 ring-gray-200'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step
                    )}
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
            <div className="text-center text-sm text-gray-600 mt-2">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <AnimatePresence mode="wait">

            {/* ── Step 1: Basic Info ── */}
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">College Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={allowedDomains.length ? `you@${allowedDomains[0]}` : 'you@college.edu'}
                    value={formData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`h-12 ${emailError ? 'border-red-400 focus:ring-red-400' : ''}`}
                  />
                  {emailError ? (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span>⚠</span> {emailError}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {getDomainHint() ? `Only ${getDomainHint()} emails allowed` : 'Use your college email'}
                    </p>
                  )}
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

            {/* ── Step 2: Academic Info ── */}
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
                  <select
                    id="university"
                    value={formData.university}
                    onChange={(e) => updateFormData('university', e.target.value)}
                    className="w-full h-12 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="Islington College">Islington College</option>
                    <option value="Demo College">Demo College</option>
                  </select>
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
                  <select
                    id="year"
                    value={formData.year}
                    onChange={(e) => updateFormData('year', e.target.value)}
                    className="w-full h-12 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select your year</option>
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Fourth Year">Fourth Year</option>
                  </select>
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

            {/* ── Step 3: Profile Picture & Projects ── */}
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
                  <div
                    onClick={() => pictureInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  >
                    {picturePreview ? (
                      <img
                        src={picturePreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                      />
                    ) : (
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    )}
                    <p className="text-gray-600 mb-2">
                      {picturePreview ? 'Click to change picture' : 'Click to upload a profile picture'}
                    </p>
                    <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
                    <input
                      ref={pictureInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePictureChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Projects (Optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addProject}
                      className="h-8"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Project
                    </Button>
                  </div>
                  
                  {projects.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                      No projects added yet. Click "Add Project" to share your work.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Project {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeProject(index)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <Input
                              placeholder="Project link (e.g., https://github.com/username/project)"
                              value={project.link}
                              onChange={(e) => updateProject(index, 'link', e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Brief description of the project..."
                              value={project.description}
                              onChange={(e) => updateProject(index, 'description', e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
              disabled={loading || !!emailError}
            >
              {loading
                ? currentStep === 1
                  ? 'Checking...'
                  : 'Submitting...'
                : currentStep === totalSteps
                ? 'Complete'
                : 'Next'}
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