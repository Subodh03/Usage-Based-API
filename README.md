````````````````````````````````````````````````````````**KEY FORGE Usage Billing Platform**
**1.Introduction**
Key Forge is a MERN Stack, Usage based API billing platform that enables developers to monetize their APIS by tracking usage, managing API keys, and generating invoices automatically. It bridges the gap between building an API and charging for it.

**2 Use Case**
 (API Owner)
Use Case	Description	Outcome
Sign Up	User registers with name, email, password, and selects a plan	Account created, JWT issued, default API provisioned in MongoDB
Login	User authenticates with email and password	Access token (15 min) and refresh token (7 days) issued
Generate Keys	User generates a new API key for their API. Key is shown once and never stored in plain text.	bcrypt-hashed key stored in MongoDB; raw key shown once to user
Rotate Keys	User rotates an existing key. Old key remains valid for 5 minutes to avoid downtime.	New key generated; old key auto-revoked after grace period
View Usage	User views consumed tokens, remaining tokens, error count, and daily chart	Live data pulled from MongoDB Usage Log collection
Upgrade Plan	When free limit is hit, a modal prompts the user to upgrade to Pro or Enterprise	Plan and rate limit updated instantly; API unblocked

2.2 Admin Usecase
Actions	Description
View All User 	See every registered user with their plan, key count, and amount due
Edit Token Limit	Admin sets a custom request limit for any user (e.g. reduce from 1000 to 100)
Delete User	Admin permanently removes a user and all their data
View All Keys	Browse all API keys across all users with status and plan

**3 Industry Value**

The API economy is growing at over 20% annually. Every major cloud platform — AWS, Stripe, OpenAI, Twilio — uses usage-based billing. KeyForge provides the exact infrastructure needed to participate in this economy.
It has also a business values like Revenue aligned usage where customer pay exactly as per the usage It also provide Free tier with automatic upgrade prompts
This too has Real World Applications
•	API provides charging per tokens 
•	Api Billing per lookup
•	Communication Platforms
**4 Roles	**
KeyForge implements role based access control
Property	API Owner	Admin
Assigned 	Registration	Created via create admin.js
Auth	JWT access tokens	Same JWT system
User management	None 	Delete Users set custom tokens
Upgrade	Prompt automatic when limit is reached 	Can manually adjusted

**5. Tech Stack**
•	Node.js- Runtime
•	Express.js- Framework	
•	MongoDB – Database	
•	HTML -Frontend
•	Thunder Client- To use API
•	Auth- JWT 
**6. Technologies Detailed Explanation**

6.1 MongoDB 
Stores data as JSON like Documents inside Collection. There are 5 Collection used USERS APIS APIKEYS USAGELOGS 
o	USERS: - Stores name, email, role 
o	APIS: - Stores name, Owner, Plan, Rate limit
o	APISKEYS: - Stores API, Owner
o	 USAGELOGS: -Stores Api, Api key

6.2 JWT Authentication 
JSON Web Tokens are used for two purposes: short-lived access tokens (15 minutes) for API requests, and long-lived refresh tokens (7 days) for issuing new access tokens without re-login
**7 Functionalities**
    7.1 User Feature 
•	Sign up with plan selection (Free / Pro / Enterprise)
•	Login with JWT access + refresh token issuance
•	Auto-login on page reload using stored token
•	Dashboard: overview of requests used, tokens remaining, errors, amount due
•	Live token countdown — remaining tokens colour-code green → amber → red
•	Usage progress bar always visible; turns red at 90%+ usage
•	API Keys tab: generate, rotate (5 min grace), revoke instantly
•	Usage tab: daily bar chart for 7 days, per-key request breakdown
•	Billing tab: invoice generation, plan details, one-click payment
•	Upgrade modal: automatically shown when limit hit or manually from Billing tab
•	Plan upgrade (Pro / Enterprise) applies immediately without re-login

  7.2 Admin Feature

•	Separate admin login (admin@keyforge/ Admin1234!)
•	Platform overview: total users, active keys, requests today, pending revenue
•	Users list: name, email, plan badge, key count, amount due
•	Edit any user's free token limit inline — type new value and click Save
•	Delete any user with cascade: removes all keys, logs, invoices, and account
•	All keys view: every API key across all users with owner and status

**10 Conclusion****
KeyForge demonstrates a complete, production-ready implementation of a usage-based API billing platform. Every component — from JWT authentication and secure API key management to real-time usage tracking and automated billing — works together as a cohesive system.


