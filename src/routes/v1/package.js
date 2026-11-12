const express = require("express");
const packageController = require("../../controllers/package");
const accessControl = require("../../controllers/auth").accessControl;
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     package:
 *       type: object
 *       required:
 *         - name
 *         - period
 *         - price
 *         - commission
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the package
 *         name:
 *           type: string
 *           description: the name of the packege
 *           example: Golden
 *         period:
 *           type: string
 *           description: auto defined strings
 *           example: annual
 *         price:
 *           type: number
 *           description: the package price
 *           example: 200
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *     packageError:
 *       example:
 *         msg: Error
 *         status: 400
 *     packageSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 */
/**
 * @swagger
 * tags:
 *   name: package
 *   description: The package managing API [v1]
 */
/**
 * @swagger
 * /package:
 *   get:
 *     summary: Returns the list of all package super_admin, owner and receptionist, only access this route
 *     tags: [package]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: this will enable for the owner meaning the hotel to buy package and be listed in the top
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/package'
 */
router.get(
  "/",
  accessControl(["super_admin", "owner", "receptionist"]),
  packageController.fetchAll
);
/**
 * @swagger
 * /package/{did}/subscribe:
 *   get:
 *     summary: this is a subscription routes only owner perform this action for the accommodation
 *     tags: [package]
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: package ID the mongodb ID created by default
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of packages meaning mobile package
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/packageSuccess'
 *       400:
 *         description: The list of packages meaning mobile package
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/packageError'
 */
router.get(
  "/:id/subscribe/",
  accessControl(["owner"]),
  packageController.subscribe
);
/**
 * @swagger
 * /package/{did}:
 *   get:
 *     summary: Returns the single package owner, super_admin,sales, only access this route
 *     tags: [package]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: package ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The specific package detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/package'
 */
router.get("/:id", packageController.fetchOne);
/**
 * @swagger
 * /package:
 *   post:
 *     summary: Create package detail this is used by the super_admin
 *     tags: [package]
 *     operationId: Create_Package
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create package
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/package'
 *     responses:
 *       200:
 *         description: Create package ID and fcm token of the package that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/packageSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/packageError'
 */
router.post("/", accessControl(["super_admin"]), packageController.create);
router.param("id", packageController.validatePackage);
/**
 * @swagger
 * /package/{did}:
 *   put:
 *     summary: Update package detail this is used by the firebase registered users that uses the mobile app
 *     tags: [package]
 *     security:
 *     -   bearerAuth: []
 *     operationID: update package
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: package ID of mongodb
 *     requestBody:
 *        description:  Update package
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/package'
 *     responses:
 *       200:
 *         description: Update package ID and fcm token of the package that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/packageSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/packageError'
 */
router.put(
  "/:id",
  accessControl(["sales", "super_admin"]),
  packageController.update
);
/**
 * @swagger
 * /package{did}:
 *   delete:
 *     summary: remove package super_admin and sales perform this action
 *     tags: [package]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: the package id of the mongodb
 *     responses:
 *       200:
 *         description: remove package by package id generated by the mongodb _id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/packageSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/packageError'
 */
router.delete(
  "/:id",
  accessControl(["super_admin", "sales"]),
  packageController.deletepackage
);

// Expose User Router
module.exports = router;
