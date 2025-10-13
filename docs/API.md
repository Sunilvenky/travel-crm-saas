# Travel CRM API

This document outlines the REST API endpoints for the Travel CRM backend.

Base URL: /api

Auth
- POST /api/auth/login => { email, password } -> { token }

Tenants
- GET /api/tenants (Admin)
- POST /api/tenants (Admin)

Users
- GET /api/users (Admin, Manager)
- POST /api/users (Admin)

Leads
- GET /api/leads
- POST /api/leads
- PATCH /api/leads/:id

Customers
- GET /api/customers
- POST /api/customers

Deals
- GET /api/deals
- POST /api/deals

Bookings
- GET /api/bookings
- POST /api/bookings

All requests must include Authorization: Bearer <token>

Error responses
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 500 Internal Server Error
