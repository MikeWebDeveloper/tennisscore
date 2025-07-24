Software Architecture Document: TennisScore
	
Document Title:	TennisScore Software Architecture Document
Author:	Gemini AI
Status:	Version 1.0 (For Engineering Review)
Last Updated:	June 11, 2024
Related Documents:	TennisScore PRD v2.0
1. Introduction
1.1. Purpose

This Software Architecture Document (SAD) outlines the high-level architecture and technical design for the TennisScore web application (v1.0). It serves as a technical blueprint for the development team, detailing the system's components, their interactions, data models, security considerations, and deployment strategies. The architecture described herein is designed to meet all functional and non-functional requirements specified in the TennisScore PRD.

1.2. Scope

The scope of this document is limited to the architecture of the v1.0 release of TennisScore. This includes the frontend web application, the backend services provided by Appwrite Cloud, and the infrastructure required for deployment. Future features identified in the PRD roadmap (e.g., AI video analysis, native mobile apps) are considered but not architected in detail here.

1.3. Definitions, Acronyms, and Abbreviations

SAD: Software Architecture Document

PRD: Product Requirements Document

BaaS: Backend-as-a-Service

BFF: Backend-for-Frontend

C4 Model: A model for visualizing software architecture at different levels of detail (Context, Containers, Components, Code).

CI/CD: Continuous Integration / Continuous Deployment

SSR: Server-Side Rendering

RSC: React Server Component

PWA: Progressive Web App

2. Architectural Goals & Constraints

The architecture is driven by the following key goals and constraints derived from the PRD.

2.1. Architectural Goals

Performance: The system must deliver a fast, fluid user experience. This includes sub-second page loads, instant UI feedback, and real-time data synchronization with minimal latency.

Scalability: The architecture must handle variable loads, from a single user tracking a match to thousands of concurrent viewers on a shared live match link, without degradation in performance.

Security: Security is paramount. The architecture must protect user data, prevent unauthorized access, and secure all communication channels and backend credentials.

Maintainability & Extensibility: The codebase must be well-structured, modular, and easy to understand, enabling efficient bug fixing, feature enhancements, and onboarding of new developers.

Developer Experience: The chosen stack and patterns should maximize developer productivity and satisfaction through modern tooling, clear conventions, and rapid feedback loops.

Real-Time Capability: The system must support low-latency, bidirectional communication to power the live match sharing feature, a core component of the user experience.

2.2. Architectural Constraints

Technology Stack: The architecture is constrained to the stack defined in the PRD: Next.js 15, shadcn/ui, Framer Motion, Zustand, Appwrite Cloud, and Vercel.

Web-First Approach: The initial product (v1.0) is a web application. Native mobile app considerations are deferred.

Managed Services: The architecture relies on managed services (Appwrite Cloud, Vercel) to minimize operational overhead and accelerate time-to-market.

Time-to-Market: The target launch of Q1 2025 dictates pragmatic architectural choices that favor speed of delivery without compromising core quality.

3. System Overview (C4 Model)
3.1. Level 1: System Context Diagram

This diagram shows TennisScore as a single system and its interactions with users and external systems.

+-----------------+      +---------------------------+      +--------------------------+
|      User       |----->|  TennisScore Web App      |<---->|   Appwrite Cloud Backend |
| (Player, Coach, |      |   (Hosted on Vercel)      |      | (Auth, DB, Storage, RT)  |
|     Viewer)     |      +---------------------------+      +--------------------------+
+-----------------+


User: Interacts with the TennisScore Web App via a web browser on any device.

TennisScore Web App: The complete Next.js application hosted on Vercel. It serves the UI to the user and communicates with the backend.

Appwrite Cloud Backend: The managed BaaS that provides all backend functionality.

3.2. Level 2: Container Diagram

This diagram zooms into the TennisScore system, showing the high-level technical containers.

+--------------------------------------------------------------------------------------+
|                                     User's Device                                    |
|                                                                                      |
| +----------------------------------------------------------------------------------+ |
| |                        Browser: Next.js Client-Side App (SPA)                    | |
| |  - Renders UI (React, shadcn/ui)                                                 | |
| |  - Handles animations (Framer Motion)                                            | |
| |  - Manages UI state (Zustand)                                                    | |
| |  - Makes calls to Next.js Server Runtime (Server Actions)                        | |
| |  - Subscribes to Appwrite Realtime (WebSockets)                                  | |
| +----------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------+
       |
       | HTTPS Requests (Server Actions, Page Loads)
       |
