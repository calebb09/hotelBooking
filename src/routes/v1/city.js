const express = require("express");
const CityController = require("../../controllers/city");
const accessControl = require("../../controllers/auth").accessControl;
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCity:
 *       type: object
 *       required:
 *        - name
 *        - picture
 *       properties:
 *        name:
 *          type: string
 *          example: Addis Ababa
 *        picrure:
 *          type: string
 *          description: get image from an external url or upload it on your server and fetch from it [recommended]
 *          example: https://gojobooking.com/images/cities/1.jpg
 *     City:
 *       type: object
 *       required:
 *         - name
 *         - picture
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the City
 *         name:
 *           type: string
 *           description: name of the city
 *           example: ArbaMinch
 *         picture:
 *           type: string
 *           description: picture url for the city
 *           example: https://addiaba.gov.et/images/24380524535.jpg
 *         is_trending:
 *           type: boolean
 *           description: check if the city is trending true or false
 *           example: true
 *         updated_at:
 *           type: date
 *           description: the date updated
 *     CityError:
 *       example:
 *         msg: Error
 *         status: 400
 *     CitySuccess:
 *       example:
 *         msg: successful
 *         status: 200
 */
/**
 * @swagger
 * tags:
 *   name: City
 *   description: The City managing API [v1]
 */
/**
 * @swagger
 * /city:
 *   get:
 *     summary: Returns the list of all City
 *     tags: [City]
 *     responses:
 *       200:
 *         description: The list of Citys meaning mobile City
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/City'
 */
router.get("/", CityController.fetchAll);
/**
 * @swagger
 * /city/trending:
 *   get:
 *     summary: Returns the list of all City
 *     tags: [City]
 *     responses:
 *       200:
 *         description: The list of Citys meaning mobile City
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/City'
 */
router.get("/trending", CityController.trending);
/**
 * @swagger
 * /city/{cid}/properties:
 *   get:
 *     summary: Returns the list of all City owner, receptionist access to this route
 *     tags: [City]
 *     parameters:
 *      - name: cid
 *        in: path
 *        required: true
 *        type: string
 *        description: City ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The list of Citys meaning mobile City
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/City'
 */
router.get("/:id/properties", CityController.hotels);
/**
 * @swagger
 * /city/{did}:
 *   get:
 *     summary: returns the specific City detail
 *     tags: [City]
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: City ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The specific City detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/City'
 */
router.get("/:id", CityController.fetchOne);
/**
 * @swagger
 * /city:
 *   post:
 *     summary: Create City detail this is used by the 'owner' to create City for its hotel aka accommodation
 *     tags: [City]
 *     operationId: CreateCity
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create City
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateCity'
 *     responses:
 *       200:
 *         description: Create City ID and fcm token of the City that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/cityuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CityError'
 */
router.post("/", accessControl(["super_admin"]), CityController.create);
router.param("id", CityController.validateCity);
/**
 * @swagger
 * /city/{did}:
 *   put:
 *     summary: update specific City information [owner]
 *     tags: [City]
 *     security:
 *     -   bearerAuth: []
 *     operationID: update City
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: City ID of mongodb
 *     requestBody:
 *        description:  Update City
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateCity'
 *     responses:
 *       200:
 *         description: Update City ID and fcm token of the City that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/cityuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CityError'
 */
router.put("/:id", accessControl(["super_admin"]), CityController.update);
/**
 * @swagger
 * /city/{did}:
 *   delete:
 *     summary: remove City action performed by [owner]
 *     tags: [City]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: the City id of the mongodb
 *     responses:
 *       200:
 *         description: remove City by City id generated by the mongodb _id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/cityuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CityError'
 */
router.delete(
  "/:id",
  accessControl(["super_admin"]),
  CityController.deleteCity
);

// Expose User Router
module.exports = router;
