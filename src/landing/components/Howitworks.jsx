import { useState, useEffect } from "react";

const STEPS = [
  {
    n: "01",
    title: "Get a webhook URL",
    body: "Create a workflow and Orkflo gives you a unique URL. Point any service that can send a POST request at it.",
  },
  {
    n: "02",
    title: "Add a condition",
    body: "Check a field from the incoming data — a budget, a status, anything — before deciding what happens next.",
  },
  {
    n: "03",
    title: "Choose what happens next",
    body: "Branch into Slack, email, an API call, or any of the built-in integrations, based on what the condition found.",
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const getTextColor = (index) =>
    activeStep === index ? "text-white" : "text-[#71717a]";

  const getHighlightColor = (index) =>
    activeStep === index
      ? "bg-[#082342] text-[#3a9dff]"
      : "bg-[#1f1f24] text-[#71717a]";

  return (
    <section
      id="how-it-works"
      className="max-w-6xl mx-auto px-6 py-20 md:py-32 border-t border-[#1f1f24]"
    >
      {/* Animated Typographic Header */}
      <div className="mb-20 max-w-[55rem]">
        <h2 className="text-3xl md:text-[40px] font-medium leading-[1.4] md:leading-[1.45] tracking-tight">

          <span
            className={`transition-colors duration-500 ${getTextColor(0)}`}
          >
            Orkflo{" "}
            <span
              className={`inline-block px-1 py-0 mx-0 rounded-md transition-colors duration-500 ${getHighlightColor(0)}`}
            >
              catches
            </span>
            <sup className="font-mono text-[10px] ml-0.5 mr-2 align-super">
              01
            </sup>{" "}
            webhooks from your apps,{" "}
          </span>

          <span
            className={`transition-colors duration-500 ${getTextColor(1)}`}
          >
            <span
              className={`inline-block px-1.5 py-0 mx-0.5 rounded-md transition-colors duration-500 ${getHighlightColor(1)}`}
            >
              evaluates
            </span>
            <sup className="font-mono text-[10px] ml-0.5 mr-2 align-super">
              02
            </sup>{" "}
            the conditions,{" "}
          </span>

          <span
            className={`transition-colors duration-500 ${getTextColor(2)}`}
          >
            and triggers{" "}
            <span
              className={`inline-block px-1.5 py-0 mx-0.5 rounded-md transition-colors duration-500 ${getHighlightColor(2)}`}
            >
              actions
            </span>
            <sup className="font-mono text-[10px] ml-0.5 mr-1 align-super">
              03
            </sup>{" "}
            from first signal to finish.
          </span>

        </h2>
      </div>

      {/* 3-Column Grid */}
      <div className="grid md:grid-cols-3 gap-10 md:gap-12">
        {STEPS.map((step, index) => (
          <div
            key={step.n}
            className="flex flex-col cursor-pointer group"
            onClick={() => setActiveStep(index)}
          >
            <span
              className={`font-mono text-xs font-semibold mb-4 transition-colors duration-500 ${
                activeStep === index
                  ? "text-white"
                  : "text-[#71717a] group-hover:text-[#a1a1aa]"
              }`}
            >
              {step.n}
            </span>

            <h3
              className={`text-lg font-semibold mb-2.5 tracking-tight transition-colors duration-500 ${
                activeStep === index
                  ? "text-white"
                  : "text-[#a1a1aa] group-hover:text-white"
              }`}
            >
              {step.title}
            </h3>

            <p
              className={`text-sm leading-relaxed transition-colors duration-500 ${
                activeStep === index
                  ? "text-[#a1a1aa]"
                  : "text-[#71717a] group-hover:text-[#a1a1aa]"
              }`}
            >
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
