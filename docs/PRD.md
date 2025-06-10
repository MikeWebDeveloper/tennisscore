Enhanced Product Requirements Document: TennisScore v2.0
	
Document Title:	TennisScore Detailed Product Requirements
Author:	Gemini AI
Status:	Version 2.0 (Detailed Draft for Team Review)
Last Updated:	June 11, 2024
Target Launch (v1.0):	Q1 2025
1. Vision & Strategic Context
1.1. Product Vision Statement

To become the definitive digital companion for the modern tennis player, seamlessly blending professional-grade statistical analysis with an elegant, intuitive, and real-time user experience. TennisScore will empower players at all levels to understand their game, track their progress, and share their passion.

1.2. Guiding Principles

Experience First: Every interaction, from scoring a point to viewing a chart, must be fluid, intuitive, and visually delightful. Performance is a feature.

Data with Purpose: We don't just show stats; we provide actionable insights that help players improve.

Seamless Sharing: Connecting players with their community (coaches, family, fans) should be effortless and open.

Build on a Modern Foundation: Leverage best-in-class technology to ensure scalability, security, and a superior developer experience, enabling rapid innovation.

2. Target Audience & User Personas (Enhanced)
2.1. Persona: Alex, the Competitive Junior (16)

Narrative: Alex lives and breathes tennis. He trains 5 days a week and travels for tournaments on weekends. His coach is constantly telling him to "cut down on unforced errors," but Alex doesn't know if they're coming from his forehand or backhand under pressure. He uses his phone for everything and expects apps to be fast and slick, like Instagram or TikTok.

A Day in the Life: Alex finishes a tough 3-set tournament match. He's frustrated he lost. He immediately opens TennisScore on his phone, which his dad used to track the match. He navigates to the post-match screen, filters stats by the final set, and sees a spike in backhand unforced errors after the 3-3 game, confirming his coach's suspicion. He knows exactly what to work on in practice tomorrow.

Goals: Quantify his performance, identify specific shot weaknesses under pressure, track his record against rivals.

Frustrations: Clunky interfaces, apps that require too many taps to log a point, stats that are too basic (just "errors" not "unforced backhand errors").

2.2. Persona: Coach Sarah, the Mentor (45)

Narrative: Sarah coaches her 14-year-old daughter, Mia, and also manages a small group of other junior players. She can't be at every match. She needs a reliable way to follow along remotely and review match data later to prepare for coaching sessions. Mia's grandparents, who live in another state, are her biggest fans and always want live updates.

A Day in the Life: Sarah is at a coaching clinic while Mia is playing a match two hours away. Mia's dad is at the match and sends Sarah the TennisScore live link. Between sessions, Sarah opens the link on her tablet and sees Mia is down a break in the second set. She sees a comment from Mia's dad: "Losing focus on her toss." The score updates in real-time. After the match, Sarah already has talking points for their next call.

Goals: Follow matches remotely, access detailed historical data for her players, easily share progress with family without technical hurdles.

Frustrations: Apps that require everyone to download them, unreliable data syncing, difficulty managing profiles for multiple players.

3. Competitive Landscape & Our Unique Selling Proposition (USP)
Competitor	Key Strengths	Key Weaknesses	Our Strategic Angle
MatchTrack	Deep, coach-vetted manual stats; Strong iOS native experience; Privacy-focused (no account needed).	iOS-only (no Android/Web); Manual entry can be tedious; Design is functional but dated.	Beat them on Platform & UX. We will be cross-platform (web-first) with a superior, modern, and animated UI. We will match their statistical depth but make it more accessible.
iOnCourt	Cross-platform (iOS, Android, Web); Completely free; Excellent live sharing.	Less granular shot-type tracking; UI can be inconsistent on Android; Free model may limit future innovation.	Beat them on Depth & Quality. We will offer deeper, more meaningful statistics and a premium, polished user experience that feels worth paying for in the future. Our live sharing will be just as good, if not better.
SwingVision	Revolutionary AI video analysis; Automated stats and highlights; Strong brand endorsements.	High subscription cost; Requires camera setup (high user effort); AI can be inaccurate; iOS-only.	Co-exist by targeting a different use case. We are the best-in-class manual tracking tool. Our value is in precision, speed, and no-fuss setup for users who can't or don't want to record video.

Our Unique Selling Proposition (USP): TennisScore provides the statistical depth of a professional coaching tool with the real-time sharing of a modern social app, all wrapped in a beautifully designed, animated, and cross-platform web experience that requires no camera setup.

