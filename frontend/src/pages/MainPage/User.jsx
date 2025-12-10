import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";

const User = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [userType, setUserType] = useState("")
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [adminVerifierUsername, setAdminVerifierUsername] = useState("")
  const [adminVerifierPassword, setAdminVerifierPassword] = useState("")
  const [showAdminVerifierPassword, setShowAdminVerifierPassword] = useState(false)
  const [hasAdminVerifier, setHasAdminVerifier] = useState(false)
  const [adminVerified, setAdminVerified] = useState(false)
  const [adminVerificationLoading, setAdminVerificationLoading] = useState(false)

  const apiSignUp = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/UserData/signup.php?action=signup';
  const apiSignIn = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/UserData/signin.php?action=signin';
  const apiCheckAdminVerifier = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/UserData/signup.php?action=check_admin_verifier';
  const apiVerifyAdminCredentials = 'http://localhost:80/Employee_Attendance_and_Payroll_System/backend/UserData/signup.php?action=verify_admin_credentials';

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
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    tap: { scale: 0.95 },
  };

  const inputVariants = {
    focus: {
      scale: 1.02,
      transition: {
        duration: 0.2,
      },
    },
  };

  const adminVerificationVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  };

  useEffect(() => {
    if (isSignUpMode && userType === 'Admin') {
      checkAdminVerifier();
    }
  }, [isSignUpMode, userType]);

  const checkAdminVerifier = async () => {
    try {
      const response = await axios.get(apiCheckAdminVerifier);
      if (response.data.type === 'success') {
        setHasAdminVerifier(response.data.hasAdminVerifier);
      }
    } catch (error) {
      console.error("Error checking admin verifier:", error);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  }

  const clearAllFields = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setUserType("");
    setAdminVerifierUsername("");
    setAdminVerifierPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowAdminVerifierPassword(false);
    setAdminVerified(false);
  }

  const handleAdminVerification = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!adminVerifierUsername || !adminVerifierPassword) {
      setError("Admin verification credentials are required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setAdminVerificationLoading(true);

    try {
      const response = await axios.post(apiVerifyAdminCredentials, {
        username: adminVerifierUsername,
        password: adminVerifierPassword
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.type === 'success') {
        setSuccess("Admin verification successful! You can now create your admin account.");
        setTimeout(() => setSuccess(""), 3000);
        setAdminVerified(true);
      } else {
        setError(response.data.message);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Admin verification error:", err);
      setError("Invalid admin verification credentials");
      setTimeout(() => setError(""), 3000);
    } finally {
      setAdminVerificationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearMessages();
    
    if (isSignUpMode) {
      if (userType === 'Admin' && !adminVerified) {
        setError("Please complete admin verification first");
        setTimeout(() => setError(""), 3000);
        return;
      }

      if (!userType) {
        setError("Please select a user type");
        setTimeout(() => setError(""), 3000);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setTimeout(() => setError(""), 3000);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        setTimeout(() => setError(""), 3000);
        return;
      }

      setLoading(true);
      
      try {
        const signupData = {
          username,
          email,
          password,
          user_type: userType
        };

        if (userType === 'Admin' && adminVerified) {
          signupData.admin_verifier_username = adminVerifierUsername;
          signupData.admin_verifier_password = adminVerifierPassword;
        }

        const response = await axios.post(apiSignUp, signupData, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.type === 'success') {
          setSuccess(response.data.message);
          setTimeout(() => setSuccess(""), 3000);
          clearAllFields();
          
          if (userType === 'Admin') {
            setTimeout(() => {
              setLoading(true);
              axios.post(apiSignIn, {
                username,
                password
              }, {
                headers: {
                  'Content-Type': 'application/json',
                }
              }).then(loginResponse => {
                if (loginResponse.data.type === 'success') {
                  localStorage.setItem('user_id', loginResponse.data.user_id);
                  localStorage.setItem('username', loginResponse.data.username);
                  localStorage.setItem('email', loginResponse.data.email || '');
                  localStorage.setItem('user_type', loginResponse.data.user_type || '');
                  localStorage.setItem('isLoggedIn', 'true');

                  setSuccess("Account created successfully! Redirecting...");
                  setTimeout(() => setSuccess(""), 3000);
                  
                  setTimeout(() => {
                    navigate("/admin/dashboard");
                  }, 1000);
                } else {
                  setError("Account created but automatic login failed. Please sign in manually.");
                  setTimeout(() => setError(""), 3000);
                  setIsSignUpMode(false);
                }
              }).catch(loginError => {
                console.error("Auto-login error:", loginError);
                setError("Account created but automatic login failed. Please sign in manually.");
                setTimeout(() => setError(""), 3000);
                setIsSignUpMode(false);
              }).finally(() => {
                setLoading(false);
              });
            }, 1500);
          } else {
            if (response.data.was_rejected) {
              setSuccess("Your previous rejected application has been resubmitted successfully! Please wait for admin approval.");
              setTimeout(() => setSuccess(""), 3000);
            } else {
              setSuccess("Employee account created successfully! Please wait for approval.");
              setTimeout(() => setSuccess(""), 3000);
            }
            setIsSignUpMode(false);
            setLoading(false);
          }
        } else {
          setError(response.data.message);
          setTimeout(() => setError(""), 3000);
          setLoading(false);
        }
      } catch (err) {
        console.error("Sign up error:", err);
        setError("An error occurred during registration. Please try again.");
        setTimeout(() => setError(""), 3000);
        setLoading(false);
      }
    } else {
      if (!username || !password) {
        setError("Username and password are required");
        setTimeout(() => setError(""), 3000);
        return;
      }

      setLoading(true);
      
      try {
        const response = await axios.post(apiSignIn, {
          username,
          password
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.type === 'success') {
          localStorage.setItem('user_id', response.data.user_id);
          localStorage.setItem('username', response.data.username);
          localStorage.setItem('email', response.data.email || '');
          localStorage.setItem('user_type', response.data.user_type || '');
          localStorage.setItem('isLoggedIn', 'true');

          setSuccess("Sign in successful! Redirecting...");
          setTimeout(() => setSuccess(""), 3000);
          
          setTimeout(() => {
            if (response.data.user_type === 'Admin') {
              navigate("/admin/dashboard");
            } else {
              navigate("/employee/dashboard");
            }
          }, 1000);
        } else {
          if (response.data.message.includes('inactive')) {
            setError(response.data.message);
            setTimeout(() => setError(""), 3000);
          } else {
            setError(response.data.message);
            setTimeout(() => setError(""), 3000);
          }
        }
      } catch (err) {
        console.error("Sign in error:", err);
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
          setTimeout(() => setError(""), 3000);
        } else {
          setError("An error occurred during sign in. Please try again.");
          setTimeout(() => setError(""), 3000);
        }
      } finally {
        setLoading(false);
      }
    }
  }

  const toggleMode = () => {
    clearMessages();
    clearAllFields();
    setIsSignUpMode(!isSignUpMode)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const toggleAdminVerifierPasswordVisibility = () => {
    setShowAdminVerifierPassword(!showAdminVerifierPassword)
  }

  const handleUserTypeChange = (value) => {
    setUserType(value);
    setAdminVerified(false);
    if (value !== 'Admin') {
      setAdminVerifierUsername("");
      setAdminVerifierPassword("");
    }
  }

  return (
    <motion.div 
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden relative"
        variants={cardVariants}
      >
        
        {/* Left Section - Form */}
        <motion.div 
          className={`w-full md:w-3/5 p-8 md:p-12 transition-transform duration-700 ease-in-out ${
            isSignUpMode ? 'md:translate-x-[66.666%]' : 'md:translate-x-0'
          }`}
          variants={containerVariants}
        >
          <motion.div 
            className="text-center mb-8"
            variants={itemVariants}
          >
            <motion.h2 
              className="text-3xl font-bold text-gray-800 mb-2 transition-all duration-300 transform hover:scale-105"
              variants={itemVariants}
            >
              {isSignUpMode ? "Create Account" : "Sign In to Account"}
            </motion.h2>
            <motion.div 
              className="inline-block w-10 h-1 bg-purple-600 rounded-full transition-all duration-500 transform hover:scale-125"
              variants={itemVariants}
            ></motion.div>
          </motion.div>

          {/* Error and Success Messages */}
          <motion.div variants={itemVariants}>
            {error && (
              <motion.div 
                className={`mb-4 p-3 border rounded-lg transition-all duration-300 ${
                  error.includes('inactive') 
                    ? 'bg-yellow-100 border-yellow-400 text-yellow-700' 
                    : 'bg-red-100 border-red-400 text-red-700'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error}
                {error.includes('inactive') && (
                  <div className="mt-2 text-sm">
                    Please contact your administrator to activate your account.
                  </div>
                )}
              </motion.div>
            )}
            {success && (
              <motion.div 
                className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg transition-all duration-300"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {success}
              </motion.div>
            )}
          </motion.div>

          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            variants={containerVariants}
          >
            {/* Sign In Form */}
            {!isSignUpMode && (
              <motion.div 
                className="space-y-6 animate-fadeIn"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  className="relative"
                  variants={itemVariants}
                >
                  <motion.input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '');
                      setUsername(value);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === ' ') {
                        e.preventDefault();
                      }
                    }}
                    className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all duration-300 transform hover:scale-[1.02] text-gray-800"
                    placeholder=" "
                    whileFocus="focus"
                    variants={inputVariants}
                  />
                  <label 
                    htmlFor="username"
                    className={`absolute left-4 transition-all duration-300 pointer-events-none bg-white px-1 ${
                      username ? '-top-2 text-sm text-purple-600' : 'top-3 text-gray-500'
                    } peer-focus:-top-2 peer-focus:text-sm peer-focus:text-purple-600`}
                  >
                    Username
                  </label>
                </motion.div>

                <motion.div 
                  className="relative"
                  variants={itemVariants}
                >
                  <motion.input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all duration-300 transform hover:scale-[1.02] text-gray-800"
                    placeholder=" "
                    whileFocus="focus"
                    variants={inputVariants}
                  />
                  <label 
                    htmlFor="password"
                    className={`absolute left-4 transition-all duration-300 pointer-events-none bg-white px-1 ${
                      password ? '-top-2 text-sm text-purple-600' : 'top-3 text-gray-500'
                    } peer-focus:-top-2 peer-focus:text-sm peer-focus:text-purple-600`}
                  >
                    Password
                  </label>
                  
                  <motion.button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors duration-300 focus:outline-none"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? (
                      <EyeOff size={20} className="transition-all duration-300" />
                    ) : (
                      <Eye size={20} className="transition-all duration-300" />
                    )}
                  </motion.button>
                </motion.div>

                <motion.div 
                  className="flex justify-between items-center"
                  variants={itemVariants}
                >
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 transition-all duration-300" 
                    />
                    <span className="ml-2 text-gray-600">Remember me</span>
                  </label>
                  <motion.a 
                    href="#" 
                    className="text-purple-600 hover:text-purple-800 transition-colors duration-300 transform hover:scale-105"
                    whileHover={{ scale: 1.05 }}
                  >
                    Forgot password?
                  </motion.a>
                </motion.div>
              </motion.div>
            )}

            {/* Sign Up Form */}
            {isSignUpMode && (
              <motion.div 
                className="space-y-6 animate-fadeIn"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  className="relative"
                  variants={itemVariants}
                >
                  <motion.select
                    id="userType"
                    name="userType"
                    value={userType}
                    onChange={(e) => handleUserTypeChange(e.target.value)}
                    disabled={adminVerified}
                    className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 transform bg-white text-gray-800 ${
                      adminVerified 
                        ? 'border-purple-400 bg-purple-50 cursor-not-allowed opacity-75' 
                        : 'border-gray-300 focus:border-purple-600 hover:scale-[1.02]'
                    }`}
                    whileFocus="focus"
                    variants={inputVariants}
                  >
                    <option value="" disabled>Select Role</option>
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                  </motion.select>
                  <label 
                    htmlFor="userType"
                    className={`absolute left-4 transition-all duration-300 pointer-events-none bg-white px-1 ${
                      userType ? '-top-2 text-sm text-purple-600' : 'top-3 text-gray-500'
                    } peer-focus:-top-2 peer-focus:text-sm peer-focus:text-purple-600`}
                  >
                    Select Role
                  </label>
                  {adminVerified && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </motion.div>

                {/* Admin Verification Section */}
                {userType === 'Admin' && !adminVerified && (
                  <motion.div 
                    className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50"
                    variants={adminVerificationVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.h3 
                      className="text-lg font-semibold text-purple-800 mb-3"
                      variants={itemVariants}
                    >
                      Admin Verification Required
                    </motion.h3>
                    <motion.p 
                      className="text-sm text-purple-600 mb-4"
                      variants={itemVariants}
                    >
                      {hasAdminVerifier 
                        ? "Please enter admin verification credentials to proceed with admin registration."
                        : "No admin verifier found. Please create admin verification credentials for security."
                      }
                    </motion.p>
                    
                    <motion.div 
                      className="space-y-4"
                      variants={containerVariants}
                    >
                      <motion.div 
                        className="relative"
                        variants={itemVariants}
                      >
                        <motion.input
                          type="text"
                          value={adminVerifierUsername}
                          onChange={(e) => setAdminVerifierUsername(e.target.value)}
                          className="peer w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all duration-300 transform hover:scale-[1.02] text-gray-800"
                          placeholder=" "
                          whileFocus="focus"
                          variants={inputVariants}
                        />
                        <label 
                          className={`absolute left-4 transition-all duration-300 pointer-events-none bg-purple-50 px-1 ${
                            adminVerifierUsername ? '-top-2 text-sm text-purple-600' : 'top-3 text-purple-500'
                          } peer-focus:-top-2 peer-focus:text-sm peer-focus:text-purple-600`}
                        >
                          {hasAdminVerifier ? "Admin Verifier Username" : "Create Admin Verifier Username"}
                        </label>
                      </motion.div>

                      <motion.div 
                        className="relative"
                        variants={itemVariants}
                      >
                        <motion.input
                          type={showAdminVerifierPassword ? "text" : "password"}
                          value={adminVerifierPassword}
                          onChange={(e) => setAdminVerifierPassword(e.target.value)}
                          className="peer w-full px-4 py-3 pr-12 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all duration-300 transform hover:scale-[1.02] text-gray-800"
                          placeholder=" "
                          whileFocus="focus"
                          variants={inputVariants}
                        />
                        <label 
                          className={`absolute left-4 transition-all duration-300 pointer-events-none bg-purple-50 px-1 ${
                            adminVerifierPassword ? '-top-2 text-sm text-purple-600' : 'top-3 text-purple-500'
                          } peer-focus:-top-2 peer-focus:text-sm peer-focus:text-purple-600`}
                        >
                          {hasAdminVerifier ? "Admin Verifier Password" : "Create Admin Verifier Password"}
                        </label>
                        
                        <motion.button
                          type="button"
                          onClick={toggleAdminVerifierPasswordVisibility}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700 transition-colors duration-300 focus:outline-none"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showAdminVerifierPassword ? (
                            <EyeOff size={20} className="transition-all duration-300" />
                          ) : (
                            <Eye size={20} className="transition-all duration-300" />
                          )}
                        </motion.button>
                      </motion.div>

                      <motion.button
                        onClick={handleAdminVerification}
                        disabled={adminVerificationLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        {adminVerificationLoading ? 'VERIFYING...' : 'VERIFY ADMIN CREDENTIALS'}
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}

                {/* Regular Signup Form Fields */}
                {(userType !== 'Admin' || (userType === 'Admin' && adminVerified)) && (
                  <motion.div 
                    className="space-y-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div 
                      className="relative"
                      variants={itemVariants}
                    >
                      <motion.input
                        id="signup-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          setUsername(value);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === ' ') {
                            e.preventDefault();
                          }
                        }}
                        className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all duration-300 transform hover:scale-[1.02] text-gray-800 bg-white"
                        placeholder=" "
                        whileFocus="focus"
                        variants={inputVariants}
                      />
                      <label 
                        htmlFor="signup-username"
                        className={`absolute left-4 transition-all duration-300 pointer-events-none bg-white px-1 ${
                          username ? '-top-2 text-sm text-purple-600' : 'top-3 text-gray-500'
                        } peer-focus:-top-2 peer-focus:text-sm peer-focus:text-purple-600`}
                      >
                        Username
                      </label>
                    </motion.div>

                    <motion.div 
                      className="relative"
                      variants={itemVariants}
                    >
                      <motion.input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all duration-300 transform hover:scale-[1.02] text-gray-800 bg-white"
                        placeholder=" "
                        whileFocus="focus"
                        variants={inputVariants}
                      />
                      <label 
                        htmlFor="email"
                        className={`absolute left-4 transition-all duration-300 pointer-events-none bg-white px-1 ${
                          email ? '-top-2 text-sm text-purple-600' : 'top-3 text-gray-500'
                        } peer-focus:-top-2 peer-focus:text-sm peer-focus:text-purple-600`}
                      >
                        Email Address
                      </label>
                    </motion.div>

                    <motion.div 
                      className="relative"
                      variants={itemVariants}
                    >
                      <motion.input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="peer w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all duration-300 transform hover:scale-[1.02] text-gray-800 bg-white"
                        placeholder=" "
                        whileFocus="focus"
                        variants={inputVariants}
                      />
                      <label 
                        htmlFor="signup-password"
                        className={`absolute left-4 transition-all duration-300 pointer-events-none bg-white px-1 ${
                          password ? '-top-2 text-sm text-purple-600' : 'top-3 text-gray-500'
                        } peer-focus:-top-2 peer-focus:text-sm peer-focus:text-purple-600`}
                      >
                        Password
                      </label>
                      
                      <motion.button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors duration-300 focus:outline-none"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? (
                          <EyeOff size={20} className="transition-all duration-300" />
                        ) : (
                          <Eye size={20} className="transition-all duration-300" />
                        )}
                      </motion.button>
                    </motion.div>

                    <motion.div 
                      className="relative"
                      variants={itemVariants}
                    >
                      <motion.input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="peer w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all duration-300 transform hover:scale-[1.02] text-gray-800 bg-white"
                        placeholder=" "
                        whileFocus="focus"
                        variants={inputVariants}
                      />
                      <label 
                        htmlFor="confirmPassword"
                        className={`absolute left-4 transition-all duration-300 pointer-events-none bg-white px-1 ${
                          confirmPassword ? '-top-2 text-sm text-purple-600' : 'top-3 text-gray-500'
                        } peer-focus:-top-2 peer-focus:text-sm peer-focus:text-purple-600`}
                      >
                        Confirm Password
                      </label>
                      
                      <motion.button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors duration-300 focus:outline-none"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} className="transition-all duration-300" />
                        ) : (
                          <Eye size={20} className="transition-all duration-300" />
                        )}
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              {loading ? (isSignUpMode ? 'CREATING ACCOUNT...' : 'SIGNING IN...') : (isSignUpMode ? "SIGN UP" : "SIGN IN")}
            </motion.button>
          </motion.form>

          <motion.div 
            className="mt-6 text-center"
            variants={itemVariants}
          >
            <p className="text-sm text-gray-600 transition-all duration-300 hover:text-gray-800">
              {isSignUpMode ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </p>
          </motion.div>

          <motion.div 
            className="mt-6 text-center"
            variants={itemVariants}
          >
            <motion.a 
              href="/" 
              className="text-purple-600 font-semibold hover:text-purple-800 transition-all duration-300 transform hover:scale-105 inline-block"
              whileHover={{ scale: 1.05 }}
            >
              ← Back to Home
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Right Section - Welcome */}
        <motion.div 
          className={`w-full md:w-2/5 md:absolute md:right-0 md:top-0 md:h-full bg-gradient-to-br from-purple-600 to-blue-500 text-white rounded-2xl md:rounded-l-none rounded-t-2xl md:rounded-tl-2xl p-8 md:p-12 flex flex-col justify-center items-center text-center transition-transform duration-700 ease-in-out ${
            isSignUpMode ? 'md:-translate-x-[150%]' : 'md:translate-x-0'
          }`}
          variants={cardVariants}
        >
          <motion.h2 
            className="text-3xl font-bold mb-4 transition-all duration-300 transform hover:scale-105"
            variants={itemVariants}
          >
            {isSignUpMode ? "Welcome Back!" : "Hello, Friend!"}
          </motion.h2>
          <motion.div 
            className="w-12 h-1 bg-white rounded-full mb-6 transition-all duration-500 transform hover:scale-125"
            variants={itemVariants}
          ></motion.div>
          <motion.p 
            className="mb-8 text-lg transition-all duration-300"
            variants={itemVariants}
          >
            {isSignUpMode 
              ? "To keep connected with us please login with your personal information" 
              : "Enter your personal details and start journey with us"}
          </motion.p>
          <motion.button
            type="button"
            className="border-2 border-white rounded-full px-8 py-3 font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
            onClick={toggleMode}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            {isSignUpMode ? "SIGN IN" : "SIGN UP"}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default User;