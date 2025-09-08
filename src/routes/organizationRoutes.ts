    import { Router } from 'express';
    import { authenticateToken } from '../middleware/JwtParsing';
    import { OrganizationController } from '../controller/OrganizationController';
    import { hasRole } from '../middleware/RoleMiddleware';

    const router = Router();

    /**
     * @swagger
     * tags:
     *   name: Organizations
     *   description: Organization management API
     */


    // create organization endpoint
/**
 * @swagger
 * /organizations:
 *   post:
 *     summary: Create a new organization 
 *     tags: [Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - orgAdmins
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Death Corp"
 *               description:
 *                 type: string
 *                 example: "A morally bankrupt organization from the underworld."
 *               address:
 *                 type: string
 *                 example: "666 Inferno Blvd"
 *               city:
 *                 type: string
 *                 example: "Hell City"
 *               country:
 *                 type: string
 *                 example: "Netherworld"
 *               phoneNumber:
 *                 type: string
 *                 example: "+666 999 000"
 *               website:
 *                 type: string
 *                 example: "https://deathcorp.hell"
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Organization created successfully.
 *                 organization:
 *                   type: object
 *                 subOrganizations:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request (e.g. missing orgAdmins or invalid input)
 *       404:
 *         description: Required role not found or user not found
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticateToken, hasRole(['admin']), OrganizationController.createOrganization);


    // get all organizations
    /**
 * @swagger
 * /organizations:
 *   get:
 *     summary: Get all organizations (paginated)
 *     tags: [Organizations]
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
 *         description: Items per page (optional)
 *     responses:
 *       200:
 *         description: Organizations retrieved
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
 *                 organizations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       owner:
 *                         type: object
 *                       parentOrg:
 *                         type: object
 *       500:
 *         description: Internal server error
 */
    router.get('/', authenticateToken, hasRole(['admin']), OrganizationController.getAllOrganizations);



    // get single organization endpoint
    /**
     * @swagger
     * /organizations/{id}:
     *   get:
     *     summary: Get an organization by ID
     *     tags: [Organizations]
     *     security:
     *         - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Organization ID
     *     responses:
     *       200:
     *         description: Organization details retrieved successfully
     *       404:
     *         description: Organization not found
     *       500:
     *         description: Server error
     */
    router.get('/:id', authenticateToken, OrganizationController.getOrganization);



    // update organization
/**
 * @swagger
 * /organizations/{id}:
 *   put:
 *     summary: Update basic organization info and org admins
 *     tags:
 *       - Organizations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Org Name"
 *               description:
 *                 type: string
 *                 example: "Organization description"
 *               address:
 *                 type: string
 *                 example: "123 Main St"
 *               city:
 *                 type: string
 *                 example: "Kigali"
 *               country:
 *                 type: string
 *                 example: "Rwanda"
 *               phoneNumber:
 *                 type: string
 *                 example: "+250 788 123 456"
 *               website:
 *                 type: string
 *                 example: "https://orgsite.com"
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Organization updated."
 *                 organization:
 *                   $ref: '#/components/schemas/Organization'
 *       403:
 *         description: Forbidden - Not your organization
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateToken, hasRole(['admin', 'sysadmin']), OrganizationController.updateOrganizationInfo);


    // delete organization
    /**
     * @swagger
     * /organizations/{id}:
     *   delete:
     *     summary: Delete an organization by ID
     *     tags: [Organizations]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Organization ID
     *     responses:
     *       200:
     *         description: Organization deleted successfully
     *       404:
     *         description: Organization not found
     *       500:
     *         description: Server error
     */
    router.delete('/:id', authenticateToken, hasRole(['admin', 'sysadmin']), OrganizationController.deleteOrganization);




/**
 * @swagger
 * /organizations/{id}/members:
 *   get:
 *     summary: Get all members of an organization including sub-organization members
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the organization
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Members retrieved successfully
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
 *                 members:
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
 *                       role:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                       organization:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           parentOrg:
 *                             type: integer
 *                             nullable: true
 *                       isSubOrgMember:
 *                         type: boolean
 *                         description: True if user belongs to a sub-organization
 *       400:
 *         description: Invalid organization ID
 *       500:
 *         description: Server error
 */
router.get('/:id/members', authenticateToken, hasRole(['admin', 'sysadmin']), OrganizationController.getAllMembers);

export default router;
