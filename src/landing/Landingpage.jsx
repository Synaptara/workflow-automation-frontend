import { LandingThemeProvider, useLandingTheme } from "./context/Landingthemecontext.jsx";
import "./Landing.css";

import Nav from "./components/Nav";
import Hero from "./components/Hero";
import IntegrationsPreview from "./components/Integrationspreview";
import HowItWorks from "./components/Howitworks";
import Features from "./components/Features";
import Testimonial from "./components/Testimonial";
import Footer from "./components/Footer";

function LandingInner() {
  const { theme } = useLandingTheme();
  return (
    <div className="landing-root min-h-screen" data-theme={theme}>
      <Nav />
      <Hero />
      <IntegrationsPreview />
      <HowItWorks />
      <Features />
      <Testimonial />
      <Footer />
    </div>
  );
}

export default function LandingPage() {
  return (
    <LandingThemeProvider>
      <LandingInner />
    </LandingThemeProvider>
  );
}
