import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./Layout";

// Import all pages
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import JobSearch from "./pages/JobSearch";
import AIPlanner from "./pages/AIplanner";
import Applications from "./pages/Applications";
import SkillsRoadmap from "./pages/SkillsRoadMap";
import CompanyProfile from "./pages/CompanyProfile";

function App() {
  return (
    <>
      <Routes>
        {/* Onboarding route without layout */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* All other routes with layout */}
        <Route
          path="/"
          element={
            <Layout currentPageName="Dashboard">
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Layout currentPageName="Dashboard">
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout currentPageName="Profile">
              <Profile />
            </Layout>
          }
        />
        <Route
          path="/jobs"
          element={
            <Layout currentPageName="JobSearch">
              <JobSearch />
            </Layout>
          }
        />
        <Route
          path="/ai-planner"
          element={
            <Layout currentPageName="AIPlanner">
              <AIPlanner />
            </Layout>
          }
        />
        <Route
          path="/applications"
          element={
            <Layout currentPageName="Applications">
              <Applications />
            </Layout>
          }
        />
        <Route
          path="/skills"
          element={
            <Layout currentPageName="SkillsRoadmap">
              <SkillsRoadmap />
            </Layout>
          }
        />
        <Route
          path="/company"
          element={
            <Layout currentPageName="CompanyProfile">
              <CompanyProfile />
            </Layout>
          }
        />

        {/* Redirect any unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast notifications */}
      <Toaster position="top-right" />
    </>
  );
}

export default App;