+--------------------------------------------------------------------------------------+
|                                  Vercel Platform                                     |
|                                                                                      |
| +----------------------------------------------------------------------------------+ |
| |                       Next.js Server-Side Runtime (Serverless)                   | |
| |  - Handles SSR & RSCs                                                            | |
| |  - Executes Server Actions (BFF Logic)                                           | |
| |  - Securely calls Appwrite API with secret keys                                  | |
| +----------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------+
       |
       | Secure API Calls (Appwrite Node.js SDK)
       |
+--------------------------------------------------------------------------------------+
|                                  Appwrite Cloud                                      |
|                                                                                      |
| +------------+  +-------------+  +-----------+  +-----------+  +-------------------+ |
| |    Auth    |  |  Databases  |  |  Storage  |  | Functions |  |     Realtime      | |
| +------------+  +-------------+  +-----------+  +-----------+  +-------------------+ |
+--------------------------------------------------------------------------------------+
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END
4. Frontend Architecture

The frontend is a modern Next.js 15 application designed for performance and interactivity.

4.1. Directory Structure

A well-defined directory structure is crucial for maintainability.

/src
├── /app                  # Next.js App Router: Routes, layouts, pages
│   ├── /api              # (Optional) For traditional API routes if needed
│   ├── /(auth)           # Route group for auth pages (login, signup)
│   ├── /(app)            # Route group for authenticated app pages
│   │   ├── /dashboard
│   │   ├── /matches
│   │   └── layout.tsx    # Main app layout (navbars, etc.)
│   ├── /live/[matchId]   # Public live match sharing page
│   └── layout.tsx        # Root layout
├── /components           # Reusable React components
│   ├── /ui               # Unstyled components from shadcn/ui (e.g., button.tsx)
│   ├── /features         # Components specific to a feature (e.g., /dashboard/StatsCard.tsx)
│   └── /layout           # Layout components (e.g., Navbar.tsx, Sidebar.tsx)
├── /lib                  # Core logic, utilities, and client initializations
│   ├── appwrite-client.ts# Initializes Appwrite Web SDK
│   ├── appwrite-server.ts# Initializes Appwrite Node.js SDK (for Server Actions)
│   └── utils.ts          # Shared utility functions (e.g., cn for classnames)
├── /hooks                # Custom React hooks (e.g., useAuth.ts)
├── /stores               # Zustand state management stores
│   ├── userStore.ts
│   └── matchStore.ts
└── /styles               # Global styles and Tailwind CSS configuration
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END
4.2. Component Strategy

React Server Components (RSCs): Used by default in the /app directory. They are ideal for pages and components that need direct, secure data access but have no interactivity.

Example: The main dashboard page (/dashboard/page.tsx) will be an RSC that fetches the initial player stats from Appwrite.

Client Components ("use client"): Used for any component that requires interactivity, state, lifecycle effects, or browser-only APIs.

Example 1: The LiveScoringInterface.tsx component is a Client Component because it uses useState and useEffect to manage the score and handle user input.

Example 2: Any component using Framer Motion for animation or Zustand for state (useUserStore) must be a Client Component.

4.3. State Management (Zustand)

Zustand will be used for both global and feature-specific state.

userStore.ts: Manages global user state, including authentication status, user profile data, and the currently selected "main player" for the dashboard. This store will use Zustand's persist middleware to keep the user logged in and remember their main player selection across sessions.

matchStore.ts: Manages the complex state of a live scoring session on the client. This is a non-persistent, in-memory store that holds the current score, point history for the session, and detailed logging mode status. It will be initialized when the user enters the live scoring page and cleared upon exit.

SSR & Hydration Strategy: To prevent hydration mismatches, we will follow a provider pattern for global stores that need to be accessed on the server.

A StoreProvider component will be created.

