import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Pause, RotateCcw, ArrowLeft, Timer } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../Navbar';

export default function StudyMode() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stopwatchTime, setStopwatchTime] = useState(0);
    const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
    
    // Timer state
    const [timerDuration, setTimerDuration] = useState(25 * 60); // Default 25 minutes (Pomodoro)
    const [timerRemaining, setTimerRemaining] = useState(25 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerInput, setTimerInput] = useState({ hours: 0, minutes: 25, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let interval;
        if (isStopwatchRunning) {
            interval = setInterval(() => {
                setStopwatchTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isStopwatchRunning]);

    // Timer countdown effect
    useEffect(() => {
        let interval;
        if (isTimerRunning && timerRemaining > 0) {
            interval = setInterval(() => {
                setTimerRemaining((prev) => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        // Play notification sound or alert
                        if (Notification.permission === 'granted') {
                            new Notification('Study Timer', { body: 'Time is up! Take a break.' });
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timerRemaining]);

    const formatStopwatchTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleToggleStopwatch = () => {
        setIsStopwatchRunning(!isStopwatchRunning);
    };

    const handleResetStopwatch = () => {
        setStopwatchTime(0);
        setIsStopwatchRunning(false);
    };

    const handleTimerInputChange = (field, value) => {
        const numValue = Math.max(0, parseInt(value) || 0);
        const maxValue = field === 'hours' ? 23 : 59;
        const clampedValue = Math.min(numValue, maxValue);
        setTimerInput((prev) => ({ ...prev, [field]: clampedValue }));
    };

    const handleSetTimer = () => {
        const totalSeconds = timerInput.hours * 3600 + timerInput.minutes * 60 + timerInput.seconds;
        if (totalSeconds > 0) {
            setTimerDuration(totalSeconds);
            setTimerRemaining(totalSeconds);
            setIsTimerRunning(false);
        }
    };

    const handleToggleTimer = () => {
        if (timerRemaining > 0) {
            setIsTimerRunning(!isTimerRunning);
        }
    };

    const handleResetTimer = () => {
        setTimerRemaining(timerDuration);
        setIsTimerRunning(false);
    };

    const presetTimers = [
        { label: '25 min', minutes: 25 },
        { label: '45 min', minutes: 45 },
        { label: '1 hour', minutes: 60 },
    ];

    const handlePresetTimer = (minutes) => {
        const totalSeconds = minutes * 60;
        setTimerDuration(totalSeconds);
        setTimerRemaining(totalSeconds);
        setTimerInput({ hours: Math.floor(minutes / 60), minutes: minutes % 60, seconds: 0 });
        setIsTimerRunning(false);
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6 lg:px-8 flex items-center justify-center">
                <div className="w-full max-w-5xl">
                    {/* Back button */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <Button
                            onClick={() => navigate('/profile')}
                            variant="outline"
                            className="border-gray-300 hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Profile
                        </Button>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-5xl tracking-tight mb-3">Study Mode</h1>
                        <p className="text-xl text-gray-600">
                            Stay focused and track your study time
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Current Time */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-white border border-gray-200 rounded-3xl p-8 text-center hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-center mb-4">
                                <Clock className="w-8 h-8 text-gray-900" />
                            </div>
                            <h2 className="text-xl mb-6 text-gray-600 tracking-tight">Current Time</h2>
                            <div className="text-5xl mb-4 text-gray-900 tracking-tight tabular-nums font-mono">
                                {currentTime.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false,
                                })}
                            </div>
                            <div className="text-sm text-gray-500">
                                {currentTime.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </div>
                        </motion.div>

                        {/* Stopwatch */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="bg-white border border-gray-200 rounded-3xl p-8 text-center hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-8 h-8 rounded-full border-2 border-gray-900 flex items-center justify-center">
                                    <Play className="w-4 h-4 text-gray-900" />
                                </div>
                            </div>
                            <h2 className="text-xl mb-6 text-gray-600 tracking-tight">Stopwatch</h2>
                            <div className="text-5xl mb-8 text-gray-900 tracking-tight tabular-nums font-mono">
                                {formatStopwatchTime(stopwatchTime)}
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleToggleStopwatch}
                                    className={`w-full ${isStopwatchRunning ? 'bg-gray-700 hover:bg-gray-600' : 'bg-black hover:bg-gray-900'} text-white`}
                                    size="lg"
                                >
                                    {isStopwatchRunning ? (
                                        <>
                                            <Pause className="w-5 h-5 mr-2" />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            Start
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleResetStopwatch}
                                    variant="outline"
                                    size="lg"
                                    className="w-full border-gray-300 hover:bg-gray-50"
                                >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Reset
                                </Button>
                            </div>
                        </motion.div>

                        {/* Timer */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="bg-white border border-gray-200 rounded-3xl p-8 text-center hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-center mb-4">
                                <Timer className="w-8 h-8 text-gray-900" />
                            </div>
                            <h2 className="text-xl mb-4 text-gray-600 tracking-tight">Countdown Timer</h2>
                            
                            {/* Timer Display */}
                            <div className={`text-5xl mb-4 tracking-tight tabular-nums font-mono ${timerRemaining === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                {formatStopwatchTime(timerRemaining)}
                            </div>

                            {/* Preset buttons */}
                            <div className="flex gap-2 mb-4 justify-center">
                                {presetTimers.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => handlePresetTimer(preset.minutes)}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom time input */}
                            <div className="flex gap-2 mb-4 justify-center items-center">
                                <div className="flex flex-col items-center">
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={timerInput.hours}
                                        onChange={(e) => handleTimerInputChange('hours', e.target.value)}
                                        className="w-14 h-10 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    />
                                    <span className="text-xs text-gray-500 mt-1">hrs</span>
                                </div>
                                <span className="text-xl text-gray-400 mb-4">:</span>
                                <div className="flex flex-col items-center">
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={timerInput.minutes}
                                        onChange={(e) => handleTimerInputChange('minutes', e.target.value)}
                                        className="w-14 h-10 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    />
                                    <span className="text-xs text-gray-500 mt-1">min</span>
                                </div>
                                <span className="text-xl text-gray-400 mb-4">:</span>
                                <div className="flex flex-col items-center">
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={timerInput.seconds}
                                        onChange={(e) => handleTimerInputChange('seconds', e.target.value)}
                                        className="w-14 h-10 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    />
                                    <span className="text-xs text-gray-500 mt-1">sec</span>
                                </div>
                                <Button
                                    onClick={handleSetTimer}
                                    variant="outline"
                                    size="sm"
                                    className="mb-4 ml-2"
                                >
                                    Set
                                </Button>
                            </div>

                            {/* Timer controls */}
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleToggleTimer}
                                    disabled={timerRemaining === 0}
                                    className={`w-full ${isTimerRunning ? 'bg-gray-700 hover:bg-gray-600' : 'bg-black hover:bg-gray-900'} text-white disabled:opacity-50`}
                                    size="lg"
                                >
                                    {isTimerRunning ? (
                                        <>
                                            <Pause className="w-5 h-5 mr-2" />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            Start
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleResetTimer}
                                    variant="outline"
                                    size="lg"
                                    className="w-full border-gray-300 hover:bg-gray-50"
                                >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Reset
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Study Tips */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mt-8 p-8 bg-white border border-gray-200 rounded-3xl"
                    >
                        <h3 className="text-xl mb-4 text-gray-900">Study Tips</h3>
                        <ul className="space-y-3 text-gray-700">
                            <li className="flex items-start">
                                <span className="w-2 h-2 bg-gray-900 rounded-full mt-2 mr-3 flex-shrink-0" />
                                <span>Take a 5–10 minute break every hour to maintain focus and avoid mental fatigue.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-2 h-2 bg-gray-900 rounded-full mt-2 mr-3 flex-shrink-0" />
                                <span>Eliminate distractions and create a dedicated, consistent study space.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-2 h-2 bg-gray-900 rounded-full mt-2 mr-3 flex-shrink-0" />
                                <span>Stay hydrated, maintain good posture, and review notes within 24 hours of a lecture.</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </>
    );
}