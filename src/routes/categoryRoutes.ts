import { Router } from "express";
import { hasRole } from "../middleware/RoleMiddleware";
import { authenticateToken } from "../middleware/JwtParsing";
import { createCategory, deleteCategory, getCategories, getCategoryById, updateCategory } from "../controller/CategoryController";

const router = Router();

router.post("/", authenticateToken, hasRole(['admin', 'sysAdmin']), createCategory);
router.get("/", authenticateToken, getCategories);
router.get("/:id", authenticateToken, getCategoryById);
router.put("/:id", authenticateToken, hasRole(['admin', 'sysAdmin']), updateCategory);
router.delete("/:id", authenticateToken, hasRole(['admin', 'sysAdmin']), deleteCategory);


export default router