const express = require("express");
const roomTypeController = require("../../controllers/room_type");
const accessControl = require("../../controllers/auth").accessControl;
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - job
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the Category
 *         name:
 *           type: string
 *           description: name in english
 *         icon:
 *           type: string
 *           description: the icon image of the category
 *         description:
 *           type: string
 *           description: description of the category
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *         data:
 *         - name: single bedroom
 *           description: Frenzo Frenzo Frenzo
 *           tags:
 *            - single bedroom
 *            - single
 *           created_by: 609a40f959bb476a6564d188
 *           created_at: '2022-08-03T14:53:29.056Z'
 *           updated_at: '2022-08-03T14:53:29.220Z'
 *         limit: 20
 *         skip: 1
 *         total: 1
 *     CategoryFreelancersJobs:
 *       type: object
 *       required:
 *         - job
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the Category
 *         name:
 *           en:
 *             type: string
 *             description: name in english
 *           am:
 *             type: string
 *             description: name in amharic
 *         icon:
 *           type: string
 *           description: the icon image of the category
 *         query_data:
 *           type: object
 *           properties:
 *              data:
 *                type: array
 *                description: this is where lists of data are displayed based on the selected queries. either job or freelancer data will be displayed here
 *              total:
 *                type: number
 *                description: total number of the selected query meaning [jobs | freelancers]
 *         description:
 *           type: string
 *           description: description of the category
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *         data:
 *         - name:
 *             en: Full-Stack
 *           _id: 62ea8eeca777d7d2e8d6522d
 *           tags:
 *            - mean stack
 *            - Mern Stack
 *           query_data:
 *             data:
 *             - title: Lost in the attick
 *               descripiton: this is a test job
 *               created_at: 2022-08-03T14:53:29.056Z
 *               experience: expert
 *               free_job_post: true
 *             - title: Lost in the attick of bins
 *               descripiton: Fantastic Mr. Fox have been stealing from the attick of Barns, beans and horns
 *               created_at: 2022-08-03T14:53:29.056Z
 *               experience: intermediate
 *               free_job_post: false
 *             total: 34
 *           created_by: 609a40f959bb476a6564d188
 *           created_at: '2022-08-03T14:53:29.056Z'
 *           updated_at: '2022-08-03T14:53:29.220Z'
 *         limit: 20
 *         skip: 1
 *         total: 1
 *     CategoryError:
 *       example:
 *         msg: Error
 *         status: 400
 *     CategorySuccess:
 *       example:
 *         msg: successful
 *         status: 200
 *     CreateCategories:
 *       type: object
 *       required:
 *          - name
 *       properties:
 *          name:
 *            type: string
 *          description:
 *            type: string
 *          tags:
 *            type: array
 *          accommodation:
 *            type: string
 *            description: accommodation id
 *       example:
 *          name: double bedroom
 *          description: a backend is a backbone
 *          accommodation: 609a40f959bb476a6564d188
 *          tags:
 *            - double
 *            - 2 bed
 */
/**
 * @swagger
 * tags:
 *   name: Room Type
 *   description: The Category managing API [v1]
 */
/**
 * @swagger
 * /room_type?page=1:
 *   get:
 *     summary: Returns the list of all room categories
 *     tags: [Room Type]
 *     responses:
 *       200:
 *         description: The list of the category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room_type'
 */
router.get("/", roomTypeController.fetchAll);
/**
 * @swagger
 * /room_type/myRoomTypes:
 *   get:
 *     summary: returns the category created by the hotel [owner, receptionist]
 *     tags: [Room Type]
 *     responses:
 *       200:
 *         description: The list of the category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room_type'
 */
router.get(
  "/myRoomTypes",
  accessControl(["owner", "receptionist"]),
  roomTypeController.myRoomTypes
);
/**
 * @swagger
 * /room_type/{cid}/rooms:
 *   get:
 *     summary: Returns the list of all the room based on the category id
 *     tags: [Room Type]
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
 *                 $ref: '#/components/schemas/room_type'
 */
router.get("/:id/rooms/", roomTypeController.fetchRooms);

/**
 * @swagger
 * /room_type/{cid}:
 *   get:
 *     summary: Get Specific Category
 *     tags: [Room Type]
 *     parameters:
 *      - name: cid
 *        in: path
 *        required: true
 *        type: string
 *        description: get Category
 *     responses:
 *       200:
 *         description: Specific category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room_type'
 */
router.get("/:id", roomTypeController.fetchOne);
/**
 * @swagger
 * /room_type/:
 *   post:
 *     summary: Create Category, owner and receptionist perform this action
 *     tags: [Room Type]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  create a new category
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateCategories'
 *     responses:
 *       200:
 *         description: Specific category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room_type'
 */
router.post("/", accessControl(["super_admin"]), roomTypeController.create);
router.param("id", roomTypeController.validateCategory);
/**
 * @swagger
 * /room_type/{cid}:
 *   put:
 *     summary: update category performed by receptionist and owner
 *     tags: [Room Type]
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
 *         description: Update category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room_type'
 */
router.put("/:id", accessControl(["super_admin"]), roomTypeController.update);
/**
 * @swagger
 * /room_type/{cid}:
 *   delete:
 *     summary: Remove Specific Category performed by the super_admin
 *     tags: [Room Type]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: cid
 *        in: path
 *        required: true
 *        type: string
 *        description: Put the category ID
 *     responses:
 *       200:
 *         description: Remove Category category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room_typeSuccess'
 *       400:
 *         description: Remove Category category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room_typeError'
 */
router.delete(
  "/:id",
  accessControl(["owner", "super_admin"]),
  roomTypeController.deleteCategory
);

// Expose User Router
module.exports = router;
