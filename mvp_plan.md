## 🧭 **Product Overview – 1-Liner Vision**

> A private, AI-powered mobile app for divorced co-parents to resolve one issue at a time through their own personal AI agents, which collaborate through a neutral third mediator AI to create calm, strategy-driven solutions—without ever speaking to each other.

---

## ✅ **Finalized MVP Features – Must-Haves for Phase 1**

1. **Independent Account Creation & Login**
2. **Permanent One-to-One Partner Connection via Partner Code**
3. **Single Active Issue Flow (Only one issue at a time)**
4. **Personal AI Agent Chat for Each Partner (Private)**
5. **Emotion Filtering + I-Statement Conversion by AI**
6. **Mediator AI to Relay Info and Strategize Solutions**
7. **Internal Solution Scoring (≥ 0.8 before proposing)**
8. **Two-Click Solution Agreement (Yes/No from both)**
9. **Solution Iteration Loop (Retry up to 5x)**
10. **Compromise Suggestion if No Agreement after 5 Attempts**
11. **Push Notifications (New issue, New solution)**
12. **Issue History Log (Read-only, uneditable)**
13. **Red Flag Detection & Referral to Authorities**

---

## 👣 **Detailed User Journey**

### 🔹 Onboarding

* **User A:** Creates account → Gets permanent **Partner Code**
* **User B:** Creates account → Enters **Partner Code** to connect
* Both now see: *"Connected to your co-parent"*

---

### 🔹 Starting an Issue

* Home screen shows: "Start New Issue" (if no open issue)
* Either partner can tap → Enters **private AI chat**

---

### 🔹 Chat with Personal AI (Private Space)

* User vents/emotes → AI asks questions to clarify
* AI converts to calm, fact-based **I-statements**
* Shares **key snippets** with Mediator AI (automatically)

---

### 🔹 Mediator AI Process (Invisible to User)

* Receives processed input from both partners' AIs
* Strategizes using **Good Strategy/Bad Strategy** logic
* Scores each solution idea internally
* When score ≥ 0.8 → Proposes it to both users

---

### 🔹 Solution Proposal

* Both receive push notification:
  *"A new solution has been proposed."*

* Each user sees proposal → Clicks \[Yes] or \[No]

* ✅ If both click **Yes** → Issue marked as *Resolved* → Archived in **History Log**

* ❌ If either clicks **No** → Mediator iterates → Retry up to 5 times

* If all fail → Mediator offers **compromise**

---

### 🔹 History Log

* Shows: List of past resolved issues
  *"Pickup issue – Resolved June 22"*
* Cannot be deleted or edited

---

### 🔹 Red Flag Handling

* If abusive or triggering language detected:

  * AI halts conversation
  * Message shown: *"Please seek legal/professional help."*

---

### 🔹 Notifications

* Push notifications sent when:

  * A **new issue** is created by either partner
  * A **solution proposal** is ready

---

## ⚠️ **Edge Case Notes**

| Edge Case                                    | App Behavior                                                    |
| -------------------------------------------- | --------------------------------------------------------------- |
| One partner delays responding                | No timeout enforced. Chat stays open until resolved             |
| A partner sends emotionally charged language | AI neutralizes tone, reframes into I-statements                 |
| A partner sends abusive content              | AI halts session + refers to external help                      |
| One partner never connects via code          | First user remains in "waiting for partner" state               |
| Partner tries to create multiple issues      | App blocks with message: "Please resolve existing issue first." |
| User closes app mid-resolution               | Chat history and AI progress preserved in backend               |
| Solution rejected 5 times                    | Mediator AI triggers compromise solution mode                   |

---

## ⚙️ **Tech Stack + Monetization Plan**

### 🔧 **Tech Stack**

* **Frontend:** Flutter (iOS app only for now)
* **Backend:** Supabase (PostgreSQL DB, Auth, FaaS functions)
* **AI Services:** OpenAI GPT-4o API (3 Agents: Partner A, Partner B, Mediator)
* **Notifications:** Firebase Cloud Messaging
* **Storage:** Supabase Tables for:

  * Users
  * Partner Connections
  * Issues
  * Chat Logs
  * AI Proposals + Scores

---

### 💰 **Monetization Plan**

* **None in MVP Phase 1.**
  The app is free for both users during initial rollout.
* Monetization may be explored post-validation:

  * Paid premium tiers (AI speed, therapist view)
  * Court-compliant reports
  * White-labeled version for legal/mediation professionals

---