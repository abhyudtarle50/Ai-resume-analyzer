import React, { useState, useEffect } from "react";
import "./LoadingStepper.css";

const STEPS = [
  { label: "Analyzing Resume...", hint: "Extracting text and structure" },
  { label: "Checking ATS Compatibility...", hint: "Evaluating formats and keywords" },
  { label: "Identifying Missing Skills...", hint: "Finding gaps in your profile" },
  { label: "Generating Career Roadmap...", hint: "Building actionable steps" },
];

const LoadingStepper = () => {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // Fast simulated progress since we only make 1 API call now
    const t1 = setTimeout(() => setCurrentStep(2), 800);
    const t2 = setTimeout(() => setCurrentStep(3), 1600);
    const t3 = setTimeout(() => setCurrentStep(4), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const progressPercent = Math.min((currentStep / STEPS.length) * 100, 100);

  return (
    <div className="loading-stepper-wrapper">
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="loading-stepper" aria-live="polite">
        {STEPS.map((step, index) => {
          const stepNum = index + 1;
          const status = currentStep > stepNum ? "done" : currentStep === stepNum ? "active" : "pending";
          
          return (
            <div key={index} className={`stepper-item stepper-item--${status}`}>
              <div className="stepper-item__icon">
                {status === "done" ? "✓" : status === "active" ? "⏳" : "○"}
              </div>
              <div className="stepper-item__content">
                <p className="stepper-item__label">{step.label}</p>
                {status === "active" && <p className="stepper-item__hint">{step.hint}</p>}
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="sr-only">
        Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.label}
      </p>
    </div>
  );
};

export default LoadingStepper;
