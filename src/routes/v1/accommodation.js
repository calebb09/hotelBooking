const express = require("express");
const AccommodationController = require("../../controllers/accommodation");
const accessControl = require("../../controllers/auth").accessControl;
// const checkIfAuthenticated = require("../../lib/firebase-middleware");
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     accommodationFilter:
 *       type: object
 *       properties:
 *         facilities:
 *           type: array
 *           description: mongodb
 *           example:
 *            - 66bc63a527e53073ad060421
 *         minPrice:
 *           type: number
 *           description: number
 *           example: 68
 *         maxPrice:
 *           type: number
 *           description: number
 *           example: 100
 *         cityId:
 *           type: objectId
 *           description: mongodbId
 *           example: 66bc63a527e53073ad060421
 *         lodgingType:
 *           type: objectId
 *           description: mongodbId
 *           example: 66bc63a527e53073ad060421
 *         minRate:
 *           type: number
 *           description: number
 *           example: 2
 *         maxRate:
 *           type: number
 *           description: number
 *           example: 5
 *     filterAccommodaiton:
 *       type: object
 *       required:
 *        - city
 *        - checkIn
 *        - checkOut
 *        - guests
 *       properties:
 *         city:
 *            type: objectId
 *            exampe: 66d6c713c604c128cd415254
 *         checkIn:
 *            type: date
 *            example: 2024-10-18
 *         checkOut:
 *            type: date
 *            example: 2024-10-21
 *         guests:
 *           type: object
 *           properties:
 *              adult:
 *                 type: number
 *                 example: 2
 *              children:
 *                 type: number
 *                 example: 2
 *              children_age:
 *                 type: array
 *                 example:
 *                    - 1
 *                    - 3
 *     accommodation:
 *       type: object
 *       required:
 *         - job
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the Accommodation
 *         picture:
 *           type: string
 *           description: The applied for job
 *           example:
 *              - skfjsglsdgsdgsd.jpg
 *              - af8230420345324523.png
 *         name:
 *           type: string,
 *           description: The status is by default Pending
 *         address:
 *          type: object
 *          properties:
 *           city:
 *              type: object
 *              description: city is an objectId and populated
 *              properties:
 *                name:
 *                  type: string
 *                  example: Addis Ababa
 *                picture:
 *                  type: stirng
 *                  example: https://domainname.com/image/adskfadsflas.jpg
 *                is_trending:
 *                  type: boolean
 *                  example: true
 *           country:
 *             type: string
 *             description: name of the country
 *           location:
 *             properties:
 *              type:
 *                type: string
 *                example: point
 *              coordinates:
 *                type: number
 *                description: GPS coordination
 *                example: 8.98112892180133, 38.76020386634213
 *              createIndexes:
 *                type: string
 *                example: 2dshpere
 *           phoneAddress:
 *             type: array
 *             example:
 *              - +2510239452435
 *              - +8547923534253
 *           emailAddress:
 *             type: array
 *             example:
 *              - saromaria@hotel.com
 *              - someone@gmail.com
 *         description:
 *           type: string
 *           example: this hotel was founded by the last emperor of Ethipia
 *         facilities:
 *           type: array
 *           description: hotel facilities
 *           example:
 *            - wifi available
 *            - great air and air conditioning system
 *            - midnight cocktail
 *            - barberque program
 *         stuff_language:
 *           type: array
 *           description: the type of language that your staff can speak, outside of this items below will not accept the data entry. create a dropdown menu for multi select
 *           example:
 *            - Amahric
 *            - English
 *            - French
 *            - Oromiffa
 *            - Tigrigna
 *            - Chinese
 *         carParking_available:
 *           type: boolean
 *           example: true
 *           description: if the accommodation have a parking service for its guest
 *         checkIn_checkOut_times:
 *           type: object
 *           properties:
 *            checkIn:
 *              type: array
 *              description: hotel expecting guest to checkIn time
 *              example:
 *                - 2:00AM
 *                - 5:00PM
 *            checkOut:
 *              type: array
 *              description: hotel expecting guest to checkOut time
 *              example:
 *                - 6:30PM
 *                - 10:00PM
 *         lodging_type:
 *           type: ObjectId
 *           description: the kind of accommodation is it
 *           example: 138029482958742352349523
 *         is_verified:
 *           type: boolean
 *           description: if the accommodation is verified by Gojo
 *           example: true
 *         rate_average:
 *           type: number
 *           description: overall rating from all sorts of room
 *           example: 4.3
 *         has_breakfast:
 *           type: boolean
 *           example: true
 *         breakfast_price:
 *           type: number
 *           example: 20
 *         refundable:
 *           type: object
 *           properties:
 *            is_refundable:
 *              type: boolean
 *              example: true
 *            amount:
 *              type: number
 *              example: 22
 *         updated_at:
 *           type: date
 *           description: the date updated
 *           example: 2024.02.33:Z33:49:23
 *         created_at:
 *           type: date
 *           description: the date created
 *           example: 2024.02.33:Z33:49:23
 *         created_by:
 *           type: objectId
 *           descripiton: the person who created this data
 *           example: 48234502345243-5824435234
 *     AccommodationReview:
 *       type: object
 *       properties:
 *        is_verified:
 *          type: boolean
 *          description: true for verified false for unverified
 *          example: true
 *     AccommodationError:
 *       example:
 *         msg: Error
 *         status: 400
 *     AccommodationSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 *     UpdateApplication:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the Accommodation
 *         job:
 *           type: Schema.Types.ObjectId
 *           description: The applied for job
 *         status:
 *           type: string,
 *           description: The status is by default Pending
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *         status: accepted
 *     uploadPicture:
 *       type: object
 *       properties:
 *         picture:
 *          type: array
 *          description: upload as many picture as you want to
 *          example:
 *            - /3235452345423.png
 *            - /4852941442352435.jpg
 *     ApplicationStatus:
 *       type: object
 *       required:
 *         - is_verified
 *       properties:
 *          is_verified:
 *            type: boolean
 *            description: if property is accepted pass true else pass false
 *            example: true
 */

