// testApi.js
async function testGeminiAPI() {
    try {
        const response = await fetch('http://localhost:3000/generate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: "Berikan beberapa ide untuk liburan akhir pekan di Malang."
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
        }

        const data = await response.json();
        console.log('Output dari Gemini API:', data.output);
    } catch (error) {
        console.error('Ada masalah saat mengambil data:', error);
    }
}

testGeminiAPI();