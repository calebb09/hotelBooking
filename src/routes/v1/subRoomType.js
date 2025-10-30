const express = require("express");
const subRoomTypeController = require("../../controllers/subRoomType");
const accessControl = require("../../controllers/auth").accessControl;
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     subRoomType:
 *       type: object
 *       required:
 *         - job
 *       properties:
 *         accommodation:
 *           type: objectId
 *           description: the accommodationId
 *         name:
 *           type: string
 *           description: name in english
 *         roomType:
 *           type: objectId
 *           description: the icon image of the subRoomType
 *         facilities:
 *           type: array
 *           description: the amneties lists
 *           example:
 *              - 68a6d1d62f924ab4da57a180
 *              - 68a6d1e02f924ab4da57a184
 *         rooms:
 *           type: array
 *           description: this array will fetch lists of rooms from the rooms collection with the subRoomTypeId and push it here..
 *           example:
 *              - 68a6d1d62f924ab4da57a180
 *              - 68a6d1e02f924ab4da57a184
 *         bed_info:
 *           type: array
 *           items:
 *            type: object
 *            properties:
 *              amount:
 *                type: number
 *                example: 2
 *                description: the amount of bed
 *              types:
 *                type: string
 *                description: accpets only single or double
 *                example: single
 *         number_of_guests:
 *           type: number
 *           example: 5
 *         smoking:
 *           type: boolean
 *           example: false
 *         price_info:
 *           type: object
 *           properties:
 *             discount:
 *                type: string
 *                description: the discount per one room
 *                example: 10%
 *             room_price:
 *                type: number
 *                description: the price of the room
 *                example: 210
 *             commissioninPercent:
 *                type: string
 *                description: commission in percent
 *                example: 20%
 *             commissionAmount:
 *                type: number
 *                description: the amount to be deducted from the user
 *                example: 44
 *             actual_price:
 *                type: number
 *                description: the total amount including the stripe fee
 *                example: 245
 *             refundable_price:
 *                type: number
 *                description: this will be fetched from property model
 *                example: 22
 *             has_discount:
 *                type: boolean
 *                example: true
 *             discountInfo:
 *                description: this could be null is has_discount is false
 *                properties:
 *                  original_price:
 *                    type: number
 *                    example: 22
 *                  room_price:
 *                    type: number
 *                    example: 22
 *                  actual_price:
 *                    type: number
 *                    example: 22
 *         rates:
 *           type: objectId
 *           description: it is an array containing objectId from the review model
 *           example:
 *              - weigweruitrwetwreltwret
 *              - sjfdghlkjsg;sdfgsdfgsdfg
 *         rate_average:
 *           type: number
 *           description: average rating calclulated from the rating model for this specific room
 *           example: 4.2
 *         description:
 *           type: string
 *           description: description of the subRoomType
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *     createSubRoom:
 *      type: object
 *      properties:
 *         name:
 *           type: string
 *           description: name in english
 *           example: deluxe
 *         roomType:
 *           type: objectId
 *           description: the icon image of the subRoomType
 *           example: 68a6d1752f924ab4da57a17a
 *         facilities:
 *           type: array
 *           description: the amneties lists
 *           example:
 *              - 68a6d1d62f924ab4da57a180
 *              - 68a6d1e02f924ab4da57a184
 *         bed_info:
 *           type: array
 *           items:
 *            type: object
 *            properties:
 *              amount:
 *                type: number
 *                example: 2
 *                description: the amount of bed
 *              types:
 *                type: string
 *                description: accpets only single or double
 *                example: single
 *         number_of_guests:
 *           type: number
 *           example: 5
 *         smoking:
 *           type: boolean
 *           example: false
 *         room_price:
 *           type: number
 *           example: 600
 *         discount:
 *           type: string
 *           example: 20%
 *           description: this is optional
 *         description:
 *           type: string
 *           description: description of the subRoomType
 *           example: write something about the subRoomType description
 *     showRooms:
 *      type: object
 *      properties:
 *        rooms:
 *          type: array
 *          items:
 *            type: object
 *            properties:
 *              _id:
 *                type: objectId
 *                description: The auto-generated id of the Room
 *              subRoomType:
 *                type: objectId
 *                description: subRoomType id
 *                example: 039231493249132490123094
 *              room_number:
 *                type: string
 *                description: the name of the room
 *                example: 301
 *              status:
 *                type: string
 *                description: what is the status of the room
 *                example: available
 *              created_at:
 *                type: date
 *                description: The date applied
 *              updated_at:
 *                type: date
 *                description: the date updated
 *        available:
 *          type: number
 *          description: number of available rooms
 *          example: 5
 *     subRoomTypeError:
 *       example:
 *         msg: Error
 *         status: 400
 *     subRoomTypeSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 *     Createsubcategories:
 *       type: object
 *       required:
 *          - name
 *       properties:
 *          name:
 *            type: string
 *          icon:
 *            type: string
 *          description:
 *            type: string
 *          tags:
 *            type: array
 *       example:
 *          name: Double bedroom
 *          category: 842358204353435ASDASDF
 *          description: lorem ipsum
 *          tags:
 *            - 2 bed
 *            - balcony
 *            - romance
 */

