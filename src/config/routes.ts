import express from 'express';
import { userRouter } from '../routes/user.route';
import { authRouter } from '../routes/auth.route';
import { categoryRouter } from '../routes/category.route';

const router = express.Router();

router.use('/user', userRouter);
router.use('/auth', authRouter);
router.use("/category", categoryRouter);


export default router;
