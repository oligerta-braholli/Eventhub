# Endpoint Inventory – EventHub API

## Auth

| Endpoint | Body | Params | Query | 404 | 409 |
|----------|------|--------|-------|-----|-----|
| POST /api/auth/register | ✅ name, email, password, role | — | — | — | ✅ email already exists |
| POST /api/auth/login | ✅ email, password | — | — | ✅ user not found | — |
| GET /api/auth/me | — | — | — | ✅ user not found | — |

## Events

| Endpoint | Body | Params | Query | 404 | 409 |
|----------|------|--------|-------|-----|-----|
| GET /api/events | — | — | ✅ from, to, venue, search | — | — |
| GET /api/events/calendar | — | — | ✅ from (req), to (req) — ISO 8601 | — | — |
| GET /api/events/:id | — | ✅ id (MongoId) | — | ✅ event not found | — |
| POST /api/events | ✅ title, description, venue, startDate, endDate, capacity, ticketTypes | — | — | — | — |
| PUT /api/events/:id | ✅ title, description, venue, startDate, endDate, capacity | ✅ id (MongoId) | — | ✅ event not found | — |
| PATCH /api/events/:id/status | ✅ status | ✅ id (MongoId) | — | ✅ event not found | — |
| DELETE /api/events/:id | — | ✅ id (MongoId) | — | ✅ event not found | — |

## Bookings

| Endpoint | Body | Params | Query | 404 | 409 |
|----------|------|--------|-------|-----|-----|
| POST /api/bookings | ✅ eventId, ticketTypeName, quantity | — | — | ✅ event not found | ✅ already booked |
| GET /api/bookings/my | — | — | — | — | — |
| GET /api/bookings/event/:eventId | — | ✅ eventId (MongoId) | — | ✅ event not found | — |
| DELETE /api/bookings/:id | — | ✅ id (MongoId) | — | ✅ booking not found | — |

## Reviews

| Endpoint | Body | Params | Query | 404 | 409 |
|----------|------|--------|-------|-----|-----|
| GET /api/reviews/event/:eventId | — | ✅ eventId (MongoId) | — | — | — |
| POST /api/reviews | ✅ eventId, rating, comment | — | — | ✅ event not found | ✅ already reviewed |
| DELETE /api/reviews/:id | — | ✅ id (MongoId) | — | ✅ review not found | — |

## Venues

| Endpoint | Body | Params | Query | 404 | 409 |
|----------|------|--------|-------|-----|-----|
| GET /api/venues | — | — | — | — | — |
| GET /api/venues/:id | — | ✅ id (MongoId) | — | ✅ venue not found | — |
| POST /api/venues | ✅ name, address, city, country, capacity | — | — | — | — |

## Waitlist

| Endpoint | Body | Params | Query | 404 | 409 |
|----------|------|--------|-------|-----|-----|
| POST /api/waitlist/:eventId | — | ✅ eventId (MongoId) | — | ✅ event not found | ✅ already on waitlist |
| DELETE /api/waitlist/:eventId | — | ✅ eventId (MongoId) | — | ✅ not on waitlist | — |
| GET /api/waitlist/:eventId | — | ✅ eventId (MongoId) | — | ✅ event not found | — |

## GDPR

| Endpoint | Body | Params | Query | 404 | 409 |
|----------|------|--------|-------|-----|-----|
| GET /api/gdpr/export | — | — | — | — | — |
| DELETE /api/gdpr/anonymize/:userId | — | ✅ userId (MongoId) | — | ✅ user not found | — |