4. Detailed Functional Requirements (v1.0)
EPIC 1: User Onboarding & Player Management
ID	User Story	Functional Requirements	UI/UX Wireframe Concepts	Technical Implementation Notes	Acceptance Criteria
F-1.1	As a new user, I want to sign up for an account using my email and password.	1. Provide a /signup route.<br>2. Form must include fields: Email, Password, Confirm Password.<br>3. Client-side validation for email format and password match.<br>4. Display clear error messages (e.g., "User already exists," "Passwords do not match").	A clean, centered card (shadcn/ui Card) on a minimalist background. Focus state on inputs should be prominent. A link to the /login page should be present.	- Appwrite account.create() method.<br>- Use Next.js Server Actions for the backend call.<br>- Use zod for schema validation within the Server Action.	1. Given a user is on the signup page, when they enter valid credentials and submit, then an account is created in Appwrite Auth.<br>2. The user is automatically logged in and redirected to the main dashboard.
F-1.2	As a user, I want to create a detailed profile for myself or other players.	1. A "Create Player" action should be available.<br>2. Form fields: First Name (required), Last Name (required), Year of Birth (optional), Rating (optional, text input), Profile Picture (optional).<br>3. Image uploader should support drag-and-drop and file selection, with a preview.	A modal dialog (shadcn/ui Dialog) or a side sheet (Sheet) for the form. The image uploader should show a circular preview.	- Data stored in Players collection.<br>- Appwrite storage.createFile() for the image, storing the returned File ID in the player document.<br>- Use ID.unique() for player document IDs.	1. User can open the form and fill it out.<br>2. Upon submission, a new document is created in the Players collection.<br>3. If an image is provided, it is visible in Appwrite Storage and linked correctly.
EPIC 2: The Personalized Dashboard
ID	User Story	Functional Requirements	UI/UX Wireframe Concepts	Technical Implementation Notes	Acceptance Criteria
F-2.1	As a user, I want to select a "main player" for whom the dashboard displays stats.	1. A prominent dropdown menu at the top of the dashboard.<br>2. The list should be populated with the firstName and lastName of all players created by the user.<br>3. The user's selection should persist across sessions.	A large, clear dropdown (shadcn/ui Select) next to the dashboard title (e.g., "Alex's Dashboard"). A loading skeleton should be shown while stats are re-fetching.	- Selection state managed by Zustand.<br>- Use Zustand's persist middleware to save the selection to localStorage.<br>- The dashboard page will be a Client Component that uses the Zustand state to trigger data fetching.	1. The dropdown correctly lists all user-created players.<br>2. Changing the player triggers a re-render of all stat components with new data.<br>3. Upon refresh, the previously selected player is still active.
F-2.2	As a user, I want to see high-level statistics like my Win/Loss record.	1. Display three primary stat cards: Total Matches, Win/Loss Record (e.g., "15-8"), and Winning %.<br>2. These stats must be calculated based on the selected player's completed matches where they are playerOneId or playerTwoId and a winnerId is set.	A responsive grid layout. Each card (shadcn/ui Card) has a large number and a clear label. Use Framer Motion's staggerChildren to animate the cards into view on load.	- Data fetched in a Server Component and passed to the client, or fetched client-side via a Server Action.<br>- Appwrite databases.listDocuments with Query.equal('status', 'Completed') and queries for the player ID.	1. The numbers displayed are accurate based on the player's match history.<br>2. The cards are visually distinct and easy to read on all screen sizes.
F-2.3	As a user, I want to visualize deeper statistics.	1. Serve Chart: A bar chart showing Total Aces vs. Total Double Faults.<br>2. Error Chart: A donut chart showing the breakdown of Unforced Errors by shot type (Forehand, Backhand, Other).<br>3. Data must be aggregated by processing the pointLog array for all completed matches of the selected player.	Two-column layout for charts below the main stat cards. Use recharts library, styled to match the shadcn/ui theme. Tooltips on hover should show exact numbers. Animate chart segments on load.	- This is computationally intensive. A Next.js Server Action can perform the aggregation on the backend to avoid sending huge pointLog arrays to the client. The action returns the final aggregated data for the charts.	1. Charts render with data that accurately reflects the pointLog history.<br>2. Charts are interactive (show tooltips) and animated.
EPIC 3: Live Match Scoring

