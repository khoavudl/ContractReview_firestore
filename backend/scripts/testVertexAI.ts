import { GoogleGenAI } from '@google/genai';

async function main() {
  console.log('🚀 Đang kết nối tới Google Cloud Vertex AI (Project: contractreview-v2)...');
  console.log('📍 Location: global');

  // Khởi tạo SDK sử dụng Application Default Credentials (ADC)
  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.PROJECT_ID || 'contractreview-v2',
    location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
  });

  const prompt = 'Hãy chào một câu Hello World thật hào hứng bằng tiếng Việt, giới thiệu bạn là Vertex AI Gemini 3.8 Flash đang chạy trên GCP Project contractreview-v2, và xác nhận hệ thống đã sẵn sàng!';

  try {
    console.log('⏳ Đang gửi request tới Gemini 3.8 Flash qua Vertex AI...');
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    console.log('\n================== PHẢN HỒI TỪ VERTEX AI ==================');
    console.log(response.text);
    console.log('===========================================================\n');
    console.log('🎉 XÁC NHẬN: Kết nối Vertex AI thành công 100%!');
    console.log('💰 Chi phí sẽ được tính vào GCP Billing của contractreview-v2 ($300 trial).');
  } catch (error: unknown) {
    console.error('\n❌ Gặp lỗi khi gọi Vertex AI:');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
