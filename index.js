const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors'); 

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
const upload = multer({ dest: 'uploads/' });

// Fungsi helper untuk mengonversi file lokal ke format part untuk Gemini API
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}


app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body;
    
try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ output: response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    
});

// --- Endpoint BARU untuk Audio ---
app.post('/generate-audio-text', upload.single('audioFile'), async (req, res) => {
    const { prompt } = req.body; // Prompt opsional untuk konteks audio
    const audioFile = req.file; // File audio yang diupload oleh Multer

    if (!audioFile) {
        return res.status(400).json({ error: 'Tidak ada file audio yang diupload.' });
    }

    try {
        const audioPart = fileToGenerativePart(audioFile.path, audioFile.mimetype);
        
        // Buat array konten. Prompt teks opsional bisa digabungkan dengan audio.
        const parts = [audioPart];
        if (prompt) {
            parts.unshift({ text: prompt }); // Tambahkan prompt di awal array jika ada
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        // Hapus file audio setelah selesai diproses
        fs.unlink(audioFile.path, (err) => {
            if (err) console.error('Error menghapus file audio:', err);
        });

        res.json({ output: text });

    } catch (error) {
        console.error('Error saat memanggil Gemini API (audio):', error);
        // Hapus file jika terjadi error juga
        if (audioFile && fs.existsSync(audioFile.path)) {
            fs.unlink(audioFile.path, (err) => {
                if (err) console.error('Error menghapus file audio setelah error:', err);
            });
        }
        res.status(500).json({ error: error.message || 'Gagal memproses audio.' });
    }
});

// --- Endpoint BARU untuk Gambar ---
app.post('/generate-image-text', upload.single('imageFile'), async (req, res) => {
    const { prompt } = req.body; // Prompt teks untuk konteks gambar
    const imageFile = req.file; // File gambar yang diupload oleh Multer

    if (!imageFile) {
        return res.status(400).json({ error: 'Tidak ada file gambar yang diupload.' });
    }

    try {
        const imagePart = fileToGenerativePart(imageFile.path, imageFile.mimetype);
        
        // Buat array konten. Prompt teks opsional bisa digabungkan dengan gambar.
        const parts = [imagePart];
        if (prompt) {
            parts.unshift({ text: prompt }); // Tambahkan prompt di awal array jika ada
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        // Hapus file gambar setelah selesai diproses
        fs.unlink(imageFile.path, (err) => {
            if (err) console.error('Error menghapus file gambar:', err);
        });

        res.json({ output: text });

    } catch (error) {
        console.error('Error saat memanggil Gemini API (gambar):', error);
        // Hapus file jika terjadi error juga
        if (imageFile && fs.existsSync(imageFile.path)) {
            fs.unlink(imageFile.path, (err) => {
                if (err) console.error('Error menghapus file gambar setelah error:', err);
            });
        }
        res.status(500).json({ error: error.message || 'Gagal memproses gambar.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
 console.log(`Gemini API server is running at http://localhost:${PORT}`);

});
