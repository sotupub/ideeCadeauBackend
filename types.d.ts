declare module "express-serve-static-core" {
    interface Request {
        currentUser?: {
            id: number;
        };
    }
}