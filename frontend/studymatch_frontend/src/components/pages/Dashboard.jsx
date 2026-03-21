import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, MessageCircle, Calendar, UserCheck, BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Navbar } from '../Navbar';
import { getUserStats, getActivityTimeline, getUser } from '../../utils/api';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studyTip, setStudyTip] = useState('');
    const [tipLoading, setTipLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        fetchStudyTip();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const userData = getUser();
            setUser(userData);
            const [statsData, activityData] = await Promise.all([
                getUserStats(),
                getActivityTimeline()
            ]);
            setStats(statsData);
            setActivities(activityData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudyTip = async () => {
        setTipLoading(true);
        setStudyTip('');
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    messages: [
                        {
                            role: 'user',
                            content: `Give me one practical, actionable study tip for university students. 
                            Make it specific, evidence-based, and immediately actionable. 
                            Keep it to 2-3 sentences max. 
                            Vary the topic each time — it could be about memory techniques, time management, 
                            focus strategies, group study, exam prep, note-taking, avoiding burnout, 
                            active recall, spaced repetition, sleep and cognition, etc.
                            Do not include any intro like "Here's a tip:" — just give the tip directly.`
                        }
                    ]
                })
            });

            const data = await response.json();
            const tip = data?.content?.[0]?.text || 'Try the Pomodoro Technique: study for 25 minutes, take a 5-minute break, and after 4 cycles take a longer 15-30 minute break.';
            setStudyTip(tip);
        } catch (error) {
            console.error('Error fetching study tip:', error);
            setStudyTip('Try the Pomodoro Technique: study for 25 minutes, take a 5-minute break, and after 4 cycles take a longer 15-30 minute break.');
        } finally {
            setTipLoading(false);
        }
    };

    const insights = [
        { label: 'Connections', value: stats?.connections || '0', icon: Users },
        { label: 'Messages', value: stats?.messages || '0', icon: MessageCircle },
    ];

    const quickActions = [
        { title: 'Quick Chat', description: 'Jump into your recent conversations', icon: MessageCircle, link: '/chat' },
        { title: 'My Connections', description: 'View and manage your network', icon: UserCheck, link: '/connections' },
        { title: 'Discover Students', description: 'Find new study partners with similar interests', icon: Users, link: '/connect' },
        { title: 'Upcoming Events', description: 'View and join academic events', icon: Calendar, link: '/guild' },
    ];

    const getFirstName = () => {
        if (!user?.profile?.full_name) return 'there';
        return user.profile.full_name.split(' ')[0];
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen pt-24 pb-12 px-6 lg:px-8 bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your dashboard...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-12 px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <h1 className="text-5xl tracking-tight mb-2">Welcome back, {getFirstName()}!</h1>
                        <p className="text-xl text-gray-600">Here's what's happening with your study network</p>
                    </motion.div>

                    {/* Insights Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
                    >
                        {insights.map((insight, index) => {
                            const Icon = insight.icon;
                            return (
                                <motion.div
                                    key={insight.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                    className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-600 mb-1">{insight.label}</div>
                                            <div className="text-4xl">{insight.value}</div>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Icon className="w-6 h-6 text-gray-600" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mb-12"
                    >
                        <h2 className="text-2xl tracking-tight mb-6">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {quickActions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <Link key={action.title} to={action.link}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                                            className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="w-12 h-12 mb-6 flex items-center justify-center flex-shrink-0">
                                                <Icon size={40} strokeWidth={1.5} className="text-gray-700 group-hover:text-black transition-colors" />
                                            </div>
                                            <h3 className="text-xl mb-2">{action.title}</h3>
                                            <p className="text-gray-600">{action.description}</p>
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Bottom Section - Recent Activity & Study Tip */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Activity */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="bg-white rounded-2xl p-8 border border-gray-200"
                        >
                            <h2 className="text-2xl tracking-tight mb-6">Recent Activity</h2>
                            {activities.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No recent activity</p>
                            ) : (
                                <div className="space-y-6">
                                    {activities.slice(0, 3).map((activity, index) => {
                                        const iconMap = {
                                            connection: Users,
                                            message: MessageCircle,
                                            goal: BookOpen,
                                            event: Calendar,
                                        };
                                        const Icon = iconMap[activity.activity_type] || Users;
                                        return (
                                            <motion.div
                                                key={activity.activity_id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                                                className="flex items-start space-x-4"
                                            >
                                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Icon className="w-5 h-5 text-gray-700" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-gray-900">
                                                        <span className="text-gray-600">{activity.action}</span>
                                                    </p>
                                                    {activity.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">{activity.time_ago}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>

                        {/* Study Tip of the Day */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="bg-black text-white rounded-2xl p-8 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-2">
                                    <BookOpen className="w-6 h-6" />
                                    <h2 className="text-2xl tracking-tight">Study Tip</h2>
                                </div>
                                <button
                                    onClick={fetchStudyTip}
                                    disabled={tipLoading}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                                    title="Get a new tip"
                                >
                                    <RefreshCw className={`w-4 h-4 ${tipLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            <div className="flex-1">
                                {tipLoading ? (
                                    <div className="space-y-2">
                                        <div className="h-4 bg-white/10 rounded animate-pulse w-full" />
                                        <div className="h-4 bg-white/10 rounded animate-pulse w-5/6" />
                                        <div className="h-4 bg-white/10 rounded animate-pulse w-4/6" />
                                    </div>
                                ) : (
                                    <motion.p
                                        key={studyTip}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                        className="text-gray-300 leading-relaxed"
                                    >
                                        {studyTip}
                                    </motion.p>
                                )}
                            </div>

                            {!tipLoading && (
                                <p className="text-xs text-gray-600 mt-6">
                                    Click ↺ to get a new tip
                                </p>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}