/**
 * @swagger
 * tags:
 *   name: subRoomType
 *   description: The subRoomType managing API [v1]
 */
/**
 * @swagger
 * /sub_room_type?page=1:
 *   get:
 *     summary: Returns the list of all the subRoomType of the rooms
 *     tags: [subRoomType]
 *     responses:
 *       200:
 *         description: The list of the subRoomType
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/subRoomType'
 */
router.get(
  "/",
  accessControl(["owner", "receptionist"]),
  subRoomTypeController.fetchAll
);
/**
 * @swagger
 * /sub_room_type/myRoomTypes?page=1:
 *   get:
 *     summary: Returns the list of all the subRoomType of the rooms
 *     tags: [subRoomType]
 *     responses:
 *       200:
 *         description: The list of the subRoomType
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/subRoomType'
 */
router.get(
  "/myRoomTypes",
  accessControl(["owner", "receptionist"]),
  subRoomTypeController.myrooms
);
/**
 * @swagger
 * /sub_room_type/{cid}/rooms:
 *   get:
 *     summary: Returns the list of all the room based on the subRoomType id
 *     tags: [subRoomType]
 *     parameters:
 *      - name: cid
 *        in: path
 *        required: true
 *        type: string
 *        description: get employees lists
 *     responses:
 *       200:
 *         description: The list of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/showRooms'
 */
router.get("/:id/rooms/", subRoomTypeController.fetchRooms);
/**
 * @swagger
 * /sub_room_type/{cid}:
 *   get:
 *     summary: Get Specific subRoomType
 *     tags: [subRoomType]
 *     parameters:
 *      - name: cid
 *        in: path
 *        required: true
 *        type: string
 *        description: get subRoomType
 *     responses:
 *       200:
 *         description: Specific subRoomType
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/subRoomType'
 */
router.get("/:id", subRoomTypeController.fetchOne);
/**
 * @swagger
 * /sub_room_type/:
 *   post:
 *     summary: Create subRoomType, owner and receptionist creates this subcatagories
 *     tags: [subRoomType]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  create a new subRoomType
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/createSubRoom'
 *     responses:
 *       200:
 *         description: Specific subRoomType
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/subRoomType'
 */
router.post(
  "/",
  accessControl(["owner", "receptionist"]),
  subRoomTypeController.create
);
router.param("id", subRoomTypeController.validatesubRoomType);
/**
 * @swagger
 * /sub_room_type/{cid}:
 *   put:
 *     summary: Update Specific subRoomType action is performed by owner, super_admin & receptionist
 *     tags: [subRoomType]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: cid
 *        in: path
 *        required: true
 *        type: string
 *        description: update cid
 *      - name: tags
 *        in: path
 *        required: true
 *        type: string
 *        description: update tags
 *      - name: description
 *        in: path
 *        required: true
 *        type: string
 *        description: update description
 *      - name: icon
 *        in: path
 *        required: true
 *        type: string
 *        description: update icon
 *     responses:
 *       200:
 *         description: Update subRoomType
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/subRoomType'
 */
router.put(
  "/:id",
  accessControl(["owner", "receptionist", "super_admin"]),
  subRoomTypeController.update
);
/**
 * @swagger
 * /sub_room_type/{cid}/upload_picture:
 *   patch:
 *     summary: Update Specific subRoomType action is performed by owner, super_admin & receptionist
 *     tags: [subRoomType]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: cid
 *        in: path
 *        required: true
 *        type: string
 *        description: update cid
 *     responses:
 *       200:
 *         description: success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/subRoomTypeSuccess'
 *       400:
 *         description: error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/subRoomTypeError'
 */
router.patch(
  "/:id/upload_picture",
  accessControl(["owner", "receptionist", "super_admin"]),
  subRoomTypeController.upload_picture
);
router.delete(
  "/:id/remove_pictures",
  accessControl(["receptionist", "owner"]),
  subRoomTypeController.deletePicture
);
/**
 * @swagger
 * /sub_room_type/{cid}:
 *   delete:
 *     summary: Remove Specific subRoomType performed by owner, receptionist, super_admin
 *     description: since the super_admin have all the permission, it can make CRUD operation if requested by the clients
 *     tags: [subRoomType]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: cid
 *        in: path
 *        required: true
 *        type: string
 *        description: Put the subRoomType ID
 *     responses:
 *       200:
 *         description: Remove subRoomType subRoomType
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/subRoomTypeSuccess'
 *       400:
 *         description: Remove subRoomType subRoomType
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/subRoomTypeError'
 */
router.delete(
  "/:id",
  accessControl(["owner", "receptionist", "super_admin"]),
  subRoomTypeController.delete
);

// Expose User Router
module.exports = router;
