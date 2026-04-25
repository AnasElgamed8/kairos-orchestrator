## 2026-04-25 - Virtual Body Doubling Integration
- Psychological Basis: Social facilitation; the presence of another person (even virtually) provides a gentle form of external accountability and reduces task initiation friction, which is a core struggle in executive dysfunction.
- Implementation: Implement a P2P WebRTC-based "Focus Room" using Rust for the signaling logic and Tauri for the frontend interface. Allow users to join a shared timer session where they see minimal avatars or low-res video of others working.
- Priority: High
## [Internal Seed 1] - The Flow-Modoro (Adaptive Timing)
- Psychological Basis: Traditional Pomodoros (25/5) can break a "Flow State" just as the user enters it.
- Implementation: If the user is in a "Deep Work" session and the timer hits zero, Kairos asks "Still in Flow?" If yes, it extends the timer by 15 minutes automatically.
- Priority: High

## [Internal Seed 2] - Dopamine Layering (Micro-Rewards)
- Psychological Basis: People with executive dysfunction struggle with "Delayed Gratification."
- Implementation: Every completed "Tiny Step" triggers a satisfying visual/auditory "ping" and a progress bar that fills up, providing immediate dopamine hits.
- Priority: High

## [Internal Seed 3] - The Priming Protocol (Pre-Task Setup)
- Psychological Basis: The "Starting Friction" is the highest barrier.
- Implementation: Before the timer starts, Kairos presents a "Priming Checklist": [ ] Water on desk? [ ] Phone away? [ ] IDE open? The timer only starts once the physical environment is primed.
- Priority: Medium
