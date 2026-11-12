const express = require("express");
const FacilityController = require("../../controllers/facility");
const accessControl = require("../../controllers/auth").accessControl;
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Facility:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the Facility
 *         name:
 *           type: string
 *           description: the customer firebase user UID
 *         icon:
 *           type: string
 *           description: if the facility has an icon please insert here
 *           example: <i class="fa fa-icon"></i>
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *         data:
 *           - _id: 62f612951a140f007ed61432
 *             name: free wifi
 *             icon: <i class=faviconicon></i>
 *             updated_at: '2022-08-30T09:12:48.43Z'
 *             created_at: '2022-08-12T08:00:27.607Z'
 *         limit: 20
 *         skip: 1
 *         total: 1
 *     FacilityLists:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: objectId
 *           description: The auto-generated id of the Facility
 *         name:
 *           type: string
 *           description: the customer firebase user UID
 *           example: free wifi available
 *         icon:
 *           type: string
 *           description: if the facility has an icon please insert here
 *           example: <i class="fa fa-icon"></i>
 *         created_at:
 *           type: date
 *           description: The date applied
 *           example: 2024-08-12T00:000:00Z
 *         updated_at:
 *           type: date
 *           description: the date updated
 *     FacilityError:
 *       example:
 *         msg: Error
 *         status: 400
 *     FacilitySuccess:
 *       example:
 *         msg: successful
 *         status: 200
 */
/**
 * @swagger
 * tags:
 *   name: Facility
 *   description: The Facility managing API [v1]
 */
/**
 * @swagger
 * /facility/?page=1:
 *   get:
 *     summary: Returns the list of all Facilities
 *     tags: [Facility]
 *     responses:
 *       200:
 *         description: The list of Facilitys meaning mobile Facility
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Facility'
 */
router.get("/", FacilityController.fetchAll);
/**
 * @swagger
 * /facility/lists:
 *   get:
 *     summary: Returns the list of all Facilities
 *     tags: [Facility]
 *     responses:
 *       200:
 *         description: The list of Facilitys meaning mobile Facility
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FacilityLists'
 */
router.get("/lists", FacilityController.lists);
/**
 * @swagger
 * /facility/{did}:
 *   get:
 *     summary: Returns the single Facility
 *     tags: [Facility]
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Facility ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The specific Facility detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Facility'
 */
router.get("/:id", FacilityController.fetchOne);
/**
 * @swagger
 * /facility:
 *   post:
 *     summary: Create Facility detail this is used by the firebase registered users that uses the mobile app
 *     tags: [Facility]
 *     operationId: CreateFacility
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Facility
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Facility'
 *     responses:
 *       200:
 *         description: Create Facility ID and fcm token of the Facility that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FacilitySuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FacilityError'
 */
router.post("/", accessControl(["super_admin"]), FacilityController.create);
router.param("id", FacilityController.validateFacility);
/**
 * @swagger
 * /facility/{did}:
 *   put:
 *     summary: Update Facility detail this is used by the firebase registered users that uses the mobile app
 *     tags: [Facility]
 *     security:
 *     -   bearerAuth: []
 *     operationID: update Facility
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Facility ID of mongodb
 *     requestBody:
 *        description:  Update Facility
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateFacility'
 *     responses:
 *       200:
 *         description: Update Facility ID and fcm token of the Facility that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FacilitySuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FacilityError'
 */
router.put(
  "/:id",
  accessControl(["admin", "super_admin"]),
  FacilityController.update
);
/**
 * @swagger
 * /facility/{did}:
 *   delete:
 *     summary: remove Facility
 *     tags: [Facility]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: the Facility id of the mongodb
 *     responses:
 *       200:
 *         description: remove Facility by Facility id generated by the mongodb _id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FacilitySuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FacilityError'
 */
router.delete(
  "/:id",
  accessControl(["admin", "super_admin"]),
  FacilityController.deleteFacility
);

// Expose User Router
module.exports = router;