/**
 * @swagger
 * tags:
 *   name: Accommodation
 *   description: The Accommodation managing API [v1]
 */

/**
 * @swagger
 * /accommodation?page=1:
 *   get:
 *     summary: Returns the list of all the Accommodation
 *     tags: [Accommodation]
 *     responses:
 *       200:
 *         description: The list of the Accommodation, the endpoint Accommodation for the admin
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 */

router.get("/", AccommodationController.fetchAll);
/**
 * @swagger
 * /accommodation/unowned?page=1:
 *   get:
 *     summary: Returns the list of unowned properties
 *     tags: [Accommodation]
 *     responses:
 *       200:
 *         description: The list of the Accommodation, the endpoint Accommodation for the admin
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 */
router.get("/unowned", AccommodationController.fetchunOwned);
router.get("/sort", AccommodationController.sortyBy);
/**
 * @swagger
 * /accommodation/international/searchByCity?cityCode={code}:
 *   get:
 *     summary: search hotels based on city Code
 *     tags: [Accommodation]
 *     parameters:
 *      - name: code
 *        in: path
 *        required: true
 *        type: string
 *        description: enter the city ISO-code
 *        default: PAR
 *     responses:
 *       200:
 *         description: The list of the Accommodation, the endpoint Accommodation for the admin
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 */
router.get(
  "/international/searchByCity",
  AccommodationController.internationHotel
);
/**
 * @swagger
 * /accommodation/international/searchRoom?cityCode={code}:
 *   get:
 *     summary: search hotels based on city Code
 *     tags: [Accommodation]
 *     parameters:
 *      - name: hotelIds
 *        in: path
 *        required: true
 *        type: string
 *        description: enter the hotelId capture from the searchByCity route
 *        default: HYNYCTSQ
 *      - name: adults
 *        in: path
 *        required: true
 *        type: string
 *        description: enter the number of adults booking for the hotel
 *        default: 1
 *      - name: checkInDate
 *        in: path
 *        required: true
 *        type: string
 *        description: enter the checking in date
 *        default: 2025-05-21
 *      - name: checkOutDate
 *        in: path
 *        required: true
 *        type: string
 *        description: enter the checking out date
 *        default: 2025-05-25
 *      - name: countryOfResidence
 *        in: path
 *        required: true
 *        type: string
 *        description: Country of residence ISO-2
 *        default: ET
 *      - name: roomQuantity
 *        in: path
 *        required: true
 *        type: string
 *        description: number of room to be rented
 *        default: 1
 *      - name: priceRange
 *        in: path
 *        required: true
 *        type: string
 *        description: set the price range
 *        default: 200-400
 *      - name: currency
 *        in: path
 *        required: true
 *        type: string
 *        description: select the currency
 *        default: ETB
 *        schema:
 *         type: string
 *         enum: [USD, EUR, ETB]
 *      - name: paymentPolicy
 *        in: path
 *        required: true
 *        type: string
 *        description: select payment policy
 *        schema:
 *         type: string
 *         enum: [GUARANTEE, DEPOSIT, NONE]
 *        default: NONE
 *      - name: boardType
 *        in: path
 *        required: true
 *        type: string
 *        description: Filter response based on available meals
 *        default: ROOM_ONLY
 *        schema:
 *         type: string
 *         enum: [ROOM_ONLY, BREAKFAST, HALF_BOARD, FULL_BOARD, ALL_INCLUSIVE]
 *      - name: includeClosed
 *        in: path
 *        required: true
 *        type: string
 *        description: Show all properties (include sold out) or available only. For sold out properties, please check availability on other dates.
 *        default: false
 *        schema:
 *         type: string
 *         enum: [true, false]
 *      - name: bestRateOnly
 *        in: path
 *        required: true
 *        type: string
 *        description: Used to return only the cheapest offer per hotel or all available offers
 *        default: true
 *        schema:
 *         type: string
 *         enum: [true, false]
 *      - name: lang
 *        in: path
 *        required: true
 *        type: string
 *        description: prefered language
 *        default: en
 *        schema:
 *         type: string
 *         enum: [EN, FR, DE]
 *     responses:
 *       200:
 *         description: The list of the Accommodation, the endpoint Accommodation for the admin
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 */
router.get("/international/searchRoom", AccommodationController.searchRooms);
router.get(
  "/clearRooms",
  accessControl(["super_admin"]),
  AccommodationController.clearRooms
);
router.get("/all", accessControl(["super_admin"]), AccommodationController.all);
/**
 * @swagger
 * /accommodation/my_properties:
 *   get:
 *     summary: Returns the list of all the Accommodation
 *     tags: [Accommodation]
 *     responses:
 *       200:
 *         description: The list of the Accommodation, the endpoint Accommodation for the admin
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 */
router.get(
  "/my_properties",
  accessControl(["owner", "receptionist"]),
  AccommodationController.myProperties
);
/**
 * @swagger
 * /accommodation/top_unique?page=1:
 *   get:
 *     summary: Returns the list of all the Accommodation
 *     tags: [Accommodation]
 *     responses:
 *       200:
 *         description: The list of the Accommodation, the endpoint Accommodation for the admin
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 */
router.get("/top_unique", AccommodationController.TopUnique);
/**
 * @swagger
 * /accommodation/trending?page=1:
 *   get:
 *     summary: Returns the list of all the Accommodation
 *     tags: [Accommodation]
 *     responses:
 *       200:
 *         description: The list of the Accommodation, the endpoint Accommodation for the admin
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 */
router.get("/trending", AccommodationController.trending);
/**
 * @swagger
 * /accommodation/{aid}/rooms:
 *   get:
 *     parameters:
 *      - name: aid
 *        in: path
 *        required: true
 *        type: string
 *        description:  Specific application
 *     summary: Returns the rooms of that specific hotel
 *     tags: [Accommodation]
 *     responses:
 *       200:
 *         description: The list of the Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 *       400:
 *         description: The list of the Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationError'
 */
