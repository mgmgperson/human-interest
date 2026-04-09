# AI Usage

## Tools Used

- ChatGPT (GPT-5.3) + Claude + Gemini - ideation for architectural design and options
- GitHub Copilot - boilerplate generation
- Claude Code (IDE)- main code implementation after structural design completed

---

## How AI Was Used

### 1. Architecture & Design
I already had an idea of how the app was going to go, but since I had questions about tradeoffs, it was used for more ideation on what options and approaches there even were in the first place, including the monolith vs. microservice debate.

Used mainly for:
- Service layer structure
- Data modeling (Account, Card, Transaction, Deposit)
- Concurrency handling using database transactions

I ended up keeping my own architecture and tech stack after validating it, and iteratively working on the DB schema with the AI.

---

### 2. Implementation Support
Assisted with:
- Generating initial API route scaffolding
- Suggesting file patterns for service/repository separation

All logic, especially around transaction correctness and concurrency, was reviewed and rewritten where necessary. At this point, there was a good sense of how code was going to work.

---

### 3. Debugging & Iteration
I mainly debugged manually, making edits and questions on errors when needed. For iteration, I used Claude Code's planning to make a detailed plan first, reviewed and made comments iteratively, then actually executed the code implementation. 

Even during the implementation, I only put it on `Ask before Edit` mode to review myself, and make comments on how we should do things as well. 

---

### 4. Documentation
I wrote the logic and provided my own draw.io diagram behind architecture and the README, but I did have the AI help in formatting my diagram into actual ASCII code, among other tables and structures.

---

## Representative Prompts / Workflows

It's a bit difficult to have representative prompts for me, since I tend to provide the AI with the most information as possible. For initial ideation, I pasted the entire prompt into it, with the following:

> I am to design, coding best practices + good architecture will be best for this. I first want to know how I should architect this (software patterns, etc.) as well as filesystem it. Do note that good UX and UI practices are also good here. Here's the requirements: ...

> I likely do not need to overengineer this, but I must do an architecture that can handle concurrency and virtual debit cards. I am already thinking of a two-service structure, frontend/backend split.

---

> @README.md  Yes, let's plan for backend. I'm planning it to be a classic backend with separation of logic, router, services, types in a separate folder and such. We can kind of deviate from the original original plan here and go towards what we believe is best coding practice, good for showing to the recruiter/engineers. Obviously, we have to take care of the db first, migration + seeding, with the schema we provided earlier. Let's take care of schema, db migrations + seeding, as well as db interactions (how we're gonna do it) before doing the rest of backend.

---

## Example of Incorrect or Incomplete AI Output

At one point, I noticed that the AI was building and interacting the DB in a completely different manner than what I wanted to do.

- Placing the db output into the wrong folder
- Using raw SQL statements in controllers instead of a repo layer 
- Using in-memory locking for concurrency instead of described processes
- Wrong WAL settings for interacting w/r with the DB.

How I corrected it, was quite literally going in the `Ask before Edit` mode, and when I saw something wrong with the code or the file structure, I would leave a comment to guide it, regenerating until we got it right. Every edit I would hand review the code to see if it's the right behavior, using comments (and even generating some) to understand the code better.

---

## Verification Strategy

### 1. Manual Testing
- Created accounts, deposits, cards, and transactions via the UI
- Verified approval/decline behavior for different merchant categories
- Confirmed balance updates were accurate

---

### 2. Concurrency Testing
- Simulated concurrent transactions against the same account by directing it to create a separate UI for testing
- Verified:
  - balance didn't become negative
  - only valid transactions were approved
  - conflicting transactions were handled in queues

---

### 3. Code Review
- All AI-generated code was manually reviewed, as mentioned before.
