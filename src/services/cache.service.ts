import { createClient } from 'redis';

class CacheService {
    private client;
    private readonly DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

    constructor() {
        this.client = createClient();
        this.client.on('error', (err) => console.log('Redis Client Error', err));
        this.connect();
    }

    private async connect() {
        try {
            await this.client.connect();
        } catch (error) {
            console.error('Redis connection error:', error);
        }
    }

    async get(key: string) {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    async set(key: string, value: any, expiration: number = this.DEFAULT_EXPIRATION) {
        try {
            await this.client.setEx(key, expiration, JSON.stringify(value));
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }

    async clear(key: string) {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Redis delete error:', error);
        }
    }
}

export const cacheService = new CacheService();
