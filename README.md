<h1 align="center">Barangay Niugan Management System</h1>

<p align="center">
  <strong>
    A web-based e-governance platform with digital ID integration, resident management, and automated barangay services.
  </strong>
</p>

<p align="center">
  <a href="https://barangay-niugan-d9yi.vercel.app">
    <strong>Live Website</strong>
  </a>
</p>

---

<a id="table-of-contents"></a>

# 📚 Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [User Roles & Permissions](#user-roles--permissions)
- [Usage Guide](#usage-guide)
- [API Overview](#api-overview)
- [Contributing](#contributing)
- [Security](#security)
- [Authors](#authors)
- [License](#license)

---

<a id="about-the-project"></a>

# 📖 About the Project

The **Barangay Niugan Management System with Digital ID Integration** is a full-stack web-based e-governance platform developed to improve barangay operations through centralized resident management, automated public services, and secure digital identification.

The system allows barangay officials and residents to efficiently manage records, request certificates, receive announcements, and verify identities through QR-code-enabled digital IDs.

The platform implements **Role-Based Access Control (RBAC)** with dedicated dashboards and permissions for:

- `SUPER ADMIN`
- `ADMIN`
- `STAFF`
- `RESIDENT`

---

<a id="key-features"></a>

# ✨ Key Features

* Centralised Resident Information
* Digital ID with QR code Verification
* Role-Based Access Control (User Roles: Superadmin, Admin, Staff, Residents)
* Automated Certificate Requests and Generation
* Information Dissemination through Public Announcement
* Dashboards based on User Roles
* Reports and Analytics for Admin and Staff Users
* Responsive Design (Compatible with both desktop and mobile device use)

---

<a id="tech-stack"></a>

# 🛠️ Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Next.js API Routes, Node.js |
| Database | PostgreSQL, Prisma ORM, Supabase |
| Authentication | Custom Authentication + Role-Based Access |
| Deployment | Vercel |
| Tools | Git, GitHub, VS Code |

---

<a id="project-structure"></a>

# 🗂️ Project Structure

```bash
main/
	app/
		admin-front/
			admin-profile/page.tsx
			announcement/page.tsx
			certificate-request/page.tsx
			feedback/page.tsx
			manage-announcement/page.tsx
			registration-code/page.tsx
			registration-request/page.tsx
			reports/page.tsx
			staff-acc/page.tsx
			the-dash-admin/page.tsx
		api/
			admin/
				admin-profile/route.ts
				announcement/route.ts
				certificate-request/route.ts
				feedback/route.ts
				generate certificate/route.ts
				registration-code/route.ts				
				reports/route.ts
				staff/route.ts
				the-dash-admin/route.ts
			auth/
				approve-registration/route.ts
				forgot-password/route.ts
				login/route.ts
				no-email/route.ts
				register-admin/route.ts
				register/route.ts
				reject-registration/route.ts
			dash/
				announcement/route.ts
				certificate-request/route.ts
				digital-id/route.ts
				feedback/route.ts
				notification/route.ts
				resident/route.ts
				the-dash-resident/route.ts
			staff/
				announcement/route.ts
				certificate-request/route.ts
				generate-certificate/route.ts
				registration-code/route.ts
				registration-request/route.ts
				staff-profile/route.ts
				the-dash-staff/route.ts
			superadmin/
				register-admin/route.ts
				reset-db/route.ts
				middleware.ts/route.ts
				staff/route.ts
				superadmin/route.ts
			middleware.ts
		auth-front/
			approve-registration/page.tsx
			login/page.tsx
			register-admin/page.tsx
			register/page.tsx
		barangay-niugan/page.tsx
		components/
			NotificationDropdown.tsx
		dash-front/
			certificate-request/page.tsx
			dashboard/page.tsx
			digital-id/page.tsx
			feedback/page.tsx
			notifications/page.tsx
			resident/page.tsx
			the-dash-resident/page.tsx
		staff-front/
			announcement/page.tsx
			certificate-request/page.tsx
			manage-announcements/page.tsx
			registration-code/page.tsx
			registration-request/page.tsx
			staff-profile/page.tsx
			the-dash-staff/page.tsx
		superAdmin-front/
			confirm-deletion/page.tsx
			register-admin/page.tsx
			reset-database/page.tsx
		global.css
		layout.tsx
		page.tsx
	lib
	prisma/
		migrations
		schema.prisma
	public
	src/app
	.gitignore
	declarations.d.ts
	eslint.config.mjs
	next.config.mjs
```

> The project follows a modular structure separating frontend pages, backend API routes, and Prisma database configuration.

---

<a id="getting-started"></a>

# 🚀 Getting Started

## Prerequisites

Before running the project locally, make sure the following are installed:

- Node.js `18+`
- npm
- PostgreSQL Database / Supabase Project
- Git

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mauiestraduuuh/barangay-niugan-repo.git

cd barangay-niugan-repo
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Create Environment Variables

Create a `.env` file in the root directory.

Example:

```env
DATABASE_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

DIRECT_URL=
```

> Do not commit real environment variables or credentials to GitHub.

---

### 4. Generate Prisma Client

```bash
npx prisma generate
```

---

### 5. Run Database Migration

```bash
npx prisma migrate dev
```

---

### 6. Start the Development Server

```bash
npm run dev
```

Open the application:

```bash
http://localhost:3000
```
> The local host server will automatically open once the 'npm run dev' command is set
---

<a id="user-roles--permissions"></a>

# 👥 User Roles & Permissions

| Feature / Access | SUPER ADMIN | ADMIN | STAFF | RESIDENT |
| --- | --- | --- | --- | --- |
| Login Authentication | ✅ | ✅ | ✅ | ✅ |
| Manage Resident Records | ✅ | ✅ | ✅ | ❌ |
| Generate Certificates | ✅ | ✅ | ✅ | ❌ |
| Request Certificates | ❌ | ❌ | ❌ | ✅ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Manage Announcements | ✅ | ✅ | ✅ | ❌ |
| Approve Registrations | ✅ | ✅ | ❌ | ❌ |
| Manage Staff/Admin Accounts | ✅ | ✅ | ❌ | ❌ |
| Reset Database | ✅ | ❌ | ❌ | ❌ |
| Access Digital ID | ❌ | ❌ | ❌ | ✅ |

## Administrative Distinctions

- `SUPER ADMIN` has complete system access including database reset and admin account management.
- `ADMIN` oversees barangay operations, resident services, and barangay staff account management.
- `STAFF` assists with operational workflows and certificate management.
- `RESIDENT` accesses personal services such as digital ID and certificate requests.

---

<a id="usage-guide"></a>

# 🧭 Usage Guide

## Resident Workflow

1. Register an account.
2. Wait for approval from barangay administration.
3. Login to the resident dashboard.
4. Access digital ID and request barangay certificates.
5. View announcements and notifications.

## Admin / Staff Workflow

1. Login using authorized credentials.
2. Access administrative dashboard.
3. Manage resident records and announcements.
4. Review registration requests.
5. Process certificate requests and reports.

---

<a id="api-overview"></a>

# 🔌 API Overview

The backend API is built using **Next.js API Routes**.

## Main Route Groups

| Route Group | Description |
| --- | --- |
| `/api/auth` | Authentication and registration |
| `/api/admin` | Admin management features |
| `/api/dash` | Resident dashboard services |
| `/api/staff` | Staff operations |
| `/api/superadmin` | Super admin operations |

---

<a id="contributing"></a>

# 🤝 Contributing

Contributions are welcome for bug fixes, improvements, and feature enhancements.

## Contribution Workflow

1. Fork the repository.
2. Create a feature branch.
3. Commit changes with clear messages.
4. Push changes to your branch.
5. Open a pull request.

---

<a id="security"></a>

# 🛡️ Security

## Security Best Practices

- Never expose `.env` files publicly.
- Restrict admin credentials to authorized users only.
- Rotate sensitive credentials regularly.
- Validate and sanitize all user input.
- Use HTTPS in production deployments.

## Important Notice

> Demo or development credentials should never be reused in production environments.

---

<a id="authors"></a>

# 👨‍💻 Authors

| Name | Role |
| --- | --- |
| Estrada, Maureen M. | Project Manager, Database Lead |
| De Borja, Chynna Mae B. | Frontend Developer |
| Merzo, Josh Gerald C. | Frontend Developer |
| Perpetua, Rowela G. | Backend Developer, Documentation |
| Villahermosa, Johanna R. | Backend Developer |

---

<a id="license"></a>

# 📄 License

This project is currently proprietary and intended for academic and organizational use unless otherwise stated by the project owners.