router.get("/:id/rooms", AccommodationController.rooms);
router.get("/:id/subRoomType", AccommodationController.subRoomType);
/**
 * @swagger
 * /accommodation/{aid}:
 *   get:
 *     parameters:
 *      - name: aid
 *        in: path
 *        required: true
 *        type: string
 *        description:  Specific application
 *     summary: Returns specific Accommodation
 *     tags: [Accommodation]
 *     responses:
 *       200:
 *         description: The list of the Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 *       400:
 *         description: The list of the Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationError'
 */
router.get("/:id", AccommodationController.fetchOne);
/**
 * @swagger
 * /accommodation/:
 *   post:
 *     summary: owner creates accommodation aka Hotel
 *     tags: [Accommodation]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Display by statys
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/accommodation'
 *     responses:
 *       200:
 *         description: On Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ApplicationStatus'
 *       400:
 *         description: On error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationError'
 */
router.post(
  "/",
  accessControl(["super_admin", "sales", "owner"]),
  AccommodationController.create
);
/**
 * @swagger
 * /accommodation/upload_spreadsheet:
 *   post:
 *     summary: administrator upload the recorded spreadsheet
 *     tags: [Accommodation]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Upload CSV or XLSX file
 *     responses:
 *       200:
 *         description: On Success response
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/AccommodationSuccess'
 *       400:
 *         description: On error response
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/AccommodationError'
 */
router.post(
  "/upload_spreadsheet",
  accessControl(["super_admin", "sales"]),
  AccommodationController.uploadSpreadSheet
);
/**
 * @swagger
 * /accommodation/filter:
 *   post:
 *     summary: filters out lists of accommodation filtered by users or guest
 *     tags: [Accommodation]
 *     requestBody:
 *        description:  Display by status
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/accommodationFilter'
 *     responses:
 *       200:
 *         description: On Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 */
router.post("/filter", AccommodationController.filter);
/**
 * @swagger
 * /accommodation/nearBy:
 *   post:
 *     summary: filters out lists of accommodation filtered by users or guest
 *     tags: [Accommodation]
 *     requestBody:
 *        description:  Display by status
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/saveLocation'
 *     responses:
 *       200:
 *         description: On Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 */
