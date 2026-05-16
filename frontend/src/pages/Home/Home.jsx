import { motion } from "framer-motion";
import React, { memo } from "react";
import { Link } from "react-router-dom";
import { 
  HiSparkles, HiArrowRight, HiShieldCheck, HiOutlineLightningBolt, 
  HiAcademicCap, HiCollection, HiClipboardList, HiOutlineCloudUpload 
} from "react-icons/hi";
import "./Home.css";

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Faster stagger
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const features = [
    { label: "ATS Resume Analysis", icon: <HiShieldCheck /> },
    { label: "Missing Skills Detection", icon: <HiOutlineLightningBolt /> },
    { label: "AI Career Roadmap", icon: <HiSparkles /> },
    { label: "Smart Project Suggestions", icon: <HiCollection /> },
    { label: "Personalized Tutorials", icon: <HiAcademicCap /> },
    { label: "Resume History Tracking", icon: <HiClipboardList /> },
  ];

  const steps = [
    { label: "Upload Resume", icon: <HiOutlineCloudUpload /> },
    { label: "AI Analysis", icon: <HiSparkles /> },
    { label: "Projects & Tutorials", icon: <HiAcademicCap /> },
  ];

  return (
    <div className="home-container">
      <motion.div 
        className="home-hero"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Background decoration */}
        <div className="home-hero__bg">
          <div className="home-hero__blob home-hero__blob--1" />
          <div className="home-hero__blob home-hero__blob--2" />
        </div>

        <motion.div className="home-hero__eyebrow" variants={itemVariants}>
          <HiSparkles /> AI-Powered Career Intelligence
        </motion.div>

        <motion.h1 className="home-hero__title" variants={itemVariants}>
          Optimize Your Resume for the{" "}
          <span className="gradient-text">Modern Job Market</span>
        </motion.h1>

        <motion.p className="home-hero__subtitle" variants={itemVariants}>
          Analyze your resume, identify missing skills, get personalized tutorials, 
          project ideas, and a complete AI-powered career roadmap.
        </motion.p>

        <motion.div className="home-hero__actions" variants={itemVariants}>
          <Link to="/analyze" className="btn btn-primary home-hero__btn home-hero__btn--premium">
            Analyze Resume <HiArrowRight />
          </Link>
        </motion.div>

        {/* Feature Highlights - Horizontal */}
        <motion.div className="feature-highlights" variants={itemVariants}>
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <span className="feature-item__icon">{feature.icon}</span>
              <span className="feature-item__text">{feature.label}</span>
            </div>
          ))}
        </motion.div>

        {/* How It Works - Row */}
        <motion.div className="how-it-works" variants={itemVariants}>
          <h2 className="how-it-works__title">How it works</h2>
          <div className="how-it-works__row">
            {steps.map((step, index) => (
              <div key={index} className="how-it-works__step">
                <div className="how-it-works__icon-box">
                  {step.icon}
                </div>
                <span className="how-it-works__label">{step.label}</span>
                {index < steps.length - 1 && (
                  <div className="how-it-works__connector" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default memo(Home);