| ID | User Story | Functional Requirements | Technical Implementation Notes | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-3.1 | As a user, I want to set up a new match with custom formats. | 1. A /matches/new route.<br>2. Step 1: Select Player 1 & Player 2 from existing players. Include a button to "Create New Player" which opens the F-1.2 modal.<br>3. Step 2: Configure Match Format (Sets, Ad/No-Ad, Tiebreak rules).<br>4. "Start Match" button creates the match document and redirects to the live scoring page. | A multi-step wizard UI. Use shadcn/ui Card to contain the steps. Use Tabs or custom state to manage the flow. | - On "Start Match", call a Server Action to databases.createDocument in the Matches collection.<br>- The new match document ID is passed to the scoring page URL: /matches/live/{matchId}. | 1. User can select two players and a format.<br>2. A new match document is created in Appwrite with status: 'In Progress'.<br>3. User is redirected to the correct live scoring URL. |
| F-3.2 | As a user, I want to score the match point-by-point. | 1. Display a large, clear scoreboard.<br>2. Two large, tappable areas/buttons for awarding a point to Player 1 or Player 2.<br>3. An "Undo" button to revert the last point.<br>4. The system must correctly calculate and display game, set, and match completion. | The scoreboard should be the main focus. Use large, monospaced fonts for scores. The entire screen half can be the "button" for each player for easy tapping. Animate score changes with a quick flip or fade animation using Framer Motion. | - The scoring logic is managed in a client-side state (e.g., a useReducer hook for complexity).<br>- Each point update triggers a Server Action to update the Matches document in Appwrite (patching the score and adding to the pointLog). | 1. Score updates correctly for points, games, and sets.<br>2. The "Undo" button correctly removes the last point from the log and reverts the score.<br>3. A "Match Over" screen is shown when a winner is determined. |
| F-3.3 | As a user, I want the option to log detailed information for each point. | 1. A toggle switch labeled "Detailed Point Logging".<br>2. When enabled, after a point is awarded, a modal appears with options for Outcome (Winner, Unforced Error, etc.) and Shot Type (Forehand, etc.).<br>3. A "Save Point" button in the modal saves the detail and closes it. A "Simple Point" button saves without detail. | The modal (shadcn/ui Dialog) should be fast and keyboard-navigable. Use RadioGroup for selections. The modal should not be intrusive. | - The detailed data is appended as a structured JSON object to the pointLog array in the Matches document. | 1. The modal appears only when the toggle is on.<br>2. Saving the detailed point adds the correct object structure to the pointLog in Appwrite. |

EPIC 4: Real-Time Match Sharing

| ID | User Story | Functional Requirements | Technical Implementation Notes | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-4.1 | As a scorekeeper, I want to get a unique, shareable link for my live match. | 1. On the live scoring page, a "Share" icon/button must be clearly visible.<br>2. Tapping the button copies the public URL (tenscr.app/live/{matchId}) to the clipboard.<br>3. A visual confirmation (e.g., a toast notification) must be shown. | Use the Share API on supported browsers for a native sharing experience. Fallback to clipboard copy. Use shadcn/ui Toast for confirmation. | - The {matchId} is read from the Next.js useParams hook.<br>- The URL is constructed from the current host and the match ID. | 1. Tapping "Share" copies the correct URL.<br>2. The user receives clear feedback that the link has been copied. |
| F-4.2 | As a viewer with the link, I want to see the score update automatically in real-time. | 1. The public page must be viewable without authentication.<br>2. It must display the same scoreboard as the scorekeeper's view.<br>3. Score changes must appear automatically without a page refresh. | A read-only version of the scoring interface. A "Live" indicator with a blinking red dot to show the connection is active. | - This page uses Appwrite Realtime.<br>- On page load, client.subscribe to the specific document channel.<br>- The callback function updates the local state, causing the UI to re-render with the new score. | 1. The public page loads and shows the current score.<br>2. When the scorekeeper logs a point, the viewer's score updates within 2 seconds.<br>3. The connection is stable. |
| F-4.3 | As a scorekeeper, I want to add commentary and photos. | 1. A simple text input and "Add Comment" button on the scoring screen.<br>2. A camera/image icon to trigger a file input for photo uploads.<br>3. The public page must display comments and photos in a chronological timeline below the scoreboard. | The timeline on the public page should be a simple list. New items should animate in smoothly from the top or bottom. | - Comments and photo IDs are added to a new events array in the Matches document.<br>- This update triggers the Realtime subscription for viewers.<br>- Photos are uploaded to Appwrite Storage. | 1. A submitted comment appears on the viewer's timeline in real-time.<br>2. An uploaded photo appears on the viewer's timeline in real-time. |

