# SPARK
Small Platform for Agile Rapid Creation
Problem Statement Canvas

1. Context (When & Where)
•	Trigger Event: A non-technical or semi-technical employee creates a custom mini-tool or script on their local computer using an AI coding agent (e.g., Cursor, Windsurf) to automate a repetitive daily task.
•	Situation: A teammate sees the tool and asks for a shareable link so they can use it too.
•	Environment: Fast-paced enterprise environments where internal teams rely heavily on AI to build custom, task-specific workflows.

3. Customers / Target Audience (Who)
•	Primary Users: Non-technical business employees (Marketing Specialists, HR Coordinators, Operations Leads) who build local AI tools to automate daily work.
•	Secondary Users: Team Managers seeking friction-free collaboration across their departments.
•	Key Stakeholders: IT Administrators & System Engineers responsible for enterprise network security, single sign-on (SSO), and cloud software budgets.

5. The Core Problem (What)
•	The Gap: Software creation has become effortless through AI agents, but software hosting and deployment remain painfully complex.
•	The Barrier: Local AI tools run on localhost and cannot be shared with colleagues without deploying them to a cloud provider.
•	Mismatch: Legacy cloud providers (AWS, Azure, Google Cloud) were designed for enterprise-scale software ("Big Software")—requiring manual setup of servers, DNS routing, Docker containers, and complex security rules for a tool that took 2 minutes to create.

7. Current Alternatives & Shortcomings (How it's solved today)
•	Alternative 1: Traditional Clouds (AWS, GCP, Vercel)
o	Shortcoming: Extremely high setup friction; requires DevOps knowledge, manual domain configurations, and complex IAM security rules.
•	Alternative 2: Screen Sharing & Local Demos
o	Shortcoming: The tool stays locked on one employee’s laptop. If they are offline or on vacation, nobody else can run the workflow.
•	Alternative 3: Terminal Command Hand-off
o	Shortcoming: Non-technical team members get stuck trying to install Python, Node.js, dependencies, or terminal commands.

9. Emotional & Operational Impact (Why it hurts)
•	For Employees: Frustration and loss of momentum when useful AI tools get stuck on local machines.
•	For Team Managers: Inefficiency, siloed knowledge, and team members reverting to manual workarounds.
•	For IT Administrators: Risk of Shadow IT (employees uploading company data to unvetted third-party converter sites) and fear of untrusted AI-generated code compromising corporate networks.

11. Quantifiable Impact (The Measurable Cost)
•	Time Wasted: 2+ hours spent attempting cloud deployment or manual setups for a tool that took 2 minutes to generate.
•	Cloud Cost Inefficiency: Abandoned cloud servers running 24/7 on AWS/Azure, accumulating continuous monthly idle costs.
•	Productivity Loss: Hundreds of hours spent weekly on repetitive spreadsheet and report formatting tasks that could be automated by shared micro-tools.

13. The Solution Space / Vision (What success looks like)
•	The "Google Docs for Apps": A lightweight, zero-config hosting platform that accepts direct deployments from AI agents.
•	Instant URL Generation: Assigns a live, secure web link immediately upon deployment.
•	Zero-Code Authentication: Automatically intercepts incoming web traffic to enforce company SSO (Google Workspace, Okta) without requiring embedded auth code.
•	Sandboxed Security & Scale-to-Zero: Runs untrusted AI code in isolated micro-environments (e.g., Firecracker MicroVMs or WebContainers) and scales down to $0 compute cost when idle.



