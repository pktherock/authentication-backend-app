# Welcome to Authentication API

- built by using Node, express and MongoDB

## Features

- Authentication and Authorization using jwt token
- Session management
- Login
- Register
- Update Profile
- Update Email
- Update Password
- Global Error Handling
- Logging Request and errors
- Extensible code flow and Folder structure
- Best env variable setup

## Code Flow

- First browser sends the request to the server
- Server points to our specific routes
- before the controller, it may be that there will be middlewares or validators or maybe both
- If no Middleware of the validator then the request goes to the specific controller
- Controllers will send back the response, if no need to call services
- Services are basically functions that help us to get data from DB (here is Mongo DB)
- Service may use models to save data in some specific format

Note:
Middleware/validators may or may not be there
Services/models may or may not be there

Image for better understanding

![How-Node-code-works](https://github.com/pktherock/Habit-Tracker/assets/59223750/c8cdaadf-09ad-4c2a-9a24-c618859282e8)

## Packages used in this project.

1. bcrypt
   -> To hash and compare the hashed password
2. compression
   -> To compress res bodies
3. cookie-parser
   -> To interact with cookies
4. dotenv
   -> To store sensitive configurations in a .env file
5. express
   -> To create Servers (with minimal code)
6. express-async-handler
   -> To wrap controller function so that if any error comes it will next function with the error automatically
7. express-rate-limit
   -> To prevent or limit repeated requests to our APIs (a normal user can not send more than 60 requests per second)
8. express-session
   -> To manage Sessions
9. express-validator
   -> To validate request body data
10. helmet
    -> Helmet helps secure Express apps by setting HTTP response headers.
11. jsonwebtoken
    -> To create jwt token
12. nodemailer
    -> To send email
13. winston
    -> It helps us to log the req or res in a straightforward way
14. mongoose
    -> to interact with mongodb
15. connect-mongo
    -> to store all sessions in mongodb
16. swagger-ui-express
    -> to show api docs for better usability of api end points

## How to run this project locally

- Clone this repository
- create a .env file at the root of this project
- create all env variable which is given in the .env.example file with proper info
- then run npm install (to install all packages used in this project)
- then run npm run start
- go to the link shown in the terminal all api docs are there
- you can use postman as well, i have attached one postman-collection (update soon)
  import and change accordingly base on api docs
- Now you are good to go
- Thank YOU

Note:

- if you put mongoUri of atlas, then please store user and password in .env file and uncomment in db.config.js (user and pass) refer .env.example file
- if you are using local mongodb and no user and password is required then comment user and password in db.config.js

### Live Demo Link

[Live Demo Link](https://authentication-backend-app.onrender.com)
