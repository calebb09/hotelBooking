"use strict";
const express = require("express");
const authController = require("../../controllers/auth");
const userController = require("../../controllers/user");
const accessControl = require("../../controllers/auth").accessControl;
const checkIfAuthenticated = require("../../lib/firebase-middleware");
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *    Users:
 *       type: object
 *       required:
 *         - internal
 *         - username
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of theInternal
 *         internal:
 *           type:  Schema.Types.ObjectId
 *           description: user ID
 *         username:
 *           type:  string
 *           description: profile picture of the user
 *         password:
 *           type:  string
 *           description: first name of the user
 *         role:
 *           type: string
 *           description: last name of the user
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *          data:
 *            - _id: 62dfa36caa26635c1e6f7cab
 *              user:
 *                _id: 62dfa36baa26635c1e6f7ca8
 *                username: caleb@cdiwork.com
 *                is_registered: false
 *                role: super_admin
 *                status: active
 *                internal:
 *                  first_name: Caleb
 *                  last_name: Bogale
 *                  created_at: '2022-07-26T08:18:02.295Z'
 *                  updated_at:
 *          limit: 20
 *          skip: 1
 *          total: 1
 *    UserError:
 *       example:
 *         msg: Error
 *         status: 400
 *    UserSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 *    UserLoginSuccess:
 *       example:
 *         token: eyJhbGciOi..
 *         user:
 *           _id: 62dfa36baa26635c1e6f7ca8
 *           username: caleb@cdiwork.com
 *           is_registered: false
 *           role: super_admin
 *           status: active
 *           corporate_activation_status: false
 *           internal:
 *             _id: 62dfa36caa26635c1e6f7cab
 *             user: 62dfa36baa26635c1e6f7ca8
 *             first_name: Caleb
 *             last_name: Bogale
 *             created_at: '2022-07-26T08:18:02.295Z'
 *             updated_at:
 *    UserLoginError:
 *       example:
 *         msg: Invalid Credentials
 *    UserAuth:
 *       type: object
 *       required:
 *          - username
 *          - password
 *       properties:
 *          username:
 *            type: string
 *          password:
 *            type: string
 *       example:
 *          username: caleb@cdiwork.com
 *          password: '123123'
 *    UserCheckPhone:
 *       type: object
 *       required:
 *          - phone
 *       properties:
 *          phone:
 *            type: number
 *       example:
 *          phone: +251913221899
 *    UserSearchUUID:
 *       type: object
 *       required:
 *         - uuid
 *       properties:
 *         uuid:
 *           type: string
 *       example:
 *         uuid: sWMuAmdF4dfYYwf7kvmnyxMC5UU2
 */
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The Users managing API [v1]
 */
router.get("/", accessControl(["super_admin"]), userController.getUserInfo);
/**
 * @swagger
 * /user/all:
 *   get:
 *     summary: Returns the list of all Users only super_admin can see
 *     tags: [Users]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Users'
 */
router.get("/all", accessControl(["super_admin"]), userController.allUsers);
/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: view loggers profile
 *     tags: [Users]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Users'
 */
router.get(
  "/profile",
  accessControl(["owner", "super_admin", "sales", "receptionist"]),
  userController.profile
);
/**
 * @swagger
 * /user/my_receptionists:
 *   get:
 *     summary: Returns the list of all receptionists only owner can see
 *     tags: [Users]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Users'
 */
router.get(
  "/my_receptionists",
  accessControl(["owner"]),
  userController.myReceptionists
);
/**
 * @swagger
 * /user/logout:
 *   get:
 *     summary: logs out from a session [super_admin, sales, receptionist, owner]
 *     description: all jwt auth users will be logged out if this action is triggered
 *     tags: [Users]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: logs out users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Users'
 */
router.get(
  "/logout",
  accessControl(["receptionist", "owner", "sales", "super_admin"]),
  authController.logout
);
/**
 * @swagger
 * /user/customers/logout:
 *   get:
 *     summary: customers meaning employees and employers logout or destroy firebase session and also device ID
 *     tags: [Users]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: logs out users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Users'
 */
