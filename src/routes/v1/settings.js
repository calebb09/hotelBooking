const express = require("express");
const SettingController = require("../../controllers/settings");
const accessControl = require("../../controllers/auth").accessControl;
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     SettingSchema:
 *       type: object
 *       required:
 *         - commission
 *       properties:
 *         commission:
 *          type: object
 *          properties:
 *              client:
 *                  type: string
 *                  descirption: the percentage of the commission
 *                  example: 20%
 *              user:
 *                  type: string
 *                  description: commission amount from the end-user
 *                  example: 20%
 *         currency:
 *          type: string
 *          description: currency type
 *          example: USD
 *     SettingError:
 *       example:
 *         msg: Error
 *         status: 400
 *     SettingSuccess:
 *       msg:
 *         type: string
 *         description: the response body
 *         example: successful
 *       status:
 *         type: number
 *         description: the status code
 *         example: 201
 */
/**
 * @swagger
 * tags:
 *   name: Setting
 *   description: The Setting managing API [v1]
 */
/**
 * @swagger
 * /setting_charge/:
 *   get:
 *     summary: Returns the list of all Setting
 *     tags: [Setting]
 *     responses:
 *       200:
 *         description: The list of Settings meaning mobile Setting
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SettingSchema'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SettingError'
 */
router.get("/", SettingController.fetch);
/**
 * @swagger
 * /setting/create:
 *   post:
 *     summary: create Setting charge only super_admin performs this
 *     tags: [Setting]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  create Setting meaning the commission to be deducted from customer and hotel
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/SettingSchema'
 *     responses:
 *       200:
 *         description: The list of Settings meaning mobile Setting
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SettingSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SettingError'
 */
router.post(
  "/create",
  accessControl(["super_admin"]),
  SettingController.createSetting
);
/**
 * @swagger
 * /setting/{id}:
 *   put:
 *     summary: Update Setting charge performed by super_admin
 *     tags: [Setting]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        type: string
 *        description: Setting ID the mongodb ID created by default
 *     requestBody:
 *        description:  create Setting
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/SettingSchema'
 *     responses:
 *       200:
 *         description: The list of Settings meaning mobile Setting
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SettingSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SettingError'
 */
router.put(
  "/:id",
  accessControl(["super_admin"]),
  SettingController.updateSetting
);
/**
 * @swagger
 * /setting/{id}:
 *   delete:
 *     summary: remove Setting performed by super_admin
 *     tags: [Setting]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        type: string
 *        description: Setting ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The list of Settings meaning mobile Setting
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SettingSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SettingError'
 */
router.delete(
  "/:id",
  accessControl(["super_admin"]),
  SettingController.deleteSetting
);
router.param("id", SettingController.validateSetting);
// Expose User Router
module.exports = router;
