# DevPulse API

A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

## Live API

https://devpulse-gg67.onrender.com

## Tech Stack

* Node.js
* Express.js
* TypeScript
* PostgreSQL (NeonDB)
* JWT Authentication
* bcrypt
* Render

## Features

* User Registration
* User Login
* JWT Authentication
* Create Issue
* Get All Issues
* Get Single Issue
* Update Issue
* Delete Issue
* Role-Based Authorization
* PostgreSQL Database Integration

## API Endpoints

### Authentication

#### Register User

POST /api/auth/signup

#### Login User

POST /api/auth/login

### Issues

#### Create Issue

POST /api/issues

#### Get All Issues

GET /api/issues

#### Get Single Issue

GET /api/issues/:id

#### Update Issue

PATCH /api/issues/:id

#### Delete Issue

DELETE /api/issues/:id

## Environment Variables

Create a .env file and add:

DATABASE_URL=your_database_url

JWT_SECRET=your_secret_key

PORT=5000

## Installation

Clone the repository:

git clone

Install dependencies:

npm install

Run development server:

npm run dev

Build project:

npm run build

Start production server:

npm start

## Roles

### Contributor

* Create issues
* Update own issues when status is open

### Maintainer

* Update any issue
* Delete any issue

## Author

Dipol
