const express = require("express");
const DeviceController = require("../../controllers/device");
const accessControl = require("../../controllers/auth").accessControl;
const Authenticated = require("../../lib/firebase-middleware");
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Device:
 *       type: object
 *       required:
 *         - device_id
 *         - fcm_token
 *         - uuid
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the device
 *         uuid:
 *           type: string
 *           description: the customer firebase user UID
 *         fcm_token:
 *           type: string
 *           description: the device token fcm
 *         device_id:
 *           type: string
 *           description: the device id
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *         data:
 *           _id: 62f612951a140f007ed61432
 *           device_id: 62f5e026d0ec3ba955e074d7
 *           uuid: a943r82023jofrwelg
 *           fcm_token: 62f5e026d0ec3ba955e074d7
 *           updated_at: '2022-08-30T09:12:48.43Z'
 *           created_at: '2022-08-12T08:00:27.607Z'
 *           created_by: '352345234523452345'
 *         limit: 20
 *         skip: 1
 *         total: 1
 *     DeviceError:
 *       example:
 *         msg: Error
 *         status: 400
 *     DeviceSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 *     CreateDevice:
 *       type: object
 *       required:
 *         - device_id
 *         - fcm_token
 *         - uuid
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the device
 *         uuid:
 *           type: string
 *           description: the customer firebase user UID
 *         fcm_token:
 *           type: string
 *           description: the device token fcm
 *         device_id:
 *           type: string
 *           description: the device id
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *         device_id: 3413243.1241324
 *         uuid: pcmdsdg...
 *         fcm_token: ejsdfdsafhsjfsd...
 *     RemoveToken:
 *       type: object
 *       required:
 *         - fcm_token
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the device
 *         uuid:
 *           type: string
 *           description: the customer firebase user UID
 *         fcm_token:
 *           type: string
 *           description: the device token fcm
 *         device_id:
 *           type: string
 *           description: the device id
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *         fcm_token: ejsdfdsafhsjfsd...
 *     RemoveDevice:
 *       type: object
 *       required:
 *         - device_id
 *       properties:
 *         _id:
 *           type: objectId
 *           description: The auto-generated id
 *         uuid:
 *           type: string
 *           description: the customer firebase user UID
 *         fcm_token:
 *           type: string
 *           description: the device token fcm
 *         device_id:
 *           type: string
 *           description: the device id
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *         device_id: ejsdfdsafhsjfsd...
 */
/**
 * @swagger
 * tags:
 *   name: Device
 *   description: The Device managing API [v1]
 */
/**
 * @swagger
 * /device/all?page=1:
 *   get:
 *     summary: Returns the list of all device super_admin, admin, only access this route
 *     tags: [Device]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Devices meaning mobile device
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Device'
 */
router.get(
  "/all",
  accessControl(["admin", "super_admin"]),
  DeviceController.fetchAll
);
/**
 * @swagger
 * /device/{did}:
 *   get:
 *     summary: Returns the single device super_admin, admin, only access this route
 *     tags: [Device]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Device ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The specific device detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Device'
 */
router.get(
  "/:id",
  accessControl(["admin", "super_admin"]),
  DeviceController.fetchOne
);
/**
 * @swagger
 * /device:
 *   post:
 *     summary: Create device detail this is used by the firebase registered users that uses the mobile app
 *     tags: [Device]
 *     operationId: CreateDevice
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Device
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateDevice'
 *     responses:
 *       200:
 *         description: Create device ID and fcm token of the device that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceError'
 */
router.post("/", Authenticated, DeviceController.create);
router.param("id", DeviceController.validateDevice);
/**
 * @swagger
 * /device/{did}:
 *   put:
 *     summary: Update device detail this is used by the firebase registered users that uses the mobile app
 *     tags: [Device]
 *     security:
 *     -   bearerAuth: []
 *     operationID: update Device
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Device ID of mongodb
 *     requestBody:
 *        description:  Update Device
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateDevice'
 *     responses:
 *       200:
 *         description: Update device ID and fcm token of the device that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceError'
 */
router.put(
  "/:id",
  accessControl(["admin", "super_admin", "employee"]),
  DeviceController.update
);
/**
 * @swagger
 * /device/remove_token:
 *   delete:
 *     summary: remove fcm token of the device admin authentication required
 *     tags: [Device]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Remove FCM TOKEN
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/RemoveToken'
 *     responses:
 *       200:
 *         description: remove device by fcm token
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceError'
 */
router.delete(
  "/remove_token",
  accessControl(["admin", "super_admin"]),
  DeviceController.deleteToken
);
/**
 * @swagger
 * /device/remove_device:
 *   delete:
 *     summary: remove device super admin authenticaiton required
 *     tags: [Device]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Remove Device
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/RemoveDevice'
 *     responses:
 *       200:
 *         description: remove device by device id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceError'
 */
router.delete(
  "/remove_device",
  accessControl(["admin", "super_admin"]),
  DeviceController.removeDeviceID
);
/**
 * @swagger
 * /device/{did}:
 *   delete:
 *     summary: remove device
 *     tags: [Device]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: the device id of the mongodb
 *     responses:
 *       200:
 *         description: remove device by device id generated by the mongodb _id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeviceError'
 */
router.delete(
  "/:id",
  accessControl(["admin", "super_admin"]),
  DeviceController.deleteDevice
);

// Expose User Router
module.exports = router;
