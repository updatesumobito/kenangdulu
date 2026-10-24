import {z} from 'zod';

export const coupleCodeSchema=z.string().min(8,'Kode minimal 8 karakter.').max(64,'Kode maksimal 64 karakter.').regex(/^[A-Za-z0-9-]+$/,'Gunakan huruf, angka, dan tanda hubung.');
