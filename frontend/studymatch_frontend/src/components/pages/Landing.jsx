import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MessageCircle, User, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { BackgroundPaths } from "@/components/ui/background-paths"



export function Landing({ onLogin }) {
  const navigate = useNavigate();

  const benefits = [
    { icon: Users, title: 'Connect with Peers', description: 'Discover students who share your academic interests and goals' },
    { icon: MessageCircle, title: 'Collaborate Seamlessly', description: 'Chat, share files, and work together on projects in real-time' },
    { icon: User, title: 'Profile Management',description: 'Manage your profile with your interests, skills, goals, and projects'},
  ];

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory">
           {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white">SM</span>
              </div>
              <span className="tracking-tight">StudyMatch</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-black hover:bg-gray-800">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      {/* Slide 1: BackgroundPaths */}
      <div className="h-screen snap-start">
        <BackgroundPaths
          title="StudyMatch"
          subtitle="Collaborate Smarter, Not Harder"
        />
      </div>

      {/* Slide 2: Hero Section */}
      <div className="h-screen snap-start flex items-center justify-center px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-6xl lg:text-7xl tracking-tight mb-6">
              Find Your Study
              <br />
              <span className="italic">Community</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Connect with students who share your academic passions. Collaborate, learn, and grow together.
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-black hover:bg-gray-800 group">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Slide 3: Benefits Section */}
      <div className="h-screen snap-start flex items-center justify-center px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl tracking-tight mb-4">
              Why StudyMatch?
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to build meaningful academic connections
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div key={benefit.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="p-8 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slide 4: CTA Section */}
      <div className="h-screen snap-start flex items-center justify-center px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="bg-black text-white rounded-3xl p-12 lg:p-16 text-center">
            <h2 className="text-4xl lg:text-5xl tracking-tight mb-6">
              Ready to Connect?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of students already collaborating on StudyMatch
            </p>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="bg-white text-black hover:bg-gray-100 border-white">
                Create Your Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}