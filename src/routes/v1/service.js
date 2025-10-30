const express = require("express");
const ServiceController = require("../../controllers/service");
const accessControl = require("../../controllers/auth").accessControl;
const Authenticated = require("../../lib/firebase-middleware");
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     ServiceCharge:
 *       type: object
 *       required:
 *         - name
 *         - number_of_booking
 *         - amount
 *       properties:
 *         data:
 *          type: array
 *          items:
 *           type: object
 *           properties:
 *            _id:
 *              type: objectId
 *              description: The auto-generated id of the Service
 *              example: 390123423423413241
 *            name:
 *              type: string
 *              description: name of the service
 *              example: Standard
 *            number_of_booking:
 *               type: array
 *               example:
 *                - 0
 *                - 5
 *            amount:
 *              type: string
 *              description: service charge percentage. decimal format is a must
 *              example: 20%
 *            created_at:
 *              type: date
 *              description: The date applied
 *            updated_at:
 *              type: date
 *              description: the date updated
 *            created_by:
 *              type: object
 *              properties:
 *                _id:
 *                  type: objectId
 *                  description: the mongodb id
 *                  example: 1
 *                username:
 *                  type: string
 *                  exampel: Zeus Amon
 *                password:
 *                  type: string
 *                  example: 3091283023520495243523452345234
 *                  description: password is hashed
 *                created_at:
 *                  type: date
 *                  example: 2024-04-20
 *         limit:
 *          type: number
 *          description: limit per pagination
 *          example: 10
 *         skip:
 *          type: number
 *          description: the current page number
 *          example: 1
 *         total:
 *          type: number
 *          description: total number of results displayed
 *          example: 10
 *     ServiceError:
 *       example:
 *         msg: Error
 *         status: 400
 *     ServiceSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 */
/**
 * @swagger
 * tags:
 *   name: Service
 *   description: The Service managing API [v1]
 */
/**
 * @swagger
 * /service_charge/:
 *   get:
 *     summary: Returns the list of all Service super_admin, admin, only access this route
 *     tags: [Service]
 *     responses:
 *       200:
 *         description: The list of Services are displayed here
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceCharge'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceError'
 */
router.get("/", ServiceController.showSerivce);
/**
 * @swagger
 * /service_charge/{id}:
 *   get:
 *     summary: Returns the specific of Service super_admin, admin, only access this route
 *     tags: [Service]
 *     parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        type: string
 *        description: Service ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The list of Services meaning mobile Service
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceCharge'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceError'
 */
router.get("/:id", ServiceController.fetchOne);
/**
 * @swagger
 * /service_charge/create:
 *   post:
 *     summary: create service charge action performed by super_admin
 *     tags: [Service]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  create service
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ServiceCharge'
 *     responses:
 *       200:
 *         description: The list of Services meaning mobile Service
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceError'
 */
router.post(
  "/create",
  accessControl(["super_admin"]),
  ServiceController.createService
);
/**
 * @swagger
 * /service_charge/{id}:
 *   put:
 *     summary: Update service charge in super_admin
 *     tags: [Service]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        type: string
 *        description: Service ID the mongodb ID created by default
 *     requestBody:
 *        description:  create service
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ServiceCharge'
 *     responses:
 *       200:
 *         description: The list of Services meaning mobile Service
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceError'
 */
router.put(
  "/:id",
  accessControl(["super_admin"]),
  ServiceController.updateService
);
/**
 * @swagger
 * /service_charge/{id}:
 *   delete:
 *     summary: remove service charge in super_admin
 *     tags: [Service]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        type: string
 *        description: Service ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The list of Services meaning mobile Service
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceError'
 */
router.delete(
  "/:id",
  accessControl(["super_admin"]),
  ServiceController.deleteService
);
router.param("id", ServiceController.validateService);
// Expose User Router
module.exports = router;
