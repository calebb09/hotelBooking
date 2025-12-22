const express = require("express");
const BookingController = require("../../controllers/booking");
const accessControl = require("../../controllers/auth").accessControl;
const Authenticated = require("../../lib/firebase-middleware");
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     booking:
 *       type: object
 *       required:
 *         - room
 *         - checkIn
 *         - checkOut
 *         - guests
 *         - currency_type
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the Booking
 *         currency_type:
 *           type: string
 *           description: type of currency either "USD" or "ETB". not saved in the database
 *           example: "ETB"
 *         Room:
 *           type: array
 *           description: roomingId
 *           example:
 *            - 48234582734502345-234
 *            - 48234582734502345-235
 *            - 48234582734502345-236
 *         guests:
 *           type: object
 *           properties:
 *            adult:
 *              type: number
 *              example: 2
 *            children:
 *              type: number
 *              example: 2
 *            children_age:
 *              type: array
 *              example:
 *                - 5
 *                - 13
 *         transaction:
 *           type: objectID
 *           example: dsfkjasjfkshfgkj4390tu23
 *         status:
 *           type: string
 *           description: what is the status of the booking
 *           example: Pending
 *         checkIn:
 *           type: date
 *           description: the date of arrival
 *           example: 2024-06-23:T12:00:01Z
 *         is_paid_via_wallet:
 *           type: boolean
 *           description: true or false
 *           example: false
 *         checkOut:
 *           type: date
 *           description: date of departure
 *           example:  2024-06-23:T12:00:01Z
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *     RatingRoom:
 *      type: object
 *      required:
 *        - rate
 *        - review
 *      properties:
 *        rate:
 *          type: number
 *          example: 5
 *          description: the number to rate
 *        review:
 *          type: string
 *          example: good bed
 *          description: user detail description about the stay
 *     BookingError:
 *       example:
 *         msg: Error
 *         status: 400
 *     BookingSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 */
/**
 * @swagger
 * tags:
 *   name: Booking
 *   description: The Booking managing API [v2]
 */
/**
 * @swagger
 * /booking/?page=1:
 *   get:
 *     summary: Returns the list of all Booking super_admin, sales, only access this route
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/booking'
 */