router.get("/customers/logout", checkIfAuthenticated, authController.custLogut);
/**
 * @swagger
 * /user/{uid}:
 *   get:
 *     summary: show speicifc user only super_admin can access this route
 *     tags: [Users]
 *     parameters:
 *      - name: uid
 *        in: path
 *        required: true
 *        type: string
 *        description: enter the user ID mongodb ID not firebase user ID
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: logs out users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Users'
 */
router.get("/:id", accessControl(["super_admin"]), userController.getUser);
/**
 * @swagger
 * /user/password_reset/{id}:
 *   get:
 *     summary: Reset users password, default is 1 - 9 [super_admin can do this for the rest of the users]
 *     tags: [Users]
 *     parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        type: string
 *        description: enter the user ID inorder to reset the password
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: logs out users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Users'
 */
router.get(
  "/password_reset/:id",
  accessControl(["super_admin"]),
  userController.resetPass
);
router.post(
  "/generate_firebase_token",
  accessControl(["admin", "super_admin"]),
  userController.firebase_token
);
router.post("/Users", authController.customerslogin);
/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Login will enable to authenticate and generate the jwt key for all users maning [supe_admin,receptionist,owner,sales]
 *     tags: [Users]
 *     operationId: AdminAuth
 *     requestBody:
 *        description:  admin authentication for the dashboard
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/UserAuth'
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserLoginSuccess'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserLoginError'
 */
router.post("/login", authController.login);
/**
 * @swagger
 * /user/createAdmin:
 *   post:
 *     summary: create an admin, a superadmin authenticated token is required to access the endpoint
 *     tags: [Users]
 *     parameters:
 *      - name: first_name
 *        in: path
 *        required: true
 *        type: string
 *        description: first name of the user
 *      - name: last_name
 *        in: path
 *        required: true
 *        type: string
 *        description: last name of the user
 *      - name: username
 *        in: path
 *        required: true
 *        type: string
 *        description:  create a username must be an email
 *      - name: password
 *        in: path
 *        required: true
 *        type: string
 *        description: password has to be more than 5 characters
 *      - name: user_type
 *        in: path
 *        required: true
 *        type: string
 *        description: the role of the user ["receptionist", "sales", "owner"]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSuccess'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserError'
 */
router.post(
  "/createAdmin",
  accessControl(["super_admin"]),
  userController.createAdmin
);
/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: owner regsiters to the site with no password requirement, password will be automatically generated
 *     tags: [Users]
 *     parameters:
 *      - name: first_name
 *        in: path
 *        required: true
 *        type: string
 *        description: first name of the user
 *      - name: last_name
 *        in: path
 *        required: true
 *        type: string
 *        description: last name of the user
 *      - name: email
 *        in: path
 *        required: true
 *        type: string
 *        description:  create a username with an email
 *      - name: phone
 *        in: path
 *        required: true
 *        type: string
 *        description: phone number of the user
 *      - name: licence
 *        in: path
 *        require: true
 *        description: must upload a business licence
 *        example: "349852352435.jpg"
 *        type: string
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSuccess'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserError'
 */
router.post("/register", userController.register);
/**
 * @swagger
 * /user/create_system_admin:
 *   post:
 *     summary: create an internal user to operate the overall system, this route is one time and super_admin is created on this route
 *     tags: [Users]
 *     parameters:
 *      - name: first_name
 *        in: path
 *        required: true
 *        type: string
 *        description: first name of the user
 *      - name: last_name
 *        in: path
 *        required: true
 *        type: string
 *        description: last name of the user
 *      - name: username
 *        in: path
 *        required: true
 *        type: string
 *        description:  create a username must be an email
 *      - name: password
 *        in: path
 *        required: true
 *        type: string
 *        description: password has to be more than 5 characters
 *      - name: user_type
 *        in: path
 *        required: true
 *        type: string
 *        description: the role of the user
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Users'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserError'
 */
router.post("/create_system_admin", userController.signup);
/**
 * @swagger
 * /user/checkPhone:
 *   post:
 *     summary: check if phone number exists in the users database [super_admin]
 *     tags: [Users]
 *     operationId: checkPhoneExists
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  admin authentication for the dashboard
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/UserCheckPhone'
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSuccess'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserError'
 */
