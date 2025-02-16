# Project Brief: Satisfactories

---

## 1. Project Overview

**Satisfactories** is a web application designed to help Satisfactory players track and manage the details of their factory networks across multiple “worlds.” It consolidates all the crucial production data—inputs, outputs, power usage, and more—into one unified dashboard, reducing the need to switch between spreadsheets or external tools.

**Why It Matters**  
Satisfactory is known for its complexity, with multiple factory setups, resource chains, and milestones. Satisfactories aims to streamline the planning process so players can easily see which resources are being produced, consumed, or bottlenecked, ultimately enhancing the overall gameplay experience.

---

## 2. Project Goals

1. **Centralized Factory Management**  
   Provide an at-a-glance view of all factories, resources, and production rates.

2. **Time & Effort Savings**  
   Replace multiple spreadsheets and third-party calculators with a single, user-friendly platform.

3. **Desktop/Tablet Optimization**  
   Focus on delivering an interface that works seamlessly on desktop or larger tablets, ideal for a companion setup while playing.

4. **Scalable & Future-Ready**  
   Design the architecture to grow with added features like real-time diagrams, game-file parsing, multi-user collaboration, etc.

---

## 3. Key Features & Scope

### 3.1 Core (MVP) Features

- **Local Storage for Data**  
  No initial server-based authentication. Each player’s world/factory data is stored in the browser.

- **World & Factory Management**  
  Create multiple “worlds,” each containing multiple factories.  
  Factories store inputs, outputs, and a markdown notes section.

- **Dashboard & Summaries**  
  A dashboard showing total production vs. consumption across factories.  
  Highlights deficits, surpluses, and other critical metrics.

- **Recipe Tracking**  
  Basic tracking of standard and alternate recipes to ensure consistent resource calculations.

- **Accessibility & Performance**  
  Use best practices for accessibility (e.g., ARIA labels, proper color contrast).  
  Optimize for desktop usage, ensuring quick load times and a clear, easy-to-read layout.

### 3.2 Near-Term Enhancements

- **Power Consumption Tracking**  
  Log generators and total power capacity vs. current load.

- **Ratio Calculations & Bottleneck Alerts**  
  Automated checking to see if inputs match outputs, plus warnings for under/overproduction.

- **Space Elevator / Milestone Planner**  
  Keep track of required items for upcoming Satisfactory milestones or deliveries.

- **Basic Collaboration (Optional)**  
  Preliminary support for sharing worlds/factories with others (if authentication is introduced).

### 3.3 Long-Term Features

- **Interactive Map**  
  A visual overlay of the planet with markers for factories and resource flows.

- **Advanced Recipe Library**  
  Alternate recipe management with automatic ratio recalculations.

- **Train & Truck Route Planner**  
  Plan logistics routes and timings for resource transport.

- **Game File Parsing**  
  Automatically import factory data from save files.

- **Chatbot (LLM Integration)**  
  ADA-like in-game AI persona for strategy queries; user provides their own API key.

- **Multi-User Collaboration**  
  Full user auth, real-time co-op planning, versioning, etc.

---

## 4. Technical Decisions

1. **Front End**  
   - **Next.js + TypeScript** (serverless SSR on AWS Lambda).  
   - **Tailwind CSS** + **Flowbite** UI library.  
   - **Desktop-Focused UI** for clarity and screen real estate on larger displays.

2. **Accessibility (a11y)**  
   - Adherence to WCAG guidelines (e.g., ARIA labels, proper color contrast).  
   - Keyboard navigability and skip links for screen readers.

3. **Performance**  
   - High Lighthouse scores via image optimization, code splitting, lazy loading heavy components, and efficient caching.  
   - Minimal bundle size where possible (purging unused Tailwind classes).

4. **Data Persistence**  
   - **Local Storage** for MVP.  
   - Potential migration to DynamoDB or PostgreSQL in a future release for multi-device synchronization and user authentication.

5. **Testing**  
   - **Jest** + **React Testing Library** for unit/integration tests.  
   - **Playwright** for E2E, potentially verifying layout at desktop/tablet breakpoints.  
   - Accessibility audits (e.g., `axe-core`) and Lighthouse CI for performance checks.

6. **Deployment & Infrastructure**  
   - **AWS** (Lambda for SSR, CloudFront + WAF for CDN and security, Route53 for domain).  
   - **Ephemeral Environments** for each pull request, automatically created/destroyed via GitHub Actions + Terraform.  
   - **GitHub Actions** for CI/CD (build, test, deploy).

---

## 5. Implementation Approach

1. **MVP (Phase 1)**  
   - Scaffold Next.js + TS + Tailwind + Flowbite.  
   - Integrate local storage utilities, data models (`World`, `Factory`), and a minimal dashboard.  
   - Optimize layout for desktop/tablet screens.  
   - Basic unit tests with Jest; minimal E2E tests with Playwright.

2. **Enhancements (Phase 2)**  
   - Add deeper ratio calculations, basic power consumption tracking, advanced recipe logic, and improved reporting.  
   - Expand testing coverage, incorporate accessibility checks, and begin ephemeral deployment setups.

3. **Advanced Features (Phase 3)**  
   - Introduce interactive maps, full alternate recipe management, scanning of game save files, chatbot integration, etc.  
   - Potentially move user data to AWS (DynamoDB or PostgreSQL) with secure authentication for multi-device sync.  
   - Multi-user collaboration.

---

## 6. Non-Technical Considerations

- **User Experience & Feedback**  
  Continuously gather feedback from active Satisfactory players to guide new features or tweaks.

- **Community Expansion**  
  Potentially open the app to community usage or host a forum/Discord for feature requests and bug reports.

- **Licensing & Distribution**  
  Decide if the app will be open-source or proprietary.  
  Outline how game integration (via save-file parsing) complies with any of Satisfactory’s community guidelines or EULAs.

---

## 7. Success Metrics

1. **Usage Frequency**  
   Are players using Satisfactories each time they play?

2. **Time Saved**  
   Reduction in manual tracking using spreadsheets or external tools.

3. **Accessibility & Performance**  
   Maintaining high performance and a11y scores on desktop usage.

4. **Community Adoption**  
   Number of sign-ups (once user auth is live), active user count, or general user feedback.

---

## 8. Conclusion

**Satisfactories** aims to be a robust companion tool for fans of the game Satisfactory—helping them visualize, organize, and optimize their factory networks in a **desktop-centric** environment. By focusing on **accessibility**, **performance**, and **user-centric design**, the project will deliver a streamlined experience that grows over time with new features like advanced recipe calculation, game-file parsing, and collaborative planning tools.

This project brief encapsulates the core vision, technical stack, and roadmap for Satisfactories, laying the foundation for iterative development and future scalability.