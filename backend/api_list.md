## auth routes - /api/auth

- POST /signup
- POST /login
- GET /logout
- GET /refresh-token

## profile routes - /api/profile

- GET /view
- POST /edit
- POST /password

## connection routes - /api/request

- status options: ["interested", "ignore", "accept", "reject"]

- POST /request/send/interested/:userId
- POST /request/send/ignore/:userId

- POST /request/review/accept/:requestId
- POST /request/review/reject/:requestId


## user routes - /api/user

### fetches all the pending requests with status as "interested"
- GET /user/requests/received

### fetches all the connection requests which we have accepted as well as the ones which were accepted by the receivers(toUser) we sent it to
- GET /user/connnections

#### get feed of all the users who are not my connections but are present in app
- GET /user/feed