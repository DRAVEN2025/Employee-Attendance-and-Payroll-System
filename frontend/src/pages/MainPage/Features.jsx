import { motion } from "framer-motion";

const Features = () => {
  const features = [
    {
      title: 'Attendance Management',
      desc: 'Automates the process of recording employee attendance, replacing traditional manual methods. Employees can clock in and out using the web application with real-time data that minimizes errors and reduces manual reconciliation.',
      icon: '⏰'
    },
    {
      title: 'Payroll Processing',
      desc: 'Integrates attendance data with payroll management to ensure accurate calculation of salaries. The system accounts for work hours, overtime, deductions, bonuses, and taxes to compute net pay, eliminating errors and ensuring timely payment.',
      icon: '💰'
    },
    {
      title: 'Leave and Absence Management',
      desc: 'Employees can apply for leaves directly through the system, which managers can approve or reject. Automatically updates attendance records, making leave tracking seamless and transparent.',
      icon: '📅'
    },
    {
      title: 'Compliance and Reporting',
      desc: 'Ensures adherence to labor laws and taxation policies by automating compliance tasks. Generates detailed reports on attendance, payroll, and taxes for authorities or internal analysis.',
      icon: '📊'
    },
    {
      title: 'User-Friendly Interface',
      desc: 'Offers an intuitive interface for HR teams and employees alike. Employees can view attendance history, leave balances, and salary details, while HR teams can easily manage and monitor data.',
      icon: '👥'
    },
    {
      title: 'Real-time Data Tracking',
      desc: 'Automates tracking of employee work hours, leaves, and overtime in real-time, ensuring accuracy and efficiency in workforce management with immediate data updates.',
      icon: '⚡'
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const featureCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.02,
      y: -5,
      boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1)",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const floatingIconVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-[Inter] py-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div 
          className="text-center py-12"
          variants={itemVariants}
        >
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            System Features
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Discover how our comprehensive system streamlines HR operations, 
            eliminates manual errors, and enhances organizational efficiency through intelligent automation
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="py-8"
          variants={containerVariants}
        >
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={featureCardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-200 hover:border-purple-200 transition-all duration-300"
              >
                <motion.div 
                  className="text-3xl mb-4"
                  variants={floatingIconVariants}
                  animate="animate"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Benefits Section */}
        <motion.div 
          className="py-16 text-center"
          variants={containerVariants}
        >
          <motion.h2 
            className="text-3xl font-bold text-gray-800 mb-12"
            variants={itemVariants}
          >
            Key Benefits
          </motion.h2>
          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            variants={containerVariants}
          >
            {[
              { title: "Error Reduction", desc: "Automated calculations eliminate manual errors in payroll processing", icon: "✅" },
              { title: "Time Efficiency", desc: "Reduces administrative tasks and processing time significantly", icon: "⚡" },
              { title: "Compliance Assurance", desc: "Automatically adheres to labor laws and taxation policies", icon: "🛡️" }
            ].map((benefit, idx) => (
              <motion.div 
                key={idx}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="text-2xl mb-3">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Features;