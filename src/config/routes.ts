import express from 'express';
import { userRouter } from '../routes/user.route';
import { authRouter } from '../routes/auth.route';
import { categoryRouter } from '../routes/category.route';
import { subCategoryRouter } from '../routes/subcategory.route';

const router = express.Router();

router.use('/user', userRouter);
router.use('/auth', authRouter);
router.use("/category", categoryRouter);
router.use("/subcategory", subCategoryRouter);


export default router;
