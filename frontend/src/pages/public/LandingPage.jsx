import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import {
  TargetIcon,
  BriefcaseIcon,
  LayersIcon,
  AlertTriangleIcon,
  CheckIcon,
  ArrowRightIcon
} from '../../components/common/Icons';
import { useCms } from '../../context/CmsContext';

export const LandingPage = () => {
  const { cms } = useCms();
  return (
    <div className="landing-page-flow">
      {/* ============================================================
          1. HERO SECTION
          ============================================================ */}
      <section className="hero-section" aria-label="Hero Section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-tag">
              <TargetIcon width={14} height={14} />
              <span>{cms('landing.hero.badge', 'Placement Intelligence System')}</span>
            </div>
            <h1 className="hero-title">
              {cms('landing.hero.title', 'Know Your Placement Readiness Before Your Placement Drive')}
            </h1>
            <p className="hero-desc">
              {cms('landing.hero.subtitle', 'Analyze academic performance, aptitude, programming skills, and technical capabilities to understand your placement readiness and identify the skills you need to improve.')}
            </p>
            <div className="hero-actions">
              <Link to="/student/assessment">
                <Button variant="primary" size="lg" icon={ArrowRightIcon}>
                  {cms('landing.hero.primary_btn', 'Check Your Readiness')}
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline-hero" size="lg">
                  {cms('landing.hero.secondary_btn', 'Explore Platform')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. CORE FEATURES SECTION (4-Column Grid)
          ============================================================ */}
      <section className="section-features" id="features" aria-label="Core Features">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Comprehensive Analytics</span>
            <h2 className="section-title">{cms('landing.features.title', 'Core Placement Readiness Capabilities')}</h2>
            <p className="section-subtitle">
              {cms('landing.features.subtitle', 'Engineered for academic institutions to eliminate guesswork and prepare students systematically for corporate recruitment drives.')}
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box">
                <TargetIcon width={22} height={22} />
              </div>
              <h3 className="feature-title">Placement Readiness</h3>
              <p className="feature-desc">
                Analyze student performance and calculate placement readiness across academic, coding, and aptitude dimensions.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <BriefcaseIcon width={22} height={22} />
              </div>
              <h3 className="feature-title">Company Matching</h3>
              <p className="feature-desc">
                Identify companies compatible with the student's current profile based on historical cutoffs and skill requirements.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <LayersIcon width={22} height={22} />
              </div>
              <h3 className="feature-title">Skill Gap Analysis</h3>
              <p className="feature-desc">
                Identify skills that require improvement to meet target company benchmarks before placement interviews begin.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <AlertTriangleIcon width={22} height={22} />
              </div>
              <h3 className="feature-title">At-Risk Detection</h3>
              <p className="feature-desc">
                Identify students who require additional placement preparation and faculty intervention well in advance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. WHY CAREERREADY AI (2-Column)
          ============================================================ */}
      <section className="section-why" id="about" aria-label="Why CareerReady AI">
        <div className="container">
          <div className="why-grid">
            <div className="why-image-wrap">
              <img
                src="/assets/images/why_lab.jpg"
                alt="University Computer Science Lab and Technical Workspace"
                loading="lazy"
              />
            </div>

            <div className="why-content">
              <span className="section-eyebrow">PLACEMENT INTELLIGENCE</span>
              <h2 className="section-title">Turn Student Performance Into Actionable Placement Insights</h2>
              <p className="section-subtitle" style={{ textAlign: 'left', margin: 0 }}>
                CareerReady AI converts academic and skill-related performance data into meaningful placement
                insights that help students and placement teams make informed preparation decisions.
              </p>

              <ul className="benefits-list">
                <li className="benefit-item">
                  <CheckIcon className="check-icon" />
                  <span>Data-driven readiness assessment</span>
                </li>
                <li className="benefit-item">
                  <CheckIcon className="check-icon" />
                  <span>Company-wise compatibility</span>
                </li>
                <li className="benefit-item">
                  <CheckIcon className="check-icon" />
                  <span>Personalized skill gap identification</span>
                </li>
                <li className="benefit-item">
                  <CheckIcon className="check-icon" />
                  <span>Early identification of at-risk students</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. READINESS ANALYTICS SECTION (Structured 2-Column Grid)
          ============================================================ */}
      <section className="section-readiness-demo" id="analytics" aria-label="Readiness Analytics">
        <div className="container">
          <div className="readiness-demo-grid">
            <div>
              <span className="section-eyebrow">DIAGNOSTIC BENCHMARKS</span>
              <h2 className="section-title">Understand Your Placement Readiness</h2>
              <p className="section-subtitle" style={{ textAlign: 'left', marginBottom: '24px' }}>
                Our structured analytical framework evaluates comprehensive performance factors
                including cumulative academic consistency, aptitude fundamentals, coding agility,
                and core domain competencies to determine your institutional readiness classification.
              </p>
              <Link to="/student/readiness">
                <Button variant="secondary" icon={ArrowRightIcon}>
                  View Diagnostic Breakdown
                </Button>
              </Link>
            </div>

            <div className="analytics-preview-card">
              <div className="preview-card-header">
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Diagnostic Evaluation
                  </span>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-navy-950)' }}>
                    Placement Readiness Score
                  </div>
                </div>
                <div className="score-highlight">
                  <span className="score-number">82</span>
                  <span className="score-suffix">%</span>
                </div>
              </div>

              <div>
                <ProgressBar label="Academic Performance" value={88} variant="primary" />
                <ProgressBar label="Aptitude Performance" value={78} variant="primary" />
                <ProgressBar label="Programming Skills" value={85} variant="primary" />
                <ProgressBar label="Technical Skills" value={80} variant="primary" />
                <ProgressBar label="Communication" value={75} variant="primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. HOW IT WORKS (4-Step Horizontal)
          ============================================================ */}
      <section className="section-how" id="how-it-works" aria-label="How It Works">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">System Workflow</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              A systematic 4-step pipeline that transforms raw performance metrics into guided placement readiness.
            </p>
          </div>

          <div className="how-steps-grid">
            <div className="how-step-card">
              <span className="step-badge">Step 01</span>
              <h3 className="step-title">Enter Performance Data</h3>
              <p className="step-desc">
                Academic, aptitude, programming and technical information submitted via structured diagnostic assessment.
              </p>
            </div>

            <div className="how-step-card">
              <span className="step-badge">Step 02</span>
              <h3 className="step-title">AI Analysis</h3>
              <p className="step-desc">
                The system analyzes placement-related performance through trained multi-feature evaluation models.
              </p>
            </div>

            <div className="how-step-card">
              <span className="step-badge">Step 03</span>
              <h3 className="step-title">Get Readiness Insights</h3>
              <p className="step-desc">
                Receive readiness score, company matches, eligibility cutoffs, and pinpointed skill gaps.
              </p>
            </div>

            <div className="how-step-card">
              <span className="step-badge">Step 04</span>
              <h3 className="step-title">Improve & Prepare</h3>
              <p className="step-desc">
                Use the targeted analytical insights and department guidance to improve placement readiness before drives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          6. AI ANALYSIS MODULES SECTION
          ============================================================ */}
      <section className="section-algorithms" aria-label="Analytics & AI Modules">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Engine Architecture</span>
            <h2 className="section-title">Analytics That Support Placement Preparation</h2>
            <p className="section-subtitle">
              Transparent, deterministic and machine-learning backed classification modules tailored for student employability.
            </p>
          </div>

          <div className="algorithms-grid">
            <div className="algorithm-card">
              <span className="algorithm-tag">Predictive Model</span>
              <h3 className="algorithm-title">Random Forest Classifier</h3>
              <p className="algorithm-desc">
                Predicts placement readiness from relevant student performance features.
              </p>
            </div>

            <div className="algorithm-card">
              <span className="algorithm-tag">Matching Engine</span>
              <h3 className="algorithm-title">Company Matching Algorithm</h3>
              <p className="algorithm-desc">
                Calculates company-wise compatibility based on skills and requirements.
              </p>
            </div>

            <div className="algorithm-card">
              <span className="algorithm-tag">Diagnostic Tool</span>
              <h3 className="algorithm-title">Skill Gap Analysis</h3>
              <p className="algorithm-desc">
                Identifies missing or weak skills relative to target recruitment profiles.
              </p>
            </div>

            <div className="algorithm-card">
              <span className="algorithm-tag">Segmentation</span>
              <h3 className="algorithm-title">Threshold-Based Classification</h3>
              <p className="algorithm-desc">
                Categorizes students based on configured readiness thresholds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          7. FINAL CTA SECTION
          ============================================================ */}
      <section className="section-cta" aria-label="Call to Action">
        <div className="container">
          <div className="cta-box">
            <h2 className="cta-title">{cms('landing.cta.title', 'Start Understanding Your Placement Readiness')}</h2>
            <p className="cta-desc">
              {cms('landing.cta.subtitle', 'Turn your academic and skill data into meaningful placement insights.')}
            </p>
            <Link to="/register">
              <Button variant="primary" size="lg">
                {cms('landing.cta.btn', 'Get Started')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
