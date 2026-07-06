Pairr API Documentation
1. Authentication Routes (/api/auth)
POST /signup: Register a new user.

POST /login: Authenticate an existing user.

GET /logout: Terminate the user session.

GET /refresh-token: Renew the authentication token.

2. Profile Routes (/api/profile)
GET /view: Retrieve the current user's profile details.

POST /edit: Update profile information.

POST /password: Change account password.

3. Connection Request Routes (/api/request)
Valid status options: interested, ignore, accept, reject

POST /request/send/interested/:userId: Mark a user as "interested."

POST /request/send/ignore/:userId: Mark a user as "ignore."

POST /request/review/accept/:requestId: Accept a pending request.

POST /request/review/reject/:requestId: Reject a pending request.

4. User Data Routes (/api/user)
GET /user/requests/received: Fetches all pending requests with status "interested."

GET /user/connnections: Fetches all successfully connected users (accepted by both parties).

GET /user/feed: Gets a feed of all users who are not current connections but are present in the app.