router.post(
  "/checkPhone",
  accessControl(["admin", "super_admin"]),
  userController.checkPhone
);
/**
 * @swagger
 * /user/create_reception:
 *   post:
 *     summary: create receptionist to have some control over the accommodation [owner]
 *     tags: [Users]
 *     parameters:
 *      - name: first_name
 *        in: path
 *        required: true
 *        type: string
 *        description: first name of the user
 *      - name: last_name
 *        in: path
 *        required: true
 *        type: string
 *        description: last name of the user
 *      - name: username
 *        in: path
 *        required: true
 *        type: string
 *        description:  create a username must be an email
 *      - name: password
 *        in: path
 *        required: true
 *        type: string
 *        description: password has to be more than 5 characters
 *      - name: user_type
 *        in: path
 *        required: true
 *        type: string
 *        description: the role of the user
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Users'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserError'
 */
router.post(
  "/create_reception",
  accessControl(["owner"]),
  userController.create_reception
);
router.post("/forgot_password", userController.forgotPassword);
router.param("id", userController.validateUser);
router.put(
  "/changeRole",
  accessControl(["admin", "super_admin"]),
  userController.changeRole
);
/**
 * @swagger
 * /user/activate/account:
 *   put:
 *     summary: activate the user account by passing the email param
 *     tags: [Users]
 *     parameters:
 *      - name: email
 *        in: path
 *        required: true
 *        type: string
 *        description: email address
 *      - name: reason
 *        in: path
 *        type: string
 *        description: if account_status is rejected then this field is requied
 *      - name: account_status
 *        in: query
 *        required: true
 *        explode: true
 *        description: select the account_status either active or deleted
 *        schema:
 *          type: string
 *          default: active
 *          enum:
 *            - active
 *            - rejected
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSuccess'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserError'
 */
router.put("/activate/account", userController.activateAccount);
/**
 * @swagger
 * /user/password/update?email={email}&token={token}:
 *   put:
 *     summary: Update password for the dashboard users only
 *     description: user is directed to this route to set new password, email and reset token is required to access this route
 *     tags: [Users]
 *     parameters:
 *      - name: email
 *        in: path
 *        required: true
 *        type: string
 *        description: user email address
 *      - name: token
 *        in: path
 *        required: true
 *        type: string
 *        description: reset token
 *      - name: new_password
 *        in: path
 *        required: true
 *        type: string
 *        description: Old Password of the user
 *      - name: confirm_password
 *        in: path
 *        required: true
 *        type: string
 *        description: New Password
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSuccess'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserError'
 */
router.put("/password/update", userController.passwordChange);
router.put(
  "/:id",
  accessControl(["admin", "super_admin"]),
  userController.updateUser
);
/**
 * @swagger
 * /user/password/{uid}:
 *   put:
 *     summary: Update password for the specific user super admin authentication is required to do so
 *     tags: [Users]
 *     parameters:
 *      - name: uid
 *        in: path
 *        required: true
 *        type: string
 *        description: the user ID
 *      - name: old_password
 *        in: path
 *        required: true
 *        type: string
 *        description: Old Password of the user
 *      - name: new_password
 *        in: path
 *        required: true
 *        type: string
 *        description: New Password
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSuccess'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserError'
 */
router.put(
  "/password/:id",
  accessControl(["super_admin"]),
  userController.updateUserPass
);
/**
 * @swagger
 * /user/{uid}/remove_receptionist:
 *   delete:
 *     summary: remove an internal receptionist form the system [owner]
 *     tags: [Users]
 *     parameters:
 *      - name: uid
 *        in: path
 *        required: true
 *        type: string
 *        description: the user ID
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSuccess'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserError'
 */
router.delete(
  "/:id/remove_receptionist",
  accessControl(["owner"]),
  userController.removeReceptionist
);
/**
 * @swagger
 * /user/{uid}:
 *   delete:
 *     summary: remove an internal user form the system [super_admin]
 *     tags: [Users]
 *     parameters:
 *      - name: uid
 *        in: path
 *        required: true
 *        type: string
 *        description: the user ID
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSuccess'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserError'
 */
router.delete(
  "/:id",
  accessControl(["super_admin"]),
  userController.removeUser
);

module.exports = router;
