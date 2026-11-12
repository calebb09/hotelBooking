const express = require("express");
const AccommoTController = require("../../controllers/accommodation_type");
const accessControl = require("../../controllers/auth").accessControl;
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     AccommodationType:
 *       type: object
 *       required:
 *         - name
 *         - icon
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the AccommodationType
 *         name:
 *           type: string
 *           description: the customer firebase user UID
 *         icon:
 *           type: string
 *           description: the accommodation icon or picture
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *         data:
 *           - _id: 62f612951a140f007ed61432
 *             name: Apartment
 *             icon: <i class="fa fa-icon"></i>
 *             updated_at: '2022-08-30T09:12:48.43Z'
 *             created_at: '2022-08-12T08:00:27.607Z'
 *         limit: 20
 *         skip: 1
 *         total: 1
 *     AccommodationTypeError:
 *       example:
 *         msg: Error
 *         status: 400
 *     AccommodationTypeSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 *     CreateAccommodationType:
 *       type: object
 *       required:
 *         - name
 *         - icon
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the AccommodationType
 *         name:
 *           type: string
 *           description: the name of the property type
 *         icon:
 *           type: string
 *           description: the icon name it could be a url or a font-awesome code
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *         name: Hotel
 *         icon: <i class=facivon></i>
 */
/**
 * @swagger
 * tags:
 *   name: AccommodationType
 *   description: The AccommodationType managing API [v1]
 */
/**
 * @swagger
 * /accommodation_type/?page=1:
 *   get:
 *     summary: Returns the list of all Facilities
 *     tags: [AccommodationType]
 *     responses:
 *       200:
 *         description: The list of AccommodationTypes meaning mobile AccommodationType
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationType'
 */
router.get("/", AccommoTController.fetchAll);
/**
 * @swagger
 * /accommodation_type/{did}/accommodation:
 *   get:
 *     summary: Returns the single AccommodationType
 *     tags: [AccommodationType]
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: AccommodationType ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The specific AccommodationType detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationType'
 */
router.get("/:id/accommodation", AccommoTController.showHotels);
/**
 * @swagger
 * /accommodation_type/{did}:
 *   get:
 *     summary: Returns the single AccommodationType
 *     tags: [AccommodationType]
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: AccommodationType ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The specific AccommodationType detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationType'
 */
router.get("/:id", AccommoTController.fetchOne);
/**
 * @swagger
 * /accommodation_type:
 *   post:
 *     summary: Create AccommodationType detail this is used by the firebase registered users that uses the mobile app
 *     tags: [AccommodationType]
 *     operationId: CreateAccommodationType
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create AccommodationType
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateAccommodationType'
 *     responses:
 *       200:
 *         description: Create AccommodationType ID and fcm token of the AccommodationType that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationTypeSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationTypeError'
 */
router.post("/", accessControl(["super_admin"]), AccommoTController.create);
router.param("id", AccommoTController.validateAccommodationType);
/**
 * @swagger
 * /accommodation_type/{did}:
 *   put:
 *     summary: Update AccommodationType detail this is used by the firebase registered users that uses the mobile app
 *     tags: [AccommodationType]
 *     security:
 *     -   bearerAuth: []
 *     operationID: update AccommodationType
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: AccommodationType ID of mongodb
 *     requestBody:
 *        description:  Update AccommodationType
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateAccommodationType'
 *     responses:
 *       200:
 *         description: Update AccommodationType ID and fcm token of the AccommodationType that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationTypeSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationTypeError'
 */
router.put("/:id", accessControl(["super_admin"]), AccommoTController.update);
/**
 * @swagger
 * /accommodation_type/{did}:
 *   delete:
 *     summary: remove AccommodationType
 *     tags: [AccommodationType]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: the AccommodationType id of the mongodb
 *     responses:
 *       200:
 *         description: remove AccommodationType by AccommodationType id generated by the mongodb _id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationTypeSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationTypeError'
 */
router.delete(
  "/:id",
  accessControl(["super_admin"]),
  AccommoTController.deleteAccommodationType
);

// Expose User Router
module.exports = router;
