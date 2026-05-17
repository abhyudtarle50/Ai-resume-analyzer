import React, { useState } from 'react';
import { HiOutlineDocumentText, HiOutlineClipboardCopy, HiCheck } from 'react-icons/hi';
import './SampleResumes.css';

const resumes = {
  fullstack: {
    title: 'Fullstack (Rahul)',
    content: `Rahul Sharma
Full Stack Developer
Email: rahul.sharma@example.com | Phone: +91-9876543210
Location: Bangalore, India

SUMMARY
Passionate Full Stack Developer with 4 years of experience building scalable web applications using the MERN stack. Proven ability to design and implement robust architectures and user-friendly interfaces.

SKILLS
Frontend: React, Redux, Next.js, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express.js, GraphQL, REST APIs
Databases: MongoDB, PostgreSQL, Redis
Tools: Git, Docker, AWS (EC2, S3), Webpack, Jest

EXPERIENCE
Software Engineer | TechNova Solutions | Bangalore, India | Jan 2021 - Present
- Developed a high-traffic e-commerce platform using React and Node.js, increasing sales by 25%.
- Implemented state management using Redux, improving application performance and scalability.
- Designed and optimized RESTful APIs, reducing database query times by 30%.
- Integrated third-party payment gateways (Stripe, Razorpay) for secure transactions.

Junior Web Developer | WebCraft Inc. | Pune, India | Jun 2019 - Dec 2020
- Built and maintained responsive user interfaces using React and Tailwind CSS.
- Collaborated with UX designers to translate wireframes into interactive components.
- Wrote unit and integration tests using Jest and React Testing Library.

EDUCATION
Bachelor of Technology in Computer Science
XYZ University, Pune, India | 2015 - 2019
CGPA: 8.5/10

PROJECTS
Task Manager App: A full-stack productivity tool with real-time collaboration using WebSockets, React, and Express.
Portfolio Generator: A web app allowing users to generate beautiful portfolios using Next.js and Tailwind CSS.`
  },
  devops: {
    title: 'DevOps (Ankit)',
    content: `Ankit Patel
DevOps Engineer
Email: ankit.patel@example.com | Phone: +91-8765432109
Location: Pune, India

SUMMARY
Results-driven DevOps Engineer with 3+ years of experience automating, securing, and scaling cloud infrastructure. Adept at creating CI/CD pipelines and managing containerized applications to ensure seamless deployment and high availability.

SKILLS
Cloud Platforms: AWS (EC2, EKS, S3, RDS), Azure
Containerization & Orchestration: Docker, Kubernetes
CI/CD: Jenkins, GitHub Actions, GitLab CI
Infrastructure as Code (IaC): Terraform, Ansible, CloudFormation
Monitoring & Logging: Prometheus, Grafana, ELK Stack
Scripting: Python, Bash

EXPERIENCE
DevOps Engineer | CloudScale Inc. | Pune, India | Mar 2021 - Present
- Architected and deployed scalable Kubernetes clusters on AWS EKS, reducing infrastructure costs by 20%.
- Automated CI/CD pipelines using Jenkins and GitHub Actions, cutting deployment time from hours to minutes.
- Implemented Infrastructure as Code (IaC) using Terraform for consistent environments across Dev, QA, and Prod.
- Set up proactive monitoring and alerting using Prometheus and Grafana, improving system uptime to 99.99%.

System Administrator | NetSys Tech | Mumbai, India | Jul 2019 - Feb 2021
- Managed Linux servers (Ubuntu, CentOS) and ensured security patching and routine backups.
- Wrote Bash and Python scripts to automate routine administrative tasks.
- Assisted in the migration of on-premise applications to AWS cloud infrastructure.

EDUCATION
Bachelor of Engineering in Information Technology
ABC Institute of Technology, Mumbai, India | 2015 - 2019
CGPA: 8.2/10

CERTIFICATIONS
AWS Certified Solutions Architect – Associate
Certified Kubernetes Administrator (CKA)`
  }
};

const SampleResumes = () => {
  const [activeTab, setActiveTab] = useState('fullstack');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resumes[activeTab].content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="sample-resumes">
      <div className="sample-resumes__header">
        <h3 className="sample-resumes__title">
          <HiOutlineDocumentText className="sample-resumes__icon" />
          Try a Sample Resume
        </h3>
        <p className="sample-resumes__subtitle">
          Don't have a resume handy? Copy one of these samples and paste it above to see the analysis in action.
        </p>
      </div>

      <div className="sample-resumes__tabs">
        {Object.keys(resumes).map((key) => (
          <button
            key={key}
            className={`sample-resumes__tab ${activeTab === key ? 'sample-resumes__tab--active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {resumes[key].title}
          </button>
        ))}
      </div>

      <div className="sample-resumes__content-wrapper">
        <div className="sample-resumes__actions">
          <button 
            className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'} sample-resumes__copy-btn`}
            onClick={handleCopy}
          >
            {copied ? (
              <><HiCheck /> Copied!</>
            ) : (
              <><HiOutlineClipboardCopy /> Copy Text</>
            )}
          </button>
        </div>
        <textarea
          className="sample-resumes__textarea"
          value={resumes[activeTab].content}
          readOnly
        />
      </div>
    </div>
  );
};

export default SampleResumes;
