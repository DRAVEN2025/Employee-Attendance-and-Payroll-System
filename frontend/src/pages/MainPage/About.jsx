import { motion } from "framer-motion";

const About = () => {
  const objectives = [
    {
      title: 'Automate Tracking',
      desc: 'To automate the tracking of employee work hours, leaves, and overtime in real-time.',
      icon: '⚡'
    },
    {
      title: 'Eliminate Errors',
      desc: 'To eliminate errors in payroll calculation by automatically generating salaries based on attendance data.',
      icon: '✅'
    },
    {
      title: 'Simplify Leave Management',
      desc: 'To simplify leave management by providing a transparent process for employees to request and managers to approve time off.',
      icon: '📋'
    },
    {
      title: 'Ensure Compliance',
      desc: 'To ensure compliance with labor laws and generate necessary reports for management and authorities.',
      icon: '⚖️'
    },
    {
      title: 'Improve Efficiency',
      desc: 'To improve overall organizational efficiency by reducing administrative tasks and providing clear insights into workforce data.',
      icon: '📈'
    },
    {
      title: 'Enhance Transparency',
      desc: 'To create a transparent system that builds employee trust through accurate and timely compensation.',
      icon: '🔍'
    }
  ];

  const teamMembers = [
    {
      name: 'Gerald Kennydy Llona',
      role: 'Developer',
      image: '/developers_images/llona.jpg'
    },
    {
      name: 'Christian King Cua',
      role: 'Developer',
      image: '/developers_images/cua.jpg'
    },
    {
      name: 'Lawrence Sanota',
      role: 'Developer',
      image: '/developers_images/sanota.jpg'
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

  const cardVariants = {
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

  const teamCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.05,
      y: -3,
      transition: {
        duration: 0.3,
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
        {/* Hero Section */}
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
            About Our System
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            A comprehensive web-based solution that automates employee attendance tracking 
            and payroll processing to streamline human resource management and ensure accurate, 
            timely compensation for employees.
          </motion.p>
        </motion.div>

        {/* System Overview */}
        <motion.div 
          className="py-8"
          variants={containerVariants}
        >
          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <motion.h2 
              className="text-3xl font-bold text-center text-gray-800 mb-8"
              variants={itemVariants}
            >
              System Overview
            </motion.h2>
            <motion.div 
              className="space-y-6 text-gray-600 text-lg leading-relaxed"
              variants={containerVariants}
            >
              <motion.p variants={itemVariants}>
                Our Employee Attendance and Payroll System is designed to address the critical 
                needs of modern organizations by providing an integrated platform that combines 
                real-time attendance monitoring with automated payroll processing.
              </motion.p>
              
              <motion.p variants={itemVariants}>
                The system features automated attendance recording through web-based clock-in/clock-out 
                functionality, eliminating manual time tracking and reducing errors. It seamlessly 
                integrates attendance data with payroll management to ensure accurate calculation 
                of salaries, accounting for work hours, overtime, deductions, bonuses, and taxes.
              </motion.p>

              <motion.p variants={itemVariants}>
                Additional features include a comprehensive leave management system where employees 
                can request time off and managers can approve or reject requests electronically. 
                The platform also ensures compliance with labor regulations and generates detailed 
                reports for management analysis and regulatory requirements.
              </motion.p>

              <motion.p variants={itemVariants}>
                With an intuitive user interface, employees can easily view their attendance history, 
                leave balances, and salary details, while HR teams can efficiently manage and monitor 
                workforce data in real-time.
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Objectives */}
        <motion.div 
          className="py-8"
          variants={containerVariants}
        >
          <motion.h2 
            className="text-3xl font-bold text-center text-gray-800 mb-12"
            variants={itemVariants}
          >
            Our Objectives
          </motion.h2>
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
          >
            {objectives.map((objective, idx) => (
              <motion.div
                key={idx}
                variants={cardVariants}
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
                  {objective.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{objective.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{objective.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Team Section */}
        <motion.div 
          className="py-12 text-center"
          variants={containerVariants}
        >
          <motion.h2 
            className="text-3xl font-bold text-gray-800 mb-12"
            variants={itemVariants}
          >
            Development Team
          </motion.h2>
          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            variants={containerVariants}
          >
            {teamMembers.map((member, idx) => (
              <motion.div
                key={idx}
                variants={teamCardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-200"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-gray-300">
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl text-gray-600 font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{member.name}</h3>
                <p className="text-gray-600 font-medium">{member.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Instructor Section */}
        <motion.div 
          className="py-8 text-center"
          variants={containerVariants}
        >
          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto shadow-sm border border-gray-200"
            variants={teamCardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <motion.h3 
              className="text-2xl font-semibold text-gray-800 mb-4"
              variants={itemVariants}
            >
              IT Instructor
            </motion.h3>
            <motion.p 
              className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent"
              variants={itemVariants}
            >
              Mr. Timothy Reginaldo
            </motion.p>
            <motion.p 
              className="text-gray-600 mt-2"
              variants={itemVariants}
            >
              Application Development and Systems Integration & Architecture 1 Instructor
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default About;