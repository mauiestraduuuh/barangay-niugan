# Baranagay Niugan Mqanagement System with Digital ID Integration

This is a web-based e-governance system designed for the residents of Barangay Niugan with features for the centralization of resident information, automation of barangay services, provision of secure and accessible digital identification with the use of QR codes. The system utilizes a Role-Based Access Control with the following users: Admin, Staff, Residents, and Super Admin.

## Features:
* Centralised Resident Information
* Digital ID with QR code Verification
* Role-Based Access Control (User Roles: Superadmin, Admin, Staff, Residents)
* Automated Certificate Requests and Generation
* Information Dissemination through Public Announcement
* Dashboards based on User Roles
* Reports and Analytics for Admin and Staff Users
* Responsive Design (Compatible with both desktop and mobile device use)

## Technologies Used:
* Frontend: Next.js, Tailwind CSS
* Backend: Next.js API routes (Node.js)
* Database: Postegre.SQL (Supabase / Prisma)
* Platforms: Git, GitHub, VSCode
* Deployment: Vercel

## Project Structure
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


## Installation and Setup

### 1. Clone the repository

git clone
https://github.com/mauiestraduuuh/barangay-niugan
-repo.git
cd barangay-niugan

### 2. Install Dependencies

npm install

### 3. Create a .env file

PALAGAY NG LAMAN NG ENV NATIN

### 4. Run the development server

npm run dev

#### If setup is complete: 

* Repository is cloned successfully
* Dependencies are installated correctly
* Developer server is running

## Testing and Evaluation

## Authors

Estrada, Maureen M. (Project Manager, Database Lead)
De Borja, Chynna Mae B.(Frontend Developer)
Merzo, Josh Gerald C. (Frontend Developer)
Perpetua, Rowela G. (Backend Developer, Documentation)
Villahermosa, Johanna R. (Backend Developer)