router.post("/nearBy", AccommodationController.nearBy);
/**
 * @swagger
 * /accommodation/where_to:
 *   post:
 *     summary: filters out lists of accommodation filtered by users or guest
 *     tags: [Accommodation]
 *     requestBody:
 *        description:  Display by status
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/filterAccommodaiton'
 *     responses:
 *       200:
 *         description: On Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/accommodation'
 */
router.post("/filter/where_to", AccommodationController.where_to);
router.param("id", AccommodationController.validateAccommodation);
/**
 * @swagger
 * /accommodation/upload_house_rule:
 *   put:
 *     summary: owner upload accommodation house rule only PDF
 *     operationId: update_houseRule
 *     parameters:
 *      - name: aid
 *        in: path
 *        required: true
 *        type: string
 *        description: insert the application id
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Upload PDF file only
 *     tags: [Accommodation]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The Update Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationSuccess'
 *       400:
 *         description: The list of the Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationError'
 */
router.put(
  "/upload_house_rule",
  accessControl(["owner", "receptionist"]),
  AccommodationController.uploadHouseRUle
);
/**
 * @swagger
 * /accommodation/{aid}/upload_picture:
 *   put:
 *     summary: owner update a specific accommodation or his hotel [owner]
 *     operationId: update_accommodation
 *     parameters:
 *      - name: aid
 *        in: path
 *        required: true
 *        type: string
 *        description: insert the application id
 *     requestBody:
 *        description:  update the status to accepted or rejected
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/accommodation'
 *     tags: [Accommodation]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The Update Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationSuccess'
 *       400:
 *         description: The list of the Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationError'
 */
router.put(
  "/:id/upload_picture",
  accessControl(["owner", "receptionist"]),
  AccommodationController.uploadPicture
);
/**
 * @swagger
 * /accommodation/{aid}/review:
 *   put:
 *     summary: owner update a specific accommodation or his hotel [owner]
 *     operationId: reviewDocument
 *     parameters:
 *      - name: aid
 *        in: path
 *        required: true
 *        type: string
 *        description: insert the accommodation id
 *     requestBody:
 *        description:  update the status to accepted or rejected
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ApplicationStatus'
 *     tags: [Accommodation]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The Update Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationSuccess'
 *       400:
 *         description: The list of the Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationError'
 */
router.put(
  "/:id/review",
  accessControl(["super_admin", "sales"]),
  AccommodationController.reviewAccommodation
);
router.put(
  "/:id/address",
  accessControl(["super_admin", "owner"]),
  AccommodationController.addressUpdate
);
/**
 * @swagger
 * /accommodation/{aid}:
 *   put:
 *     operationId: upload more picture for the hotel [owner]
 *     parameters:
 *      - name: aid
 *        in: path
 *        required: true
 *        type: string
 *        description: insert the application id
 *     requestBody:
 *        description:  update the status to accepted or rejected
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/UpdateApplication'
 *     summary: owner upload more picture for the hotel or accommodation
 *     tags: [Accommodation]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The Update Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationSuccess'
 *       400:
 *         description: The list of the Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationError'
 */
router.put(
  "/:id",
  accessControl(["owner", "receptionist", "super_admin"]),
  AccommodationController.update
);

/**
 * @swagger
 * /accommodation/{aid}/remove_picture?picture={picture}:
 *   delete:
 *     summary: owner remove a specific accommodation pictures [owner]
 *     operationId: remove_accommodation_picture
 *     parameters:
 *      - name: aid
 *        in: path
 *        required: true
 *        type: string
 *        description: insert the application id
 *      - name: picture
 *        in: query
 *        required: true
 *        type: string
 *        description: insert the name of the picture
 *     tags: [Accommodation]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The Update Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationSuccess'
 *       400:
 *         description: The list of the Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationError'
 */
router.delete(
  "/:id/remove_picture",
  accessControl(["owner", "receptionist"]),
  AccommodationController.removePicture
);
/**
 * @swagger
 * /accommodation/{aid}:
 *   delete:
 *     parameters:
 *      - name: aid
 *        in: path
 *        required: true
 *        type: string
 *        description: remove Specific accommodation or hotel [super_admin, sales]
 *     summary: remove specific accommodaiton or hotel action performed by [super_admin, sales]
 *     tags: [Accommodation]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The remove Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationSuccess'
 *       400:
 *         description: The list of the Accommodation, the endpoint Accommodation for firebase authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccommodationError'
 */
router.delete(
  "/:id",
  accessControl(["super_admin", "sales"]),
  AccommodationController.deleteAccommodation
);
// Expose User Router
module.exports = router;
