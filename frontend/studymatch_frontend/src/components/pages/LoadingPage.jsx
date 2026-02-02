import { motion } from 'framer-motion';

export function LoadingPage() {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center z-50">
        <div className="text-center">
            <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
            >
            <h1 className="text-6xl tracking-tight mb-4">STUDYMATCH</h1>
            <div className="w-32 h-1 bg-black mx-auto" />
            </motion.div>
            
            {/* Loading Animation */}
            <motion.div
            className="flex items-center justify-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            >
            <motion.div
                className="w-3 h-3 bg-black rounded-full"
                animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
                }}
                transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                }}
            />
            <motion.div
                className="w-3 h-3 bg-black rounded-full"
                animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
                }}
                transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2,
                }}
            />
            <motion.div
                className="w-3 h-3 bg-black rounded-full"
                animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
                }}
                transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4,
                }}
            />
            </motion.div>
            
            <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-gray-600"
            >
            Loading...
            </motion.p>
        </div>
        </div>
    );
}