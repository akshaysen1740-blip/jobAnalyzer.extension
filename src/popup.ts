import { renderJobAnalysis } from "./ui";

const sampleJob = {
  title: "Full Stack Developer",
  company: "Proofofskill",
  location: "Remote",

  qualification: "Bachelor's degree in Computer Science",

  experience: {
    min: 1,
    max: 3,
  },

  seniority: "Junior / Mid-level",

  technologies: [
    {
      name: "React",
      category: "Frontend",
      required: true,
    },
    {
      name: "Next.js",
      category: "Frontend",
      required: true,
    },
    {
      name: "Node.js",
      category: "Backend",
      required: true,
    },
    {
      name: "PostgreSQL",
      category: "Database",
      required: true,
    },
    {
      name: "AWS",
      category: "Cloud",
      required: false,
    },
  ],

  responsibilities: [
    "Build and maintain customer-facing applications.",
    "Design scalable backend services and APIs.",
    "Improve application performance and reliability.",
  ],

  requirements: [
    "1-3 years of Full Stack development experience.",
    "Strong React or Next.js experience.",
    "Experience with Node.js.",
  ],

  niceToHave: [
    "Startup experience.",
    "AWS experience.",
    "React Native experience.",
  ],
};

renderJobAnalysis(sampleJob);