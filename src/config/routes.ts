import express from 'express';
import { userRouter } from '../routes/user.route';
import { authRouter } from '../routes/auth.route';
import { categoryRouter } from '../routes/category.route';
import { subCategoryRouter } from '../routes/subcategory.route';
import { modelRouter } from '../routes/model.route';
import { productRouter } from '../routes/product.route';
import { orderRouter } from '../routes/order.route';
import { reviewRouter } from '../routes/review.route';
import { widgetRouter } from '../routes/widget.route';
import { contactRouter } from '../routes/contact.route';
import { devisRouter } from '../routes/devis.route';

const router = express.Router();

router.use('/user', userRouter);
router.use('/auth', authRouter);
router.use("/category", categoryRouter);
router.use("/subcategory", subCategoryRouter);
router.use("/model", modelRouter);
router.use("/product", productRouter);
router.use("/order", orderRouter);
router.use("/review", reviewRouter);
router.use("/widget", widgetRouter);
router.use("/contact", contactRouter);
router.use("/devis", devisRouter);


export default router;