In Server Components, initial data (like the logged-in user's data) will be fetched.

This data will be passed as a prop to the StoreProvider.

The StoreProvider (a Client Component) will initialize the Zustand store with this server-provided data once on mount, ensuring the client and server start with the same state.

5. Backend Architecture (Appwrite Cloud)

Appwrite Cloud provides the entire backend. Our architecture defines how we use its services.

5.1. Service Breakdown

Authentication:

Flow: The primary authentication method will be Email/Password. The flow is architected for security:

Client-side form in Next.js captures credentials.

Form submission triggers a Next.js Server Action.

The Server Action, running on the server, uses the Appwrite Node.js SDK with a secret API key to call account.createEmailPasswordSession().

Upon success, Appwrite returns a session object.

The Server Action creates a secure, HTTP-only cookie containing the session JWT and sets it on the user's browser.

Session Management: Subsequent requests from the client will include this cookie. Server Components and middleware can read this cookie to verify the user's session with Appwrite before rendering protected content.

Databases:

Collections: The core data models (Players, Matches) will be implemented as Appwrite Collections with the schemas defined in the Data Architecture section.

Permissions: A strict permission model will be enforced:

Players Collection: A user can only create documents. They can only read, update, and delete documents where their userId matches the userId field on the document. (Permission.update(Role.user(userId))).

Matches Collection: Similar permissions apply. Document-level permissions will be used to grant read access to the public for live matches.

Storage:

Buckets: Two buckets will be created: profile-pictures and match-media.

Permissions: Buckets will be configured to allow authenticated users to create files. Read access for profile pictures will be public, while match media may be restricted.

Image Transformation: Appwrite's built-in image transformation API will be used to generate thumbnails for profile pictures to optimize performance.

Realtime:

Subscription Channel: The live match sharing feature will use a document-level subscription channel: databases.[DATABASE_ID].collections.[MATCHES_ID].documents.[matchId].

Usage: Only the public /live/[matchId] page will establish a WebSocket connection. This is a read-only subscription. The client will not be able to publish events, only receive them.

5.2. SDK Usage: A Strict Separation

appwrite-client.ts (Web SDK): Used only in Client Components. It is initialized with the public Project ID and Endpoint. It operates on behalf of the currently logged-in user's session.

Use Cases: Fetching the current user's account (account.get()), subscribing to Realtime events.

appwrite-server.ts (Node.js SDK): Used only in server-side code (Server Actions, API Routes). It is initialized with a secret API Key.

Use Cases: All database mutations (create, update, delete), user authentication, and any data fetching that requires elevated privileges. This creates a secure Backend-for-Frontend (BFF) pattern.

6. Data Architecture
6.1. Data Models (Schema)

Collection: Players

Attribute Name	Type	Required	Example	Notes
firstName	String	Yes	"Roger"	
lastName	String	Yes	"Federer"	
yearOfBirth	Integer	No	1981	
rating	String	No	"7.0"	Free text for flexibility in v1.0.
profilePictureId	String	No	"638e3f7f27cf5e83"	ID of the file in the profile-pictures bucket.
userId	String	Yes	"5f8d8f3e8c7b8"	The Appwrite Auth ID of the user who created this player. Used for permissions.

Collection: Matches

Attribute Name	Type	Required	Example	Notes
playerOneId	String	Yes	"638e3f7f27cf5e83"	Relationship to Players collection.
playerTwoId	String	Yes	"638e3f7f27cf5e84"	Relationship to Players collection.
matchDate	Datetime	Yes	"2024-06-11T10:00:00.000Z"	Stored in ISO 8601 format.
matchFormat	String (JSON)	Yes	{"sets": 3, "noAd": false}	Stored as a JSON string for flexibility.
status	String	Yes	"In Progress" / "Completed"	
winnerId	String	No	"638e3f7f27cf5e83"	Set when status becomes "Completed".
score	String (JSON)	Yes	{"sets": [{"p1": 6, "p2": 2}], "games": ...}	Current score snapshot for quick display.
pointLog	String (Array of JSON)	No	[{"winner": "p1", "type": "UE", "shot": "FH"}]	Detailed log of every point.
events	String (Array of JSON)	No	[{"type": "comment", "text": "Great point!"}]	For live commentary and photo events.
userId	String	Yes	"5f8d8f3e8c7b8"	The Appwrite Auth ID of the scorekeeper.
6.2. Data Flow Diagrams

Flow 1: Live Point Scoring & Real-time Update

[Scorekeeper Client] --(1. Click Player 1 wins point)--> [Next.js Server Action] --(2. Update Match Doc)--> [Appwrite DB] --(3. Realtime Event)--> [Viewer Client]

User Interaction: The scorekeeper clicks the button to award a point. The client-side matchStore updates instantly for UI feedback.

Secure Mutation: A Server Action is called with the point data. The server validates the request and uses the Appwrite Node.js SDK to update the score and append to the pointLog in the Matches document.

Real-time Push: The update to the document in Appwrite triggers a Realtime event. Appwrite pushes the new document data to all subscribed clients.

UI Update: The Viewer's client receives the event and updates its UI to show the new score.

Flow 2: Loading the Player Dashboard

[User Browser] --(1. Navigate to /dashboard)--> [Vercel/Next.js Server] --(2. Fetch Stats from Appwrite)--> [Appwrite DB]
[Vercel/Next.js Server] --(3. SSR Page with Data)--> [User Browser]

Navigation: The user requests the /dashboard page.

Server-Side Data Fetching: The Next.js Server Component (page.tsx) executes on the server. It reads the user's session cookie, verifies the user, and makes secure, server-to-server calls to the Appwrite Databases service to fetch and aggregate all necessary match statistics.

Server-Side Render: The server renders the complete HTML for the dashboard, including the fetched stats, and sends it to the browser for a fast initial paint.

7. Deployment & DevOps Architecture
7.1. Infrastructure

Frontend Hosting: Vercel will be used to host the Next.js application.

Backend Hosting: Appwrite Cloud will provide all backend services.

DNS: A custom domain (e.g., tenscr.app) will be configured to point to Vercel.

7.2. CI/CD Pipeline

The development workflow will be Git-centric, hosted on GitHub.

Development: Developers work on feature branches.

Pull Request: A PR is created to merge a feature into the main branch.

Automated Preview: Vercel automatically builds and deploys a unique, shareable Preview Environment for every PR. This allows for QA and review on a live, isolated instance.

Merge to Main: Upon PR approval and merge, Vercel automatically triggers a Production Deployment.

Deployment: The new version is deployed to production, with zero downtime.

7.3. Environments & Configuration

Local (Development): Developers run the Next.js app and connect to a dedicated Appwrite Cloud "Dev" project. Environment variables are managed in an untracked .env.local file.

Preview (Staging): Vercel Preview Deployments connect to the Appwrite "Dev" project. Environment variables are configured in the Vercel project settings.

Production: The main branch deployment on Vercel connects to the Appwrite Cloud "Prod" project. Production environment variables are stored securely in Vercel.

8. Architectural Decisions & Trade-offs
Decision	Justification	Trade-off
Using Server Actions as a BFF	Provides a secure pattern for interacting with the backend, co-locates mutation logic with components, and simplifies the architecture by avoiding separate API route files.	This is a newer paradigm in Next.js. The team must be comfortable with this pattern over traditional REST/GraphQL APIs.
Storing pointLog as an Array of JSON Strings	Simple to implement and flexible for v1.0. Appwrite's Realtime service efficiently pushes the entire updated document.	Can become inefficient to query or aggregate on the backend at massive scale. A separate Points collection could be more performant but adds complexity. This is a pragmatic choice for v1.0.
Web-First, Not Native	Dramatically reduces development time and cost, allows for a single codebase, and provides immediate cross-platform reach.	Lacks offline capabilities and access to some native device features (e.g., advanced push notifications). A PWA strategy can mitigate some of this.
Relying on Appwrite Cloud	Eliminates the need for a dedicated backend/DevOps team, providing managed security, scalability, and maintenance.	Vendor dependency. Less control over the underlying infrastructure compared to self-hosting. Potential for costs to increase with scale.
9. Future Architectural Considerations (Post v1.0)

Offline Support: To support scoring without an internet connection, a PWA strategy will be required. This would involve using a Service Worker to cache the application shell and client-side storage (like IndexedDB) to queue point updates. A background sync process would push updates to Appwrite when the connection is restored.

Microservices for AI Analysis: The future "AI Video Analysis" feature will not be built into the Next.js monolith. It will be architected as a separate microservice, likely a Python service deployed on a container platform. It would be triggered by a job queue (e.g., RabbitMQ or an Appwrite Function acting as a trigger) to process videos asynchronously.

Data Warehousing: If statistical analysis becomes highly complex, the raw data from Appwrite could be periodically exported to a dedicated data warehouse (like BigQuery or Snowflake) optimized for complex analytical queries. The dashboard would then query this warehouse instead of the production DB.