router.get(
  "/",
  accessControl(["super_admin", "sales", "call_center"]),
  BookingController.fetchAll
);
/**
 * @swagger
 * /booking/my_bookings?page=1:
 *   get:
 *     summary: displays lists of the booked documents for the owner and receptionist
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/booking'
 *       400:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.get(
  "/my_bookings",
  accessControl(["owner", "receptionist"]),
  BookingController.myBooking
);
/**
 * @swagger
 * /booking/search?searchTerm={searchTerm}&checkIn={checkIn}&checkOut={checkOut}&tx_ref={tx_ref}&status={status}:
 *   get:
 *     summary: hotel search booking detail
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: searchTerm
 *        in: path
 *        type: string
 *        description: search by name of the guest
 *      - name: checkIn
 *        in: path
 *        type: date
 *        description: checkIn date 2020-09-10
 *      - name: checkOut
 *        in: path
 *        type: date
 *        description: checkOut date format YY-MM-DD
 *      - name: tx_ref
 *        in: path
 *        type: string
 *        description: a special auto generated character to be copy pasted
 *      - name: status
 *        in: path
 *        type: string
 *        description: check by booking status
 *        default: pending
 *        schema:
 *         type: string
 *         enum: [pending, accepted, reserved, completed, cancelled]
 *     responses:
 *       200:
 *         description: The specific Booking detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room'
 *       400:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.get(
  "/search",
  accessControl(["owner", "receptionist"]),
  BookingController.searchBooking
);
/**
 * @swagger
 * /booking/history?page=1:
 *   get:
 *     summary: Returns the list of all Booking for the user meaning firebase authenticated user who have account
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/booking'
 *       400:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.get("/history", Authenticated, BookingController.myHistory);
/**
 * @swagger
 * /booking/txtId/{txtId}:
 *   get:
 *     summary: Returns the booking by txtId
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: txtId
 *        in: path
 *        required: true
 *        type: string
 *        description: put the tx_ref id
 *     responses:
 *       200:
 *         description: The specific Booking detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/booking'
 *       400:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.get("/txtId/:txtId", BookingController.byTxtId);
/**
 * @swagger
 * /booking/{did}:
 *   get:
 *     summary: Returns the single Booking super_admin, admin, only access this route
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Booking ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The specific Booking detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/booking'
 *       400:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.get("/:id", BookingController.fetchOne);
/**
 * @swagger
 * /booking/manual:
 *   post:
 *     summary: owner or receptionist book for client manually
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Booking
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       200:
 *         description: The specific Booking detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingSuccess'
 *       400:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.post(
  "/manual",
  accessControl(["owner", "receptionist"]),
  BookingController.bookingManually
);
router.post(
  "/sortStatus",
  accessControl(["owner", "receptionist"]),
  BookingController.sortOut
);
/**
 * @swagger
 * /booking/request:
 *   post:
 *     summary: users who are logged or not logged will initiate booking request first for directPay
 *     tags: [Booking]
 *     requestBody:
 *        description:  Create Booking, leave the object guest if a client is logged in
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       200:
 *         description: The specific Booking detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingSuccess'
 *       400:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.post("/request", BookingController.requestBooking);
/**
 * @swagger
 * /booking/request_wallet_pay:
 *   post:
 *     summary: users who are logged in using walletpay
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Booking, leave the object guest if a client is logged in
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       200:
 *         description: The specific Booking detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingSuccess'
 *       400:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.post(
  "/request_wallet_pay",
  Authenticated,
  BookingController.requestBookingWallet
);
/**
 * @swagger
 * /booking/filter:
 *   post:
 *     summary: Client searches a room
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: accommodation
 *        in: path
 *        required: true
 *        type: string
 *        description: Booking ID the mongodb ID created by default
 *      - name: checkIn
 *        in: path
 *        required: true
 *        type: date
 *        description: checkIn date 2020-09-10
 *      - name: checkOut
 *        in: path
 *        required: true
 *        type: date
 *        description: checkOut date format YY-MM-DD
 *     responses:
 *       200:
 *         description: The specific Booking detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room'
 *       400:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.post("/filter", BookingController.searchRooms);
router.post("/search/for-one-guest", BookingController.searchforOneGuest);
/**
 * @swagger
 * /booking/{did}/rate:
 *   post:
 *     summary: Client Rates room after booking is completed
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Booking ID the mongodb ID created by default
 *     requestBody:
 *        description: rate room
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/RatingRoom'
 *     responses:
 *       200:
 *         description: The specific Booking detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/booking'
 *       400:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.post("/:id/rate", Authenticated, BookingController.rateRoom);
router.param("id", BookingController.validateBooking);
/**
 * @swagger
 * /booking/make_decision/{did}:
 *   put:
 *     summary: Update Booking detail this is used by the owner, receptionist
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     operationID: update Booking
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Booking ID of mongodb
 *      - name: status
 *        in: path
 *        required: true
 *        type: string
 *        description: status for the booking either [available, occupied, reserved ]
 *        schema:
 *          type: string
 *          default: byKeyword
 *          enum:
 *            - accepted
 *            - cancelled
 *            - reserved
 *            - completed
 *     responses:
 *       200:
 *         description: Update Booking ID and fcm token of the Booking that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.put(
  "/make_decision/:id",
  accessControl(["owner", "super_admin", "receptionist"]),
  BookingController.update
);
/**
 * @swagger
 * /booking/{did}/cancel:
 *   put:
 *     summary: Cancel booking
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     operationID: update Booking
 *     parameters:
 *      - name: did
 *        in: query
 *        required: true
 *        type: string
 *        description: Booking ID of mongodb
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.put("/:id/cancel", BookingController.cancelBooking);
/**
 * @swagger
 * /booking/{did}:
 *   delete:
 *     summary: remove Booking not recommeded to use this route
 *     tags: [Booking]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: the Booking id of the mongodb
 *     responses:
 *       200:
 *         description: remove Booking by Booking id generated by the mongodb _id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingError'
 */
router.delete(
  "/:id",
  accessControl(["receptionist", "super_admin", "owner"]),
  BookingController.deleteBooking
);

// Expose User Router
module.exports = router;
