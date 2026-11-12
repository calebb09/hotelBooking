const express = require("express");
const ProfitController = require("../../controllers/profit");
const accessControl = require("../../controllers/auth").accessControl;
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Profit:
 *       type: object
 *       properties:
 *        data:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *              user_information:
 *                  type: object
 *                  properties:
 *                      user_type:
 *                          type: array
 *                          example:
 *                              - client
 *                      user:
 *                         type: object
 *                         properties:
 *                          _id:
 *                              type: objectId
 *                              example: mongodbId
 *                      client:
 *                         type: object
 *                         properties:
 *                          _id:
 *                              type: objectId
 *                              example: mongodbId
 *              currency_type:
 *                  type: string
 *                  description: type of currency either "USD" or "ETB". not saved in the database
 *                  example: "ETB"
 *              amount:
 *                  type: number
 *                  example: 1000
 *              status:
 *                  type: string
 *                  description: what is the status of the booking
 *                  example: Pending
 *              transaction:
 *                  type: objectId
 *                  properties:
 *                      _id:
 *                          type: objectId
 *                          example: objectId
 *              reason:
 *                  type: string
 *                  description: either Package subscription or Booking a room
 *                  example: Booking a room
 *              created_at:
 *                  type: date
 *                  description: The date applied
 *              updated_at:
 *                  type: date
 *                  description: the date updated
 *        limit:
 *          type: number
 *          example: 20
 *        page:
 *          type: number
 *          example: 2
 *        total:
 *          type: number
 *          example: 10
 *        profit:
 *          type: object
 *          properties:
 *            USD:
 *              type: number
 *              example: 120
 *            ETB:
 *              type: number
 *              example: 3000
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
 *   name: Profit
 *   description: The Booking managing API only super_admin access this => route is on => [v2]
 */
/**
 * @swagger
 * /profits/{currency}?page=1:
 *   get:
 *     summary: display all records of profits
 *     tags: [Profit]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: currency
 *        in: path
 *        required: true
 *        type: string
 *        description: Booking ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profit'
 */
router.get(
  "/:currency",
  accessControl(["super_admin"]),
  ProfitController.fetchAll
);
/**
 * @swagger
 * /profits/{did}:
 *   get:
 *     summary: Returns the specific detail info about the profit [super_admin]
 *     tags: [Profit]
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
 *                 $ref: '#/components/schemas/Profit'
 *       400:
 *         description: The list of Bookings meaning mobile Booking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/profitError'
 */
router.get("/:id", accessControl(["super_admin"]), ProfitController.fetchOne);
router.param("id", ProfitController.validateProfit);

// Expose User Router
module.exports = router;
