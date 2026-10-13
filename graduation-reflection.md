# Graduation Reflection

The themes I explored—from AI foundations and prompting to reasoning, research, automation, product thinking, multimodal tools, knowledge systems, agentic systems, and multi-agent collaboration—encouraged me to treat building as a process, not a single prompt.

For the 10-day capstone, I applied that mindset to the AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace. I followed a practical development loop: shaping requirements, connecting React and TypeScript to FastAPI, normalizing Linux evidence, reconstructing timelines, producing deterministic findings, managing browser-local cases, and exporting reports. Specific decisions and debugging taught me a lot: choosing browser-native PDF printing over a fragile dependency, resolving the frontend/backend port mismatch by configuring port 8010, adding sample-path traversal defenses, and improving mobile navigation and accessibility.

The reported final checks were 71 passing backend tests, 13 passing report-verification checks, and a successful frontend production build. I learned that a passing build is not the same as a verified user journey, and credible engineering requires documenting limitations. This is a portfolio/demo MVP; authentication and rate limiting remain future priorities.

I leave the sprint with a stronger routine: inspect, change incrementally, test, explain trade-offs, and protect data. Next, I will finish release checks, publish responsibly, and keep building beyond Day 60.