5. Data & Analytics Requirements

To measure success and understand user behavior, the following events must be tracked.

Event Name	Trigger	Data to Capture	Purpose
user_signed_up	Successful user registration.	userId	Measure user acquisition.
player_created	A new player profile is saved.	userId, playerId	Understand user engagement with core setup.
match_created	A new match is started.	matchId, matchFormat, isLiveShared	Track core application usage.
match_completed	A match status is changed to "Completed".	matchId, duration (calculated)	Measure user journey completion.
live_match_shared	The "Share" button is clicked on the scoring screen.	matchId, userId	Measure adoption of the key sharing feature.
detailed_point_logged	A point is saved using the detailed logging modal.	matchId, pointDetails	Gauge usage of the advanced tracking feature.
6. Enhanced Non-Functional Requirements
Category	Requirement	Measurement / Acceptance Criteria
Performance	Fast Load Times: The application must feel fast.	- TTFB (Time to First Byte): < 400ms for server-rendered pages.<br>- LCP (Largest Contentful Paint): < 2.0s for the dashboard.<br>- FID (First Input Delay): < 100ms.
Security	Robust Protection: The application must be secure against common web vulnerabilities.	- All database writes are protected via Server Actions.<br>- Appwrite permissions are configured with the principle of least privilege.<br>- Passes automated security scans for XSS, CSRF, and dependency vulnerabilities.
Scalability	Handle Concurrent Load: The system must perform reliably under load.	- Appwrite Cloud and Vercel must handle 1,000 concurrent live match viewers without performance degradation.<br>- Database queries must execute in under 200ms on average.
Reliability	High Availability: The application should be consistently available.	- Target 99.9% uptime for both the Vercel frontend and Appwrite Cloud backend.
Usability	Intuitive & Responsive: The application must be easy to use on any device.	- All features must be fully functional and visually polished on screen widths from 360px to 1920px.<br>- A new user should be able to start and score a simple match without any instructions.
7. Go-to-Market & Launch Plan

Phase 1: Internal Alpha (Team & Friends) - (Target: Q4 2024)

Goal: Validate core functionality and identify major bugs.

Scope: All features in this PRD.

Users: Internal team and a small group of trusted tennis-playing friends.

Phase 2: Closed Beta (Invite-Only) - (Target: Q1 2025)

Goal: Gather feedback on usability, performance, and feature set from target personas.

Scope: v1.0 feature set plus bug fixes from Alpha.

Users: 100-200 invited users from local tennis clubs and online communities.

Phase 3: Public Launch (v1.0) - (Target: End of Q1 2025)

Goal: General availability and begin marketing efforts.

Scope: Polished and stable v1.0 product.

Marketing: Launch on Product Hunt, share in tennis forums (Reddit's /r/10s), and engage with tennis influencers.

8. Future Roadmap (Post v1.0)
Priority	Feature Epic	Description
Next Up	Advanced Doubles Scoring	Allow attributing points, winners, and errors to individual players within a doubles team.
Next Up	Enhanced Stat Visualization	Add shot heatmaps (visual court representation) and performance trend graphs over time.
Later	Practice & Drill Tracking	A dedicated mode to log practice sessions, track drill consistency, and set goals.
Later	Social & Community Features	Public player profiles, head-to-head comparison pages, and the ability to follow other players.
Vision	AI Video Analysis	A premium tier to upload match footage and receive automated stats and video highlights.
Vision	Native Mobile Apps	Dedicated iOS and Android applications for the ultimate on-the-go experience.
9. Assumptions & Open Questions

Assumption: Users are willing to manually log points in detail for the benefit of improved stats.

Assumption: A web-first application will be sufficient for the v1.0 target audience, and a native app is not required for initial traction.

Open Question: What is the long-term monetization strategy? (Freemium, Subscription, Pro Tiers). This will be decided based on Beta feedback.

Open Question: How will we handle offline capabilities for scoring a match if the user loses internet connection? (For v1.0, an active connection is required).

Open Question: What specific rating systems (UTR, NTRP, etc.) should be officially supported vs. being a free-text field?

10. Appendix

Glossary:

BaaS: Backend-as-a-Service (e.g., Appwrite).

SSR: Server-Side Rendering.

USP: Unique Selling Proposition.

WCAG: Web Content Accessibility Guidelines.

Links to Designs: (Placeholder for Figma links)

Links to Technical Docs: (Placeholder for architecture diagrams, API specs)