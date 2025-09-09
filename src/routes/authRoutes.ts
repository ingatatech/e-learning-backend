import { Router } from "express";
import { UserClassController } from "../controller/UserController";
import { login, logout, resendOtp, verifyOtp, googleLogin } from "../controller/UserController";
import { authenticateToken } from "../middleware/JwtParsing";
import { upload } from "../middleware/multer";

const router = Router();

/**
 * @swagger
 * /auth/add:
 *   post:
 *     summary: Add a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 example: "johndoe@example.com"
 *               role:
 *                 type: string
 *                 example: "admin"
 *               organizationId:
 *                 type: integer
 *                 example: 5
 *                 description: "Optional organization ID"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Email already exists
 *       404:
 *         description: Role, organization or department not found
 */
router.post("/add", UserClassController.addUser.bind(UserClassController));

/**
 * @swagger
 * /auth/all:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page (optional)
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       roleName:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get("/all", authenticateToken, UserClassController.getUsers.bind(UserClassController));


/**
 * @swagger
 * /auth/get/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User fetched successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: integer
 *                     isActive:
 *                       type: boolean
 *       404:
 *         description: User not found
 */
router.get("/get/:id", UserClassController.getUserById.bind(UserClassController));


/**
 * @swagger
 * /auth/update/{id}:
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: User not found
 */
router.put("/update/:id", authenticateToken, UserClassController.updateUser.bind(UserClassController));

/**
 * @swagger
 * /auth/toggle/disabled/{id}:
 *   patch:
 *     summary: Toggle user's disabled status by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User disabled status toggled successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Error toggling user status
 */
router.patch("/toggle/disabled/:id", authenticateToken, UserClassController.toggleUserDisabled.bind(UserClassController));


/**
 * @swagger
 * /auth/delete/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete("/delete/:id", authenticateToken, UserClassController.deleteUser.bind(UserClassController));


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);


/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: User login with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token obtained from Google Sign-In
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Invalid or missing Google token
 *       401:
 *         description: No account found for this email
 *       500:
 *         description: Google login failed
 */
router.post("/google", googleLogin);



/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend login OTP to user email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "crowley@hellmail.com"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP resent. Check your email.
 *       400:
 *         description: Email is missing
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/resend-otp', resendOtp);



// Logout
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Internal server error
 */
router.post("/logout", logout);


/**
 * @swagger
 * /auth/change-password/{id}:
 *   patch:
 *     summary: Change user's password (requires old password)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "oldSecret123"
 *               newPassword:
 *                 type: string
 *                 example: "newSuperSecret123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Missing or invalid fields
 *       401:
 *         description: Old password is incorrect
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch("/change-password/:id", authenticateToken, UserClassController.changePassword);



/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP for 2FA login
 *     description: Verifies the OTP sent to the user's email after login. Grants access if OTP is valid.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP verified successfully.
 *       400:
 *         description: Bad request, missing or invalid OTP.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP is incorrect or has expired.
 *       500:
 *         description: Server error.
 */
router.post("/verify-otp", verifyOtp);



/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     description: Sends a password reset email if the user exists. No info leak on invalid email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - frontendBaseUrl
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               frontendBaseUrl:
 *                 type: string
 *                 format: uri
 *                 example: http://localhost:3000
 *     responses:
 *       200:
 *         description: Reset email sent if user exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If that email exists, a reset link has been sent.
 *       400:
 *         description: Missing or invalid input.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email and frontendBaseUrl are required.
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', UserClassController.forgotPassword);


/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     description: Resets the user password after validating reset token and email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - email
 *             properties:
 *               token:
 *                 type: string
 *                 example: some-reset-token
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Password reset successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully.
 *       400:
 *         description: Invalid token, email, or weak password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token invalid or password too short.
 *       404:
 *         description: Token expired, email not found, or mismatch.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reset token expired or invalid.
 *       500:
 *         description: Server error
 */
router.post('/reset-password', UserClassController.resetPassword);


/**
 * @swagger
 * /auth/users/{id}/profile-pic:
 *   post:
 *     summary: Upload user profile picture
 *     description: Uploads a new profile picture for the user and updates their record with the Cloudinary URL.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file to upload
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   example: https://res.cloudinary.com/your-cloud/image/upload/v123456/profile.jpg
 *       400:
 *         description: No file uploaded or invalid file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No file provided
 *       403:
 *         description: User is not authorized to update this profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       500:
 *         description: Internal server error while uploading or updating
 */
router.post('/users/:id/profile-pic', upload.single('file'), UserClassController.uploadProfilePic);

/**
 * @swagger
 * /auth/{id}/first-login:
 *   put:
 *     summary: Toggle the 'firstLogin' flag for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstLogin:
 *                 type: boolean
 *                 description: Boolean to set firstLogin status
 *             required:
 *               - firstLogin
 *     responses:
 *       200:
 *         description: Successfully updated firstLogin flag
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/:id/first-login", authenticateToken, UserClassController.toggleFirstLogin);




export default router;
