import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Endpoint Status Sistem (Health Check)
app.get('/', (req: Request, res: Response) => {
    res.json({
        status: 'success',
        service: 'PT-JEEP Core API',
        message: 'Layanan Backend / API Integrasi beroperasi normal.'
    });
});

// Endpoint Contoh: Webhook Jembatan Timbang (Weighbridge)
app.post('/api/sensor/weighbridge', (req: Request, res: Response) => {
    const { unitCode, nettoWeight } = req.body;

    // Di sini logika untuk langsung menembak data ke Supabase tanpa lewat frontend
    console.log(`[SENSOR] Data masuk dari timbangan: Unit ${unitCode} - ${nettoWeight} WMT`);

    res.status(200).json({
        success: true,
        message: 'Data tonase berhasil disinkronisasi ke server pusat.'
    });
});

app.listen(port, () => {
    console.log(`[API] Server PT-JEEP API berjalan di http://localhost:${port}`);
});