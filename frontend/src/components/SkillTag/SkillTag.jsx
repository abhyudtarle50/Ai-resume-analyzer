/**
 * components/SkillTag/SkillTag.jsx
 * ---------------------------------------------------------------
 * Reusable pill/chip for displaying a single skill.
 *
 * Props
 * -----
 *   label   : string  — skill name
 *   variant : "default" | "success" | "warning" | "info"
 *   icon    : string  — optional emoji prefix
 * ---------------------------------------------------------------
 */

import "./SkillTag.css";

const SkillTag = ({ label, variant = "default", icon }) => (
  <span className={`skill-tag skill-tag--${variant}`}>
    {icon && <span aria-hidden="true">{icon}</span>}
    {label}
  </span>
);

export default SkillTag;